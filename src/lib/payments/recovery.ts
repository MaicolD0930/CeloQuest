import type { Hash } from "viem";
import { createChainPublicClient, normalizeTxHash } from "@/lib/chain/public-client";
import { getRecoveryContractAddress } from "@/lib/contracts/recovery-payment";
import { getRecoveryPriceAtomicAsync } from "@/lib/pricing/recovery-price";
import {
  getRecoveryTreasury,
  RECOVERY_DEMO_MODE,
  getRecoveryTokenAddress,
  normalizeRecoveryTokenParam,
  type RecoveryTokenId,
} from "@/lib/tokens/recovery";
import {
  buildPaymentRecordFromEvent,
  recordRecoveryPayment,
  type RecoveryPaymentRecord,
} from "@/lib/payments/record-payment";
import { decodeRecoveryPaymentFromReceipt, decodeDirectTransferFromReceipt, decodeTreasuryTransferFromReceipt } from "@/lib/payments/verify-recovery-receipt";
import { resolveRecoveryVerifyTokenAddresses } from "@/lib/chain/minipay-tokens";
import { resolveTreasuryAddress } from "@/lib/payments/prepare-recovery";

export { RECOVERY_DEMO_MODE, getRecoveryTokenAddress, getRecoveryTreasury };

export type VerifiedRecoveryPayment = RecoveryPaymentRecord;

function resolveTokenAddress(token: string): `0x${string}` | null {
  const id = normalizeRecoveryTokenParam(token);
  return getRecoveryTokenAddress(id);
}

type VerifyResult =
  | { ok: true; payment: VerifiedRecoveryPayment }
  | { ok: false; reason: string };

/** Poll delays for receipt + log indexing (MiniPay / mobile RPC can lag). */
const RECEIPT_POLL_MS = [
  0, 400, 800, 1200, 2000, 3000, 4000, 5000, 6000, 8000, 10000,
];

/** Fast poll for API routes (must finish within Vercel Hobby ~10s). */
export const API_REFILL_VERIFY_MS = 6500;

function pollSchedule(maxWaitMs?: number): number[] {
  if (!maxWaitMs || maxWaitMs <= 0) return RECEIPT_POLL_MS;
  const delays = [0];
  let total = 0;
  let step = 350;
  while (total < maxWaitMs) {
    delays.push(step);
    total += step;
    step = Math.min(step + 250, 1500);
  }
  return delays;
}

async function resolveMinRecoveryPrice(
  tokenId: RecoveryTokenId
): Promise<bigint> {
  return getRecoveryPriceAtomicAsync(tokenId);
}

/** Verify RecoveryPurchased event and extract payment details. */
export async function verifyRecoveryPayment(
  txHash: Hash,
  fromWallet: string,
  token: string,
  options?: { maxWaitMs?: number }
): Promise<VerifyResult> {
  const normalizedHash = normalizeTxHash(txHash);

  if (RECOVERY_DEMO_MODE && normalizedHash === "0x" + "demo".repeat(21)) {
    const tokenId = normalizeRecoveryTokenParam(token) as RecoveryTokenId;
    const tokenAddress = resolveTokenAddress(token);
    const amount = await getRecoveryPriceAtomicAsync(tokenId);
    const payment = buildPaymentRecordFromEvent({
      txHash: normalizedHash,
      userWallet: fromWallet,
      tokenAddress: tokenAddress ?? ("0x0" as `0x${string}`),
      amountAtomic: amount,
      tokenParam: token,
    });
    return { ok: true, payment };
  }

  const contractAddress = getRecoveryContractAddress();
  const tokenId = normalizeRecoveryTokenParam(token);
  const tokenAddress = resolveTokenAddress(token);
  const treasuryAddress = await resolveTreasuryAddress();
  const verifyTokenAddresses =
    tokenAddress != null
      ? resolveRecoveryVerifyTokenAddresses(tokenId, tokenAddress)
      : [];

  if (!contractAddress || !tokenAddress || verifyTokenAddresses.length === 0) {
    return { ok: false, reason: "PAYMENT_NOT_CONFIGURED" };
  }

  const client = createChainPublicClient();
  const minPrice = await resolveMinRecoveryPrice(tokenId);
  const allowedTokens = new Set(
    verifyTokenAddresses.map((a) => a.toLowerCase())
  );

  let lastReason = "TX_NOT_FOUND";
  const delays = pollSchedule(options?.maxWaitMs);

  for (const delayMs of delays) {
    if (delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }

    let receipt;
    let payerWallet: `0x${string}` | null = null;
    try {
      const [receiptResult, tx] = await Promise.all([
        client.getTransactionReceipt({ hash: normalizedHash }),
        client.getTransaction({ hash: normalizedHash }),
      ]);
      receipt = receiptResult;
      payerWallet = tx.from;
    } catch {
      continue;
    }

    if (receipt.status !== "success") {
      return { ok: false, reason: "TX_FAILED" };
    }

    if (treasuryAddress) {
      const treasuryDecoded = decodeTreasuryTransferFromReceipt(receipt, {
        txHash: normalizedHash,
        allowedTokenAddresses: allowedTokens,
        treasuryAddress,
        payerWallet: fromWallet,
        minPrice,
        tokenParam: token,
      });
      if (treasuryDecoded.ok) {
        return treasuryDecoded;
      }

      for (const verifyAddress of verifyTokenAddresses) {
        const directDecoded = decodeDirectTransferFromReceipt(receipt, {
          txHash: normalizedHash,
          tokenAddress: verifyAddress,
          treasuryAddress,
          fromWallet: payerWallet ?? fromWallet,
          minPrice,
          tokenParam: token,
        });

        if (directDecoded.ok) {
          return directDecoded;
        }

        lastReason = directDecoded.reason;
      }
    }

    if (
      payerWallet &&
      payerWallet.toLowerCase() !== fromWallet.toLowerCase()
    ) {
      return { ok: false, reason: "WALLET_MISMATCH" };
    }

    const contractDecoded = decodeRecoveryPaymentFromReceipt(receipt, {
      txHash: normalizedHash,
      contractAddress,
      tokenAddress: verifyTokenAddresses[0],
      fromWallet: payerWallet,
      minPrice,
      tokenParam: token,
    });

    if (!contractDecoded.ok) {
      for (const alt of verifyTokenAddresses.slice(1)) {
        const altDecoded = decodeRecoveryPaymentFromReceipt(receipt, {
          txHash: normalizedHash,
          contractAddress,
          tokenAddress: alt,
          fromWallet: payerWallet,
          minPrice,
          tokenParam: token,
        });
        if (altDecoded.ok) {
          return altDecoded;
        }
      }
    }

    if (contractDecoded.ok) {
      return contractDecoded;
    }

    lastReason = contractDecoded.reason;
    // Receipt mined but logs not indexed yet — keep polling.
  }

  return { ok: false, reason: lastReason };
}

/** Verify payment, persist to DB, return result for API handlers. */
export async function verifyAndRecordRecoveryPayment(
  txHash: Hash,
  fromWallet: string,
  token: string,
  options?: { maxWaitMs?: number }
): Promise<VerifyResult> {
  const result = await verifyRecoveryPayment(
    txHash,
    fromWallet,
    token,
    options
  );
  if (!result.ok) return result;

  try {
    await recordRecoveryPayment(result.payment);
  } catch (error) {
    console.error("recordRecoveryPayment failed:", error);
  }

  return result;
}
