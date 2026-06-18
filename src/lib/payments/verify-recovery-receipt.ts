import { decodeEventLog, type TransactionReceipt } from "viem";
import { recoveryPaymentAbi } from "@/lib/contracts/recovery-payment-abi";
import { erc20ExtendedAbi } from "@/lib/contracts/recovery-payment-abi";
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

/**
 * MiniPay workaround: verify ERC-20 transfer to treasury (approve + contract
 * call is unreliable inside the MiniPay webview).
 */
export function decodeDirectTransferFromReceipt(
  receipt: TransactionReceipt,
  params: {
    txHash: `0x${string}`;
    tokenAddress: `0x${string}`;
    treasuryAddress: `0x${string}`;
    fromWallet: string;
    minPrice: bigint;
    tokenParam: string;
  }
): DecodeResult {
  const user = params.fromWallet.toLowerCase();
  const token = params.tokenAddress.toLowerCase();
  const treasury = params.treasuryAddress.toLowerCase();
  const txFrom = receipt.from?.toLowerCase();

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== token) continue;

    try {
      const decoded = decodeEventLog({
        abi: erc20ExtendedAbi,
        eventName: "Transfer",
        data: log.data,
        topics: log.topics,
      });

      const transferFrom = decoded.args.from.toLowerCase();
      const senderOk = transferFrom === user || (!!txFrom && txFrom === user);

      if (
        senderOk &&
        decoded.args.to.toLowerCase() === treasury &&
        decoded.args.value >= params.minPrice
      ) {
        return {
          ok: true,
          payment: buildPaymentRecordFromEvent({
            txHash: params.txHash,
            userWallet: params.fromWallet,
            tokenAddress: params.tokenAddress,
            amountAtomic: decoded.args.value,
            tokenParam: params.tokenParam,
          }),
        };
      }
    } catch {
      // not a Transfer log
    }
  }

  return { ok: false, reason: "INVALID_PAYMENT" };
}

/**
 * Scan all receipt logs for ERC-20 transfers to treasury on allowed tokens.
 * Does not require Transfer.from === payer (MiniPay / smart-wallet safe).
 */
export function decodeTreasuryTransferFromReceipt(
  receipt: TransactionReceipt,
  params: {
    txHash: `0x${string}`;
    allowedTokenAddresses: ReadonlySet<string>;
    treasuryAddress: `0x${string}`;
    payerWallet: string;
    minPrice: bigint;
    tokenParam: string;
  }
): DecodeResult {
  const treasury = params.treasuryAddress.toLowerCase();

  for (const log of receipt.logs) {
    const logToken = log.address.toLowerCase();
    if (!params.allowedTokenAddresses.has(logToken)) continue;

    try {
      const decoded = decodeEventLog({
        abi: erc20ExtendedAbi,
        eventName: "Transfer",
        data: log.data,
        topics: log.topics,
      });

      if (
        decoded.args.to.toLowerCase() === treasury &&
        decoded.args.value >= params.minPrice
      ) {
        return {
          ok: true,
          payment: buildPaymentRecordFromEvent({
            txHash: params.txHash,
            userWallet: params.payerWallet,
            tokenAddress: log.address as `0x${string}`,
            amountAtomic: decoded.args.value,
            tokenParam: params.tokenParam,
          }),
        };
      }
    } catch {
      // not a Transfer log
    }
  }

  return { ok: false, reason: "INVALID_PAYMENT" };
}
