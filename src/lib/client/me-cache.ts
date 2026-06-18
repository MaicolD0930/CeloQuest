import { apiFetchJson } from "@/lib/client/api-fetch";

/** Short-lived client cache for GET /api/users/me (profile reads only). */
export const ME_CACHE_TTL_MS = 45_000;

export type MeUser = {
  id: string;
  username: string;
  avatar: string;
  xpTotal: number;
  weeklyXp: number;
  streak: number;
  walletAddress: string;
  locale?: string;
};

export type MeResponse = {
  isAdmin?: boolean;
  user: MeUser;
  levelInfo: {
    level: number;
    emoji?: string;
    name?: string;
    minXp?: number;
    nextLevelXp: number | null;
    progress: number;
    nextTierName?: string | null;
    xpInTier?: number;
    xpNeededForNext?: number | null;
  };
  season: { weekKey: string; startDate: string; endDate: string } | null;
  today: {
    started: boolean;
    completed: boolean;
    answeredCount: number;
    totalQuestions: number;
    livesLeft: number;
    xpEarned: number;
    awaitingRefill?: boolean;
    result?: string | null;
  };
  weekly: { xp: number; durationMs?: number; endsAt: string };
};

type CacheEntry = {
  data: MeResponse;
  fetchedAt: number;
};

let cache: CacheEntry | null = null;
let inflight: Promise<MeResponse> | null = null;

export function invalidateMeCache(): void {
  cache = null;
  inflight = null;
}

export async function fetchMe(options?: {
  force?: boolean;
}): Promise<MeResponse> {
  const force = options?.force ?? false;
  const now = Date.now();

  if (!force && cache && now - cache.fetchedAt < ME_CACHE_TTL_MS) {
    return cache.data;
  }

  if (!force && inflight) {
    return inflight;
  }

  inflight = apiFetchJson<MeResponse>("/api/users/me", {
    credentials: "include",
    label: "GET /api/users/me",
    timeoutMs: 25_000,
  })
    .then(({ data }) => {
      cache = { data, fetchedAt: Date.now() };
      return data;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

/** Warm cache from a known response (e.g. after profile create). */
export function seedMeCache(data: MeResponse): void {
  cache = { data, fetchedAt: Date.now() };
}
