import { getCeloNetwork } from "@/lib/chain/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/** Wrong-network copy for browser wallets (MetaMask / Rabby). */
export function connectWrongNetworkMessage(t: Dictionary): string {
  return getCeloNetwork() === "mainnet"
    ? t.connect.wrongNetworkMainnet
    : t.connect.wrongNetwork;
}

/** Wrong-network copy inside challenge refill flow. */
export function challengeWrongNetworkMessage(
  t: Dictionary,
  miniPay: boolean
): string {
  const mainnet = getCeloNetwork() === "mainnet";
  if (miniPay) {
    return mainnet
      ? t.challenge.wrongNetworkMiniPayMainnet
      : t.challenge.wrongNetworkMiniPay;
  }
  return mainnet ? t.challenge.wrongNetworkMainnet : t.challenge.wrongNetwork;
}

/** MiniPay refill hint — includes live price when available. */
export function minipayRecoveryHint(
  t: Dictionary,
  amountLabel?: string
): string {
  const mainnet = getCeloNetwork() === "mainnet";
  const template = mainnet
    ? t.challenge.minipayAmountHintMainnet
    : t.challenge.minipayAmountHint;
  const amount =
    amountLabel ??
    (mainnet ? "0.01 USDC" : t.challenge.minipayAmountHintFallback);
  return template.replace("{amount}", amount);
}
