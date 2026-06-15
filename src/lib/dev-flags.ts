/** Temporary flag — disabled in production even if env is set. */
export function allowDailyChallengeRetry(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.ALLOW_DAILY_CHALLENGE_RETRY === "true";
}
