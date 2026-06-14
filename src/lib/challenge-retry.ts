import { prisma } from "@/lib/prisma";
import type { DailyAttempt } from "@prisma/client";
import { LIVES_PER_DAY } from "@/lib/game";
import { allowDailyChallengeRetry } from "@/lib/dev-flags";

/** Reset a finished attempt so the same-day challenge can be replayed (dev/testing). */
export async function maybeResetCompletedAttempt(
  attempt: DailyAttempt
): Promise<DailyAttempt> {
  if (!allowDailyChallengeRetry() || !attempt.completedAt) {
    return attempt;
  }

  return prisma.dailyAttempt.update({
    where: { id: attempt.id },
    data: {
      answers: "[]",
      livesLeft: LIVES_PER_DAY,
      lifeRefillUsed: false,
      result: "in_progress",
      refillTxHash: null,
      refillToken: null,
      xpEarned: 0,
      completedAt: null,
      durationMs: null,
      startedAt: new Date(),
    },
  });
}
