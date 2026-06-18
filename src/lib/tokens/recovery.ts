import { getCeloNetwork } from "@/lib/chain/config";
import { getRecoveryContractAddress } from "@/lib/contracts/recovery-payment";

export {
  getRecoveryPriceAtomic,
  getRecoveryPriceAtomicAsync,
  getRecoveryPricingMetaAsync,
  formatRecoveryPrice,
  formatRecoveryPriceFromAtomic,
} from "@/lib/pricing/recovery-price";
import { getRecoveryPriceAtomic } from "@/lib/pricing/recovery-price";

/** Recovery token identifiers used in API + UI. */
export type RecoveryTokenId = "USDC" | "tCOPM" | "cCOPM";

/** COPM slot: tCOPM on testnet, cCOPM on mainnet. */
export type CopmTokenId = "tCOPM" | "cCOPM";

export type RecoveryTokenConfig = {
  id: RecoveryTokenId;
  symbol: string;
  name: string;
  decimals: number;
  address: `0x${string}` | null;
};

function readAddress(
  serverKey: string,
  publicKey: string
): `0x${string}` | null {
  const addr = process.env[serverKey] ?? process.env[publicKey];
  if (!addr) return null;
  return addr as `0x${string}`;
}

/** Active COPM token for the current network (test vs production). */
export function getCopmTokenConfig(): RecoveryTokenConfig {
  const network = getCeloNetwork();

  if (network === "mainnet") {
    const addr =
      readAddress("CCOPM_ADDRESS", "NEXT_PUBLIC_CCOPM_ADDRESS") ??
      ("0x8A567e2aE79CA692Bd748aB832081C45de4041eA" as `0x${string}`);
    return {
      id: "cCOPM",
      symbol: "cCOP",
      name: "Celo Colombian Peso",
      decimals: 18,
      address: addr,
    };
  }

  return {
    id: "tCOPM",
    symbol: "tCOPM",
    name: "Celo Colombian Peso Test",
    decimals: 6,
    address: readAddress("TCOPM_ADDRESS", "NEXT_PUBLIC_TCOPM_ADDRESS"),
  };
}

export function getUsdcTokenConfig(): RecoveryTokenConfig {
  const network = getCeloNetwork();
  const defaultAddr =
    network === "mainnet"
      ? "0xcebA9300f2b948710d2653dD7B07f33A8B32118C"
      : "0x01C5C0122039549AD1493B8220cABEdD739BC44E";
  return {
    id: "USDC",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    address:
      readAddress("USDC_ADDRESS", "NEXT_PUBLIC_USDC_ADDRESS") ??
      (defaultAddr as `0x${string}`),
  };
}

export function getRecoveryTokenConfig(
  id: RecoveryTokenId
): RecoveryTokenConfig | null {
  if (id === "USDC") return getUsdcTokenConfig();
  if (id === "tCOPM" || id === "cCOPM") return getCopmTokenConfig();
  return null;
}

export function getRecoveryTokenAddress(
  id: RecoveryTokenId
): `0x${string}` | null {
  return getRecoveryTokenConfig(id)?.address ?? null;
}

/** Tokens enabled for life recovery (contract + token addresses configured). */
export function getAvailableRecoveryTokens(): RecoveryTokenConfig[] {
  if (!getRecoveryContractAddress()) return [];

  const tokens: RecoveryTokenConfig[] = [];
  const copm = getCopmTokenConfig();
  const usdc = getUsdcTokenConfig();

  if (copm.address) tokens.push(copm);
  if (usdc.address) tokens.push(usdc);

  return tokens;
}

export function getRecoveryTreasury(): `0x${string}` | null {
  const treasury =
    process.env.RECOVERY_TREASURY_ADDRESS ??
    process.env.NEXT_PUBLIC_RECOVERY_TREASURY;
  if (!treasury) return null;
  return treasury as `0x${string}`;
}

/** Atomic units required for one life recovery for the given token. */
export function getRecoveryPriceForToken(token: RecoveryTokenId): bigint {
  return getRecoveryPriceAtomic(token);
}

export function normalizeRecoveryTokenParam(
  token: unknown
): RecoveryTokenId {
  if (token === "USDC" && getUsdcTokenConfig().address) return "USDC";
  return getCopmTokenConfig().id;
}

/** Only enabled when explicitly set — never in production. */
export const RECOVERY_DEMO_MODE =
  process.env.NODE_ENV !== "production" &&
  (process.env.NEXT_PUBLIC_RECOVERY_DEMO_MODE ??
    process.env.RECOVERY_DEMO_MODE) === "true";
