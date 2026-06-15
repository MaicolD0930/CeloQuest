/** Temporary flag — disabled in production even if env is set. */
export function allowDailyChallengeRetry(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.ALLOW_DAILY_CHALLENGE_RETRY === "true";
}

/** Demo: unique question sets per day before the rotation restarts (seed 1 → 6 → seed 1). */
export const DEMO_QUESTION_SETS_PER_CYCLE = 6;
