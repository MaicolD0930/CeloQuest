import { prisma } from "@/lib/prisma";
import { weekEnd, weekStart } from "@/lib/game";
import { capAttemptDurationMs, MAX_DAILY_ATTEMPT_DURATION_MS } from "@/lib/challenge-timer";

function seasonCalendarKey(key: string): string {
  const hash = key.indexOf("#");
  return hash === -1 ? key : key.slice(0, hash);
}

export const MAX_WEEKLY_DURATION_MS = MAX_DAILY_ATTEMPT_DURATION_MS * 7;

export function capWeeklyDurationMs(ms: number): number {
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return Math.min(Math.round(ms), MAX_WEEKLY_DURATION_MS);
}

/** Add a completed attempt duration to the user's weekly total (accumulates across days/retries). */
export function addWeeklyDurationMs(
  currentWeeklyMs: number,
  attemptMs: number
): number {
  return capWeeklyDurationMs(currentWeeklyMs + capAttemptDurationMs(attemptMs));
}

/** Sum capped daily attempt durations for a season week. */
export async function recomputeWeeklyDurationMs(
  userId: string,
  seasonWeekKey: string
): Promise<number> {
  const calendarKey = seasonCalendarKey(seasonWeekKey);
  const start = weekStart(new Date(calendarKey + "T00:00:00.000Z"));
  const end = weekEnd(new Date(calendarKey + "T00:00:00.000Z"));

  const attempts = await prisma.dailyAttempt.findMany({
    where: {
      userId,
      completedAt: { not: null, gte: start, lte: end },
    },
    select: { durationMs: true },
  });

  return attempts.reduce(
    (sum, attempt) => sum + capAttemptDurationMs(attempt.durationMs ?? 0),
    0
  );
}
