import { getCeloNetwork } from "@/lib/chain/config";

/**
 * Replay today's challenge without waiting for midnight UTC.
 * - `ALLOW_DAILY_CHALLENGE_RETRY=true` → unlimited replays (pitch / QA).
 * - `ALLOW_DAILY_CHALLENGE_RETRY=false` → one attempt per day (production default after pitch).
 * - Unset on mainnet: enabled during Spitch; set false on Vercel when the event ends.
 * - Unset on Sepolia: on by default for demos.
 */
export function allowDailyChallengeRetry(): boolean {
  const explicit =
    process.env.ALLOW_DAILY_CHALLENGE_RETRY ??
    process.env.NEXT_PUBLIC_ALLOW_DAILY_CHALLENGE_RETRY;
  if (explicit === "true") return true;
  if (explicit === "false") return false;
  if (getCeloNetwork() === "mainnet") return true;
  return getCeloNetwork() === "sepolia";
}

/** Demo: unique question sets per day before the rotation restarts (seed 1 → 6 → seed 1). */
export const DEMO_QUESTION_SETS_PER_CYCLE = 6;
