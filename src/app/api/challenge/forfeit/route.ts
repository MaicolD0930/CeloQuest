import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { todayKey } from "@/lib/game";
import { finalizeDailyAttempt } from "@/lib/attempts";

/** End the daily attempt without refilling (wait for next UTC reset). */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const date = todayKey();
  const attempt = await prisma.dailyAttempt.findUnique({
    where: { userId_date: { userId: user.id, date } },
  });

  if (!attempt) {
    return NextResponse.json({ error: "Challenge not started" }, { status: 404 });
  }
  if (attempt.completedAt) {
    return NextResponse.json({ error: "Already completed" }, { status: 409 });
  }

  const finalized = await finalizeDailyAttempt(attempt, user, "out_of_lives");

  return NextResponse.json({
    ok: true,
    summary: {
      xpEarned: attempt.xpEarned,
      correctCount: finalized.correctCount,
      totalAnswered: finalized.totalAnswered,
      streak: finalized.streak,
      durationMs: finalized.durationMs,
      outOfLives: true,
    },
  });
}
