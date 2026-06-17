import { getCeloNetwork } from "@/lib/chain/config";
import type { RecoveryTokenId } from "@/lib/tokens/recovery";

/**
 * Celo fee-currency adapters for 6-decimal tokens (USDC/USDT).
 * For tCOPM and other Mento tokens, omit feeCurrency — MiniPay picks gas from the user's balance.
 * @see https://docs.celo.org/build-on-celo/fee-abstraction/using-fee-abstraction
 */
const SEPOLIA_FEE_ADAPTERS: Partial<Record<RecoveryTokenId, `0x${string}`>> = {
  USDC: "0x4822e58de6f5e485eF90df51C41CE01721331dC0",
};

const MAINNET_FEE_ADAPTERS: Partial<Record<RecoveryTokenId, `0x${string}`>> = {
  USDC: "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B",
};

/** Optional feeCurrency for MiniPay; undefined lets the wallet choose (recommended for tCOPM). */
export function getMiniPayFeeCurrency(
  tokenId: RecoveryTokenId
): `0x${string}` | undefined {
  const adapters =
    getCeloNetwork() === "mainnet" ? MAINNET_FEE_ADAPTERS : SEPOLIA_FEE_ADAPTERS;
  return adapters[tokenId];
}
