import { getCeloNetwork } from "@/lib/chain/config";
import type { RecoveryTokenId } from "@/lib/tokens/recovery";

/** Official MiniPay token addresses on Celo Sepolia (docs.minipay.xyz). */
export const MINIPAY_SEPOLIA = {
  USDC: "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B",
  USDC_ADAPTER: "0x4822e58de6f5e485eF90df51C41CE01721331dC0",
  USDm: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
} as const;

/** Official MiniPay USDC on Celo mainnet. */
export const MINIPAY_MAINNET = {
  USDC: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
  USDC_ADAPTER: "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B",
} as const;

function readCustomTcopmAddress(): string | null {
  const addr =
    process.env.NEXT_PUBLIC_TCOPM_ADDRESS ?? process.env.TCOPM_ADDRESS ?? null;
  return addr?.toLowerCase() ?? null;
}

/** Custom Hardhat tCOPM is readable on-chain but MiniPay cannot broadcast transfers for it. */
export function isCustomSepoliaTcopm(address: string): boolean {
  if (getCeloNetwork() !== "sepolia") return false;
  const custom = readCustomTcopmAddress();
  return !!custom && address.toLowerCase() === custom;
}

/** Token contract to call transfer() on when paying inside MiniPay. */
export function resolveMiniPaySendTokenAddress(
  tokenId: RecoveryTokenId,
  configured: `0x${string}`
): `0x${string}` {
  // Sepolia: use configured USDC — 0x2F25 is mainnet fee-adapter, not an ERC-20 on testnet.
  if (getCeloNetwork() === "mainnet" && tokenId === "USDC") {
    return MINIPAY_MAINNET.USDC;
  }
  return configured;
}

/** Addresses accepted when verifying a direct ERC-20 transfer to treasury. */
export function resolveRecoveryVerifyTokenAddresses(
  tokenId: RecoveryTokenId,
  configured: `0x${string}`
): `0x${string}`[] {
  const set = new Set<string>([configured.toLowerCase()]);
  if (getCeloNetwork() === "mainnet" && tokenId === "USDC") {
    set.add(MINIPAY_MAINNET.USDC.toLowerCase());
  }
  return [...set] as `0x${string}`[];
}

/** MiniPay only supports official USDC — hide tCOPM / cCOPM in refill UI. */
export function filterRecoveryTokensForMiniPay<T extends { id: RecoveryTokenId }>(
  tokens: T[]
): T[] {
  return tokens.filter((t) => t.id === "USDC");
}

/** Tokens MiniPay can actually send on the active network. */
export function isMiniPaySendableToken(
  tokenId: RecoveryTokenId,
  configured: `0x${string}` | null
): boolean {
  if (!configured) return false;
  if (tokenId === "USDC") return true;
  if (tokenId === "tCOPM" || tokenId === "cCOPM") {
    return !isCustomSepoliaTcopm(configured);
  }
  return false;
}
