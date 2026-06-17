import type { Hash } from "viem";
import { createChainPublicClient, normalizeTxHash } from "@/lib/chain/public-client";
import { getRecoveryContractAddress, readRecoveryPriceForToken } from "@/lib/contracts/recovery-payment";
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
import { decodeRecoveryPaymentFromReceipt } from "@/lib/payments/verify-recovery-receipt";

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
  0, 2000, 3000, 4000, 6000, 8000, 10000, 12000, 15000, 18000, 22000, 26000,
  30000, 35000, 40000, 45000,
];

/** Verify RecoveryPurchased event and extract payment details. */
export async function verifyRecoveryPayment(
  txHash: Hash,
  fromWallet: string,
  token: string
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

  if (!contractAddress || !tokenAddress) {
    return { ok: false, reason: "PAYMENT_NOT_CONFIGURED" };
  }

  const client = createChainPublicClient();
  const onChainMin = await readRecoveryPriceForToken(tokenAddress);
  const minPrice =
    onChainMin && onChainMin > BigInt(0)
      ? onChainMin
      : await getRecoveryPriceAtomicAsync(tokenId);

  let lastReason = "TX_NOT_FOUND";

  for (const delayMs of RECEIPT_POLL_MS) {
    if (delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }

    let receipt;
    try {
      receipt = await client.getTransactionReceipt({ hash: normalizedHash });
    } catch {
      continue;
    }

    if (receipt.status !== "success") {
      return { ok: false, reason: "TX_FAILED" };
    }

    const decoded = decodeRecoveryPaymentFromReceipt(receipt, {
      txHash: normalizedHash,
      contractAddress,
      tokenAddress,
      fromWallet,
      minPrice,
      tokenParam: token,
    });

    if (decoded.ok) {
      return decoded;
    }

    lastReason = decoded.reason;
    // Receipt mined but logs not indexed yet — keep polling.
  }

  return { ok: false, reason: lastReason };
}

/** Verify payment, persist to DB, return result for API handlers. */
export async function verifyAndRecordRecoveryPayment(
  txHash: Hash,
  fromWallet: string,
  token: string
): Promise<VerifyResult> {
  const result = await verifyRecoveryPayment(txHash, fromWallet, token);
  if (!result.ok) return result;

  try {
    await recordRecoveryPayment(result.payment);
  } catch (error) {
    console.error("recordRecoveryPayment failed:", error);
  }

  return result;
}
