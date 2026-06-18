import { formatUnits } from "viem";
import { getCeloNetwork } from "@/lib/chain/config";
import type { RecoveryTokenId } from "@/lib/tokens/recovery";
import {
  getCopmTokenConfig,
  getRecoveryTokenConfig,
  getUsdcTokenConfig,
} from "@/lib/tokens/recovery";
import { fetchCopPerUsd } from "@/lib/pricing/cop-usd-rate";

/** Scale factor for USDC (6 decimals): (usdCents / 100) * 10^6 */
const USD_CENTS_TO_USDC_ATOMIC = BigInt(10_000);

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

/** Life recovery price in USD cents (default 1 = $0.01 USDC). */
export function getRecoveryPriceUsdCents(): number {
  return readIntEnv(
    ["RECOVERY_PRICE_USD_CENTS", "NEXT_PUBLIC_RECOVERY_PRICE_USD_CENTS"],
    1
  );
}

/** Fixed cCOP amount for mainnet recovery (default 10 cCOP). */
export function getRecoveryCcopmFixed(): number {
  return readIntEnv(
    ["RECOVERY_CCOPM_FIXED", "NEXT_PUBLIC_RECOVERY_CCOPM_FIXED"],
    10
  );
}

export function getTokenDecimals(token: RecoveryTokenId): number {
  return getRecoveryTokenConfig(token)?.decimals ?? 6;
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
 * Mainnet:
 *   USDC → $0.01 (RECOVERY_PRICE_USD_CENTS=1)
 *   cCOP → fixed 10 cCOP (18 decimals)
 *
 * Sepolia:
 *   USDC → USD cents formula (6 decimals)
 *   tCOPM → USD × COP/USD (6 decimals)
 */
export function getRecoveryPriceAtomic(
  token: RecoveryTokenId,
  copPerUsd?: bigint
): bigint {
  const usdCents = BigInt(getRecoveryPriceUsdCents());
  const network = getCeloNetwork();

  if (token === "USDC") {
    return usdCents * USD_CENTS_TO_USDC_ATOMIC;
  }

  if (network === "mainnet" && token === "cCOPM") {
    const fixed = BigInt(getRecoveryCcopmFixed());
    return fixed * 10n ** BigInt(getCopmTokenConfig().decimals);
  }

  const rate = copPerUsd ?? getCopPerUsd();
  return usdCents * rate * USD_CENTS_TO_USDC_ATOMIC;
}

export async function getRecoveryPriceAtomicAsync(
  token: RecoveryTokenId
): Promise<bigint> {
  if (token === "USDC") {
    return getRecoveryPriceAtomic("USDC");
  }
  if (getCeloNetwork() === "mainnet" && token === "cCOPM") {
    return getRecoveryPriceAtomic("cCOPM");
  }
  const copPerUsd = await getCopPerUsdLive();
  return getRecoveryPriceAtomic(token, copPerUsd);
}

export function formatRecoveryPriceFromAtomic(
  token: RecoveryTokenId,
  atomic: bigint
): string {
  const decimals = getTokenDecimals(token);
  const human = formatUnits(atomic, decimals);
  const label =
    token === "USDC"
      ? "USDC"
      : getCeloNetwork() === "mainnet"
        ? "cCOP"
        : token;
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
  const copm = getCopmTokenConfig();
  const isMainnet = getCeloNetwork() === "mainnet";

  return {
    priceUsd: usd,
    priceUsdCents: usdCents,
    copPerUsd: copPerUsd.toString(),
    copRateSource: rateSource ?? "env",
    copAmount: isMainnet
      ? String(getRecoveryCcopmFixed())
      : ((BigInt(usdCents) * copPerUsd) / BigInt(100)).toString(),
    usdcAmount: formatUnits(
      getRecoveryPriceAtomic("USDC"),
      getUsdcTokenConfig().decimals
    ),
    copmAmount: formatUnits(
      getRecoveryPriceAtomic(copm.id, copPerUsd),
      copm.decimals
    ),
    copmSymbol: isMainnet ? "cCOP" : copm.symbol,
  };
}

export async function getRecoveryPricingMetaAsync() {
  const { rate, source } = await fetchCopPerUsd();
  return getRecoveryPricingMeta(rate, source);
}
