/** When ALLOW_DAILY_CHALLENGE_RETRY=true, replay today's challenge (for local dev or demo deploys). */
export function allowDailyChallengeRetry(): boolean {
  return process.env.ALLOW_DAILY_CHALLENGE_RETRY === "true";
}

/** Demo: unique question sets per day before the rotation restarts (seed 1 → 6 → seed 1). */
export const DEMO_QUESTION_SETS_PER_CYCLE = 6;
