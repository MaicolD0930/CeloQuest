const DEFAULT_API_URL = "https://open.er-api.com/v6/latest/USD";
const DEFAULT_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

type RateCache = {
  rate: bigint;
  fetchedAt: number;
  provider: string;
};

let cache: RateCache | null = null;

function readCacheTtlMs(): number {
  const raw = process.env.COP_USD_CACHE_TTL_MS;
  if (!raw) return DEFAULT_CACHE_TTL_MS;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_CACHE_TTL_MS;
}

function readEnvFallback(): bigint | null {
  for (const key of ["COP_PER_USD", "NEXT_PUBLIC_COP_PER_USD"]) {
    const raw = process.env[key];
    if (raw == null || raw === "") continue;
    try {
      const n = BigInt(raw.split(".")[0] ?? raw);
      if (n > BigInt(0)) return n;
    } catch {
      continue;
    }
  }
  return null;
}

export type CopUsdRateResult = {
  rate: bigint;
  source: "live" | "cache" | "env";
  provider?: string;
};

/** Fetch COP quoted per 1 USD (rounded to whole pesos). Cached with TTL. */
export async function fetchCopPerUsd(): Promise<CopUsdRateResult> {
  const ttl = readCacheTtlMs();
  if (cache && Date.now() - cache.fetchedAt < ttl) {
    return { rate: cache.rate, source: "cache", provider: cache.provider };
  }

  const url = process.env.EXCHANGE_RATE_API_URL ?? DEFAULT_API_URL;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: Math.floor(ttl / 1000) },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = (await res.json()) as {
      rates?: Record<string, number>;
      conversion_rates?: Record<string, number>;
    };

    const cop =
      data.rates?.COP ?? data.conversion_rates?.COP ?? null;

    if (cop == null || !Number.isFinite(cop) || cop <= 0) {
      throw new Error("COP rate missing in response");
    }

    const rate = BigInt(Math.round(cop));
    cache = { rate, fetchedAt: Date.now(), provider: url };

    return { rate, source: "live", provider: url };
  } catch (error) {
    console.warn("fetchCopPerUsd failed, using env fallback:", error);

    const fallback = readEnvFallback();
    if (fallback) {
      return { rate: fallback, source: "env" };
    }

    if (cache) {
      return { rate: cache.rate, source: "cache", provider: cache.provider };
    }

    throw new Error("COP_USD_RATE_UNAVAILABLE");
  }
}
