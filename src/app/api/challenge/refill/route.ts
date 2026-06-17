import { NextRequest, NextResponse } from "next/server";
import type { Hash } from "viem";
import { normalizeTxHash } from "@/lib/chain/public-client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { todayKey } from "@/lib/game";
import {
  API_REFILL_VERIFY_MS,
  verifyAndRecordRecoveryPayment,
} from "@/lib/payments/recovery";
import { normalizeRecoveryTokenParam } from "@/lib/tokens/recovery";

/** Vercel Hobby caps at 10s — keep verification under that budget. */
export const maxDuration = 10;

function refillSuccessResponse(attempt: {
  livesLeft: number;
  startedAt: Date | null;
  durationMs: number | null;
}) {
  return NextResponse.json({
    ok: true,
    livesLeft: attempt.livesLeft,
    startedAt: attempt.startedAt,
    activeDurationMs: attempt.durationMs ?? 0,
    timerPaused: false,
    message: "Life restored. Continue your daily challenge!",
  });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const rawHash = typeof body?.txHash === "string" ? body.txHash : null;
    const txHash = rawHash ? normalizeTxHash(rawHash) : null;
    const token = normalizeRecoveryTokenParam(body?.token);

    if (!txHash) {
      return NextResponse.json({ error: "txHash required" }, { status: 400 });
    }

    const date = todayKey();
    const attempt = await prisma.dailyAttempt.findUnique({
      where: { userId_date: { userId: user.id, date } },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Challenge not started" }, { status: 404 });
    }
    if (attempt.completedAt) {
      return NextResponse.json({ error: "Challenge already completed" }, { status: 409 });
    }

    if (attempt.lifeRefillUsed && attempt.refillTxHash === txHash) {
      return refillSuccessResponse(attempt);
    }

    if (attempt.lifeRefillUsed) {
      return NextResponse.json({ error: "REFILL_ALREADY_USED" }, { status: 409 });
    }

    if (attempt.result !== "awaiting_refill") {
      return NextResponse.json({ error: "Refill not available" }, { status: 400 });
    }

    const verification = await verifyAndRecordRecoveryPayment(
      txHash as Hash,
      user.walletAddress,
      token,
      { maxWaitMs: API_REFILL_VERIFY_MS }
    );
    if (!verification.ok) {
      console.error("refill verification failed", {
        reason: verification.reason,
        txHash,
        token,
        wallet: user.walletAddress,
      });
      return NextResponse.json({ error: verification.reason }, { status: 402 });
    }

    const alreadyUsedTx = await prisma.dailyAttempt.findFirst({
      where: { refillTxHash: txHash },
    });
    if (alreadyUsedTx && alreadyUsedTx.id !== attempt.id) {
      return NextResponse.json({ error: "TX_ALREADY_USED" }, { status: 409 });
    }

    const updated = await prisma.dailyAttempt.update({
      where: { id: attempt.id },
      data: {
        livesLeft: 1,
        lifeRefillUsed: true,
        result: "in_progress",
        refillTxHash: txHash,
        refillToken: token,
        startedAt: new Date(),
      },
    });

    return refillSuccessResponse(updated);
  } catch (error) {
    console.error("refill route error:", error);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
