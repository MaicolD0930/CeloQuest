import { getCeloNetwork } from "@/lib/chain/config";

/**
 * Replay today's challenge without waiting for midnight UTC.
 * - Sepolia (testnet): on by default for demos / QA on Vercel.
 * - Mainnet: off unless ALLOW_DAILY_CHALLENGE_RETRY=true.
 * - Set ALLOW_DAILY_CHALLENGE_RETRY=false to force one attempt/day on Sepolia.
 */
export function allowDailyChallengeRetry(): boolean {
  const explicit = process.env.ALLOW_DAILY_CHALLENGE_RETRY;
  if (explicit === "true") return true;
  if (explicit === "false") return false;
  return getCeloNetwork() === "sepolia";
}

/** Demo: unique question sets per day before the rotation restarts (seed 1 → 6 → seed 1). */
export const DEMO_QUESTION_SETS_PER_CYCLE = 6;
