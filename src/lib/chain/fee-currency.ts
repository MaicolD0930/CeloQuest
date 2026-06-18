import { getCeloNetwork } from "@/lib/chain/config";
import type { RecoveryTokenId } from "@/lib/tokens/recovery";

/**
 * Celo fee-currency adapters for 6-decimal tokens (USDC/USDT) on mainnet only.
 * Sepolia: omit feeCurrency — public testnet adapters are not deployed on forno RPC.
 */
const MAINNET_FEE_ADAPTERS: Partial<Record<RecoveryTokenId, `0x${string}`>> = {
  USDC: "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B",
};

/** Optional feeCurrency for MiniPay; undefined lets the wallet choose (recommended for tCOPM). */
export function getMiniPayFeeCurrency(
  tokenId: RecoveryTokenId
): `0x${string}` | undefined {
  if (getCeloNetwork() !== "mainnet") return undefined;
  return MAINNET_FEE_ADAPTERS[tokenId];
}
