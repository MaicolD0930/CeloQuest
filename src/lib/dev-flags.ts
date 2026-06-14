/** Temporary flag — set ALLOW_DAILY_CHALLENGE_RETRY=true in .env to replay today's challenge. */
export function allowDailyChallengeRetry(): boolean {
  return process.env.ALLOW_DAILY_CHALLENGE_RETRY === "true";
}
