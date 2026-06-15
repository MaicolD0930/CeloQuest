import type { Locale } from "@/lib/i18n/dictionaries";

export const CHALLENGE_CACHE_TTL_MS = 20_000;

export type ChallengeTodayResponse = {
  date: string;
  questions: {
    id: string;
    category: string;
    difficulty?: number;
    text: string;
    options: string[];
  }[];
  progress: {
    answers: { questionId: string; answerIndex: number; correct: boolean }[];
    livesLeft: number;
    xpEarned: number;
    completed: boolean;
    result: string;
    awaitingRefill?: boolean;
    canRefill?: boolean;
    lifeRefillUsed?: boolean;
    startedAt?: string;
    activeDurationMs?: number;
    elapsedMs?: number;
    timerPaused?: boolean;
  };
};

type CacheKey = string;

let cache: { key: CacheKey; data: ChallengeTodayResponse; fetchedAt: number } | null =
  null;
let inflight: Promise<ChallengeTodayResponse> | null = null;

function cacheKey(locale: Locale): CacheKey {
  return locale;
}

export function peekChallengeCache(locale: Locale): ChallengeTodayResponse | null {
  const key = cacheKey(locale);
  const now = Date.now();
  if (cache && cache.key === key && now - cache.fetchedAt < CHALLENGE_CACHE_TTL_MS) {
    return cache.data;
  }
  return null;
}

export function invalidateChallengeCache() {
  cache = null;
  inflight = null;
}

export async function fetchChallengeToday(
  locale: Locale,
  options?: { force?: boolean }
): Promise<ChallengeTodayResponse> {
  const force = options?.force ?? false;
  const key = cacheKey(locale);
  const now = Date.now();

  if (!force && cache && cache.key === key && now - cache.fetchedAt < CHALLENGE_CACHE_TTL_MS) {
    return cache.data;
  }

  if (!force && inflight) {
    return inflight;
  }

  inflight = fetch(`/api/challenge/today?locale=${locale}`, {
    credentials: "include",
  })
    .then(async (res) => {
      if (res.status === 401) {
        const err = new Error("UNAUTHORIZED") as Error & { status?: number };
        err.status = 401;
        throw err;
      }
      if (!res.ok) throw new Error("CHALLENGE_FETCH_FAILED");
      const data = (await res.json()) as ChallengeTodayResponse;
      cache = { key, data, fetchedAt: Date.now() };
      return data;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

/** Warm cache when hovering Play tab (non-blocking). */
export function prefetchChallengeToday(locale: Locale) {
  void fetchChallengeToday(locale).catch(() => {});
}

export function getClientLocale(): Locale {
  if (typeof document !== "undefined" && document.documentElement.lang === "en") {
    return "en";
  }
  return "es";
}
