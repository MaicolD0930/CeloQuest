import type { Hash } from "viem";
import type { DailyAttempt } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { todayKey } from "@/lib/game";
import {
  API_REFILL_VERIFY_MS,
  verifyAndRecordRecoveryPayment,
  verifyRecoveryPayment,
} from "@/lib/payments/recovery";
import {
  markRecoveryPaymentFailed,
  recordPendingRecoveryPayment,
  recordRecoveryPayment,
} from "@/lib/payments/record-payment";
import { normalizeRecoveryTokenParam } from "@/lib/tokens/recovery";

export type RefillConfirmed = {
  status: "confirmed";
  livesLeft: number;
  startedAt: Date | null;
  activeDurationMs: number;
};

export type RefillPending = {
  status: "pending";
  reason: string;
};

export type RefillFailed = {
  status: "failed";
  reason: string;
};

export type RefillProcessResult = RefillConfirmed | RefillPending | RefillFailed;

const PENDING_REASONS = new Set([
  "TX_NOT_FOUND",
  "INVALID_PAYMENT",
  "REQUEST_TIMEOUT",
  "NETWORK_ERROR",
  "SERVER_ERROR",
]);

function isPendingReason(reason: string): boolean {
  if (PENDING_REASONS.has(reason)) return true;
  if (reason.startsWith("HTTP_5")) return true;
  return false;
}

export function toRefillJson(result: RefillProcessResult) {
  if (result.status === "confirmed") {
    return {
      status: "confirmed" as const,
      ok: true,
      livesLeft: result.livesLeft,
      startedAt: result.startedAt,
      activeDurationMs: result.activeDurationMs,
      timerPaused: false,
      message: "Life restored. Continue your daily challenge!",
    };
  }
  if (result.status === "pending") {
    return {
      status: "pending" as const,
      reason: result.reason,
    };
  }
  return {
    status: "failed" as const,
    reason: result.reason,
    error: result.reason,
  };
}

async function applyRefillToAttempt(
  attemptId: string,
  txHash: string,
  token: string
): Promise<DailyAttempt> {
  return prisma.dailyAttempt.update({
    where: { id: attemptId },
    data: {
      livesLeft: 1,
      lifeRefillUsed: true,
      result: "in_progress",
      refillTxHash: txHash,
      refillToken: token,
      startedAt: new Date(),
    },
  });
}

async function revokeOptimisticRefill(
  attemptId: string,
  txHash: string
): Promise<void> {
  await markRecoveryPaymentFailed(txHash);
  await prisma.dailyAttempt.update({
    where: { id: attemptId },
    data: {
      livesLeft: 0,
      lifeRefillUsed: false,
      result: "awaiting_refill",
      refillTxHash: null,
      refillToken: null,
    },
  });
}

function confirmedFromAttempt(attempt: DailyAttempt): RefillConfirmed {
  return {
    status: "confirmed",
    livesLeft: attempt.livesLeft,
    startedAt: attempt.startedAt,
    activeDurationMs: attempt.durationMs ?? 0,
  };
}

async function finalizeVerifiedRefill(
  attempt: DailyAttempt,
  txHash: string,
  token: string,
  payment: Parameters<typeof recordRecoveryPayment>[0]
): Promise<RefillConfirmed> {
  await recordRecoveryPayment(payment, "confirmed");

  const alreadyUsedTx = await prisma.dailyAttempt.findFirst({
    where: { refillTxHash: txHash },
  });
  if (alreadyUsedTx && alreadyUsedTx.id !== attempt.id) {
    throw new Error("TX_ALREADY_USED");
  }

  const updated =
    attempt.refillTxHash === txHash && attempt.livesLeft > 0
      ? attempt
      : await applyRefillToAttempt(attempt.id, txHash, token);

  return confirmedFromAttempt(updated);
}

/**
 * Idempotent refill: optimistic grant (MiniPay) or on-chain verify + grant.
 */
export async function processRefillRequest(params: {
  userId: string;
  walletAddress: string;
  payerWallet?: string;
  txHash: string;
  token: string;
  optimistic?: boolean;
  verifyMaxWaitMs?: number;
}): Promise<RefillProcessResult> {
  const { userId, walletAddress, txHash } = params;
  const token = normalizeRecoveryTokenParam(params.token);
  const payerWallet = params.payerWallet ?? walletAddress;
  const date = todayKey();

  const attempt = await prisma.dailyAttempt.findUnique({
    where: { userId_date: { userId, date } },
  });

  if (!attempt) {
    return { status: "failed", reason: "Challenge not started" };
  }
  if (attempt.completedAt) {
    return { status: "failed", reason: "Challenge already completed" };
  }

  const existingPayment = await prisma.payment.findUnique({
    where: { txHash },
  });

  if (existingPayment?.status === "failed") {
    return { status: "failed", reason: "TX_FAILED" };
  }

  if (attempt.lifeRefillUsed && attempt.refillTxHash === txHash) {
    return confirmedFromAttempt(attempt);
  }

  if (attempt.lifeRefillUsed) {
    return { status: "failed", reason: "REFILL_ALREADY_USED" };
  }

  if (attempt.result !== "awaiting_refill") {
    return { status: "failed", reason: "Refill not available" };
  }

  if (
    existingPayment?.status === "confirmed" &&
    existingPayment.userWallet.toLowerCase() === payerWallet.toLowerCase()
  ) {
    const updated = await applyRefillToAttempt(attempt.id, txHash, token);
    return confirmedFromAttempt(updated);
  }

  // MiniPay: wallet returned hash — grant life immediately, verify later.
  if (params.optimistic) {
    await recordPendingRecoveryPayment({
      txHash,
      userWallet: payerWallet,
      token,
    });
    const updated = await applyRefillToAttempt(attempt.id, txHash, token);
    return confirmedFromAttempt(updated);
  }

  const verifyMs = params.verifyMaxWaitMs ?? API_REFILL_VERIFY_MS;
  const alreadyGranted =
    attempt.refillTxHash === txHash &&
    attempt.livesLeft > 0 &&
    existingPayment?.status === "pending";

  const verification = alreadyGranted
    ? await verifyRecoveryPayment(txHash as Hash, payerWallet, token, {
        maxWaitMs: verifyMs,
      })
    : await verifyAndRecordRecoveryPayment(
        txHash as Hash,
        payerWallet,
        token,
        { maxWaitMs: verifyMs }
      );

  if (!verification.ok) {
    if (verification.reason === "TX_FAILED" && alreadyGranted) {
      await revokeOptimisticRefill(attempt.id, txHash);
      return { status: "failed", reason: "TX_FAILED" };
    }
    if (isPendingReason(verification.reason)) {
      if (alreadyGranted) {
        return { status: "pending", reason: verification.reason };
      }
      return { status: "pending", reason: verification.reason };
    }
    return { status: "failed", reason: verification.reason };
  }

  try {
    return await finalizeVerifiedRefill(
      attempt,
      txHash,
      token,
      verification.payment
    );
  } catch {
    return { status: "failed", reason: "TX_ALREADY_USED" };
  }
}

export function httpStatusForRefill(result: RefillProcessResult): number {
  if (result.status === "confirmed") return 200;
  if (result.status === "pending") return 202;
  if (result.reason === "REFILL_ALREADY_USED") return 409;
  if (result.reason === "Challenge not started") return 404;
  if (result.reason === "Challenge already completed") return 409;
  if (result.reason === "Refill not available") return 400;
  return 402;
}
