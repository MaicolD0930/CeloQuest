import { decodeEventLog, type TransactionReceipt } from "viem";
import { recoveryPaymentAbi } from "@/lib/contracts/recovery-payment-abi";
import {
  buildPaymentRecordFromEvent,
  type RecoveryPaymentRecord,
} from "@/lib/payments/record-payment";

type DecodeResult =
  | { ok: true; payment: RecoveryPaymentRecord }
  | { ok: false; reason: "INVALID_PAYMENT" };

/** Parse RecoveryPurchased logs from an already-mined receipt. */
export function decodeRecoveryPaymentFromReceipt(
  receipt: TransactionReceipt,
  params: {
    txHash: `0x${string}`;
    contractAddress: `0x${string}`;
    tokenAddress: `0x${string}`;
    fromWallet: string;
    minPrice: bigint;
    tokenParam: string;
  }
): DecodeResult {
  const user = params.fromWallet.toLowerCase();
  const contract = params.contractAddress.toLowerCase();
  const token = params.tokenAddress.toLowerCase();

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== contract) continue;

    try {
      const decoded = decodeEventLog({
        abi: recoveryPaymentAbi,
        eventName: "RecoveryPurchased",
        data: log.data,
        topics: log.topics,
      });

      if (
        decoded.args.user.toLowerCase() === user &&
        decoded.args.token.toLowerCase() === token &&
        decoded.args.amount >= params.minPrice
      ) {
        return {
          ok: true,
          payment: buildPaymentRecordFromEvent({
            txHash: params.txHash,
            userWallet: decoded.args.user,
            tokenAddress: decoded.args.token,
            amountAtomic: decoded.args.amount,
            tokenParam: params.tokenParam,
          }),
        };
      }
    } catch {
      // not a RecoveryPurchased log
    }
  }

  return { ok: false, reason: "INVALID_PAYMENT" };
}
