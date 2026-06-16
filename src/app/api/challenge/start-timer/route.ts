import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { todayKey } from "@/lib/game";
import {
  repairInflatedDurationMs,
  resumeAttemptTimerSegment,
} from "@/lib/challenge-timer";

/** Reset the active timer segment when the player actually starts playing. */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const date = todayKey();
  const attempt = await prisma.dailyAttempt.findUnique({
    where: { userId_date: { userId: user.id, date } },
  });

  if (!attempt || attempt.completedAt) {
    return NextResponse.json({ error: "Challenge not available" }, { status: 404 });
  }
  if (attempt.result === "awaiting_refill") {
    return NextResponse.json({
      startedAt: attempt.startedAt,
      activeDurationMs: attempt.durationMs ?? 0,
      timerPaused: true,
    });
  }

  const answerCount = JSON.parse(attempt.answers).length;
  const repairedMs = repairInflatedDurationMs(
    attempt.durationMs,
    attempt.result,
    answerCount,
    !!attempt.completedAt
  );
  const segment = resumeAttemptTimerSegment({
    ...attempt,
    durationMs: repairedMs,
  });
  const updated = await prisma.dailyAttempt.update({
    where: { id: attempt.id },
    data: {
      startedAt: segment.startedAt,
      durationMs: segment.durationMs,
    },
  });

  return NextResponse.json({
    startedAt: updated.startedAt,
    activeDurationMs: updated.durationMs ?? 0,
    timerPaused: false,
  });
}
