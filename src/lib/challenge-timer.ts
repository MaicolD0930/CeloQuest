/** Max plausible duration for one daily challenge (5 questions). */
export const MAX_DAILY_ATTEMPT_DURATION_MS = 10 * 60 * 1000;

export function capAttemptDurationMs(ms: number): number {
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return Math.min(Math.round(ms), MAX_DAILY_ATTEMPT_DURATION_MS);
}

/** Elapsed active play time for an in-progress daily attempt. */
export function getAttemptElapsedMs(attempt: {
  startedAt: Date | string;
  durationMs: number | null;
  result: string;
  completedAt?: Date | string | null;
  now?: number;
}) {
  const offset = attempt.durationMs ?? 0;

  if (attempt.result === "awaiting_refill") {
    return capAttemptDurationMs(offset);
  }

  if (
    attempt.completedAt ||
    attempt.result === "out_of_lives" ||
    attempt.result === "completed"
  ) {
    return capAttemptDurationMs(offset);
  }

  const now = attempt.now ?? Date.now();
  const segmentStart = new Date(attempt.startedAt).getTime();
  return capAttemptDurationMs(offset + Math.max(0, now - segmentStart));
}

/** Freeze elapsed time when entering awaiting_refill or finishing the attempt. */
export function pauseAttemptElapsedMs(attempt: {
  startedAt: Date | string;
  durationMs: number | null;
}) {
  const offset = attempt.durationMs ?? 0;
  const segmentStart = new Date(attempt.startedAt).getTime();
  return capAttemptDurationMs(offset + Math.max(0, Date.now() - segmentStart));
}

/** Start a fresh active segment without counting idle time since last save. */
export function resumeAttemptTimerSegment(attempt: {
  durationMs: number | null;
  result: string;
}) {
  return {
    durationMs: attempt.durationMs ?? 0,
    startedAt: new Date(),
  };
}

/** Reset inflated duration stuck at the cap while the attempt is still in progress. */
export function repairInflatedDurationMs(
  durationMs: number | null,
  result: string,
  answerCount: number,
  completed: boolean
): number {
  const ms = durationMs ?? 0;
  if (completed || result !== "in_progress") return ms;
  if (ms >= MAX_DAILY_ATTEMPT_DURATION_MS && answerCount < 5) {
    return 0;
  }
  return ms;
}
