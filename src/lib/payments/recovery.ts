import {
  createPublicClient,
  decodeEventLog,
  http,
  type Hash,
} from "viem";
import { getActiveChain, getRpcUrl } from "@/lib/chain/config";
import { recoveryPaymentAbi } from "@/lib/contracts/recovery-payment-abi";
import {
  getRecoveryContractAddress,
  readRecoveryPriceForToken,
} from "@/lib/contracts/recovery-payment";
import { getRecoveryPriceAtomicAsync } from "@/lib/pricing/recovery-price";
import {
  getRecoveryTokenAddress,
  getRecoveryTreasury,
  RECOVERY_DEMO_MODE,
  normalizeRecoveryTokenParam,
  type RecoveryTokenId,
} from "@/lib/tokens/recovery";
import {
  buildPaymentRecordFromEvent,
  recordRecoveryPayment,
  type RecoveryPaymentRecord,
} from "@/lib/payments/record-payment";

export { RECOVERY_DEMO_MODE, getRecoveryTokenAddress, getRecoveryTreasury };

export type VerifiedRecoveryPayment = RecoveryPaymentRecord;

function resolveTokenAddress(token: string): `0x${string}` | null {
  const id = normalizeRecoveryTokenParam(token);
  return getRecoveryTokenAddress(id);
}

type VerifyResult =
  | { ok: true; payment: VerifiedRecoveryPayment }
  | { ok: false; reason: string };

/** Verify RecoveryPurchased event and extract payment details. */
export async function verifyRecoveryPayment(
  txHash: Hash,
  fromWallet: string,
  token: string
): Promise<VerifyResult> {
  if (RECOVERY_DEMO_MODE && txHash === "0x" + "demo".repeat(21)) {
    const tokenId = normalizeRecoveryTokenParam(token) as RecoveryTokenId;
    const tokenAddress = resolveTokenAddress(token);
    const amount = await getRecoveryPriceAtomicAsync(tokenId);
    const payment = buildPaymentRecordFromEvent({
      txHash,
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

  const client = createPublicClient({
    chain: getActiveChain(),
    transport: http(getRpcUrl()),
  });

  let receipt;
  try {
    receipt = await client.getTransactionReceipt({ hash: txHash });
  } catch {
    return { ok: false, reason: "TX_NOT_FOUND" };
  }

  if (receipt.status !== "success") {
    return { ok: false, reason: "TX_FAILED" };
  }

  if (receipt.to?.toLowerCase() !== contractAddress.toLowerCase()) {
    return { ok: false, reason: "INVALID_PAYMENT" };
  }

  const user = fromWallet.toLowerCase();
  const onChainMin = await readRecoveryPriceForToken(tokenAddress);
  const minPrice =
    onChainMin && onChainMin > BigInt(0)
      ? onChainMin
      : await getRecoveryPriceAtomicAsync(tokenId);

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== contractAddress.toLowerCase()) continue;

    try {
      const decoded = decodeEventLog({
        abi: recoveryPaymentAbi,
        eventName: "RecoveryPurchased",
        data: log.data,
        topics: log.topics,
      });

      if (
        decoded.args.user.toLowerCase() === user &&
        decoded.args.token.toLowerCase() === tokenAddress.toLowerCase() &&
        decoded.args.amount >= minPrice
      ) {
        const payment = buildPaymentRecordFromEvent({
          txHash,
          userWallet: decoded.args.user,
          tokenAddress: decoded.args.token,
          amountAtomic: decoded.args.amount,
          tokenParam: token,
        });
        return { ok: true, payment };
      }
    } catch {
      // not a RecoveryPurchased log
    }
  }

  return { ok: false, reason: "INVALID_PAYMENT" };
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
