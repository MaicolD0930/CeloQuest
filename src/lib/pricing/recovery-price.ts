import { formatUnits } from "viem";
import type { RecoveryTokenId } from "@/lib/tokens/recovery";
import { fetchCopPerUsd } from "@/lib/pricing/cop-usd-rate";

const TOKEN_DECIMALS = 6;

/** Scale factor: (usdCents / 100) * 10^6 = usdCents * 10_000 */
const USD_CENTS_TO_ATOMIC = BigInt(10000);

function readIntEnv(keys: string[], fallback: number): number {
  for (const key of keys) {
    const raw = process.env[key];
    if (raw == null || raw === "") continue;
    const n = parseInt(raw, 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return fallback;
}

function readBigIntEnv(keys: string[]): bigint | null {
  for (const key of keys) {
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

/** Life recovery price in USD cents (default 10 = $0.10). */
export function getRecoveryPriceUsdCents(): number {
  return readIntEnv(
    ["RECOVERY_PRICE_USD_CENTS", "NEXT_PUBLIC_RECOVERY_PRICE_USD_CENTS"],
    10
  );
}

/** Manual COP/USD override from env (fallback when FX API fails). */
export function getCopPerUsdEnvFallback(): bigint | null {
  return readBigIntEnv(["COP_PER_USD", "NEXT_PUBLIC_COP_PER_USD"]);
}

/** @deprecated Prefer fetchCopPerUsd() for live rates. */
export function getCopPerUsd(): bigint {
  return getCopPerUsdEnvFallback() ?? BigInt(4000);
}

export async function getCopPerUsdLive(): Promise<bigint> {
  const { rate } = await fetchCopPerUsd();
  return rate;
}

export function getRecoveryPriceUsd(): number {
  return getRecoveryPriceUsdCents() / 100;
}

/**
 * Atomic token amount for one life recovery.
 *
 * USDC:  $0.10 → 0.10 USDC
 * COPM:  $0.10 × live COP/USD
 *
 * Formula (6 decimals):
 *   usdcAtomic = usdCents × 10_000
 *   copAtomic  = usdCents × copPerUsd × 10_000
 */
export function getRecoveryPriceAtomic(
  token: RecoveryTokenId,
  copPerUsd?: bigint
): bigint {
  const usdCents = BigInt(getRecoveryPriceUsdCents());

  if (token === "USDC") {
    return usdCents * USD_CENTS_TO_ATOMIC;
  }

  const rate = copPerUsd ?? getCopPerUsd();
  return usdCents * rate * USD_CENTS_TO_ATOMIC;
}

export async function getRecoveryPriceAtomicAsync(
  token: RecoveryTokenId
): Promise<bigint> {
  if (token === "USDC") {
    return getRecoveryPriceAtomic("USDC");
  }
  const copPerUsd = await getCopPerUsdLive();
  return getRecoveryPriceAtomic(token, copPerUsd);
}

export function formatRecoveryPriceFromAtomic(
  token: RecoveryTokenId,
  atomic: bigint
): string {
  const human = formatUnits(atomic, TOKEN_DECIMALS);
  const label = token === "USDC" ? "USDC" : token;
  return `${human} ${label}`;
}

export function formatRecoveryPrice(token: RecoveryTokenId): string {
  return formatRecoveryPriceFromAtomic(
    token,
    getRecoveryPriceAtomic(token)
  );
}

export async function formatRecoveryPriceAsync(
  token: RecoveryTokenId
): Promise<string> {
  const atomic = await getRecoveryPriceAtomicAsync(token);
  return formatRecoveryPriceFromAtomic(token, atomic);
}

export function getRecoveryPricingMeta(copPerUsd: bigint, rateSource?: string) {
  const usdCents = getRecoveryPriceUsdCents();
  const usd = usdCents / 100;
  const copAmount = (BigInt(usdCents) * copPerUsd) / BigInt(100);

  return {
    priceUsd: usd,
    priceUsdCents: usdCents,
    copPerUsd: copPerUsd.toString(),
    copRateSource: rateSource ?? "env",
    copAmount: copAmount.toString(),
    usdcAmount: formatUnits(getRecoveryPriceAtomic("USDC"), TOKEN_DECIMALS),
    copmAmount: formatUnits(
      getRecoveryPriceAtomic("tCOPM", copPerUsd),
      TOKEN_DECIMALS
    ),
  };
}

export async function getRecoveryPricingMetaAsync() {
  const { rate, source } = await fetchCopPerUsd();
  return getRecoveryPricingMeta(rate, source);
}
