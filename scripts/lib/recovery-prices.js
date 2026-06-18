/** Shared recovery price helpers for deploy/sync scripts. */

const CCOPM_DECIMALS = 18;
const USDC_DECIMALS = 6;

function getUsdCents() {
  return parseInt(
    process.env.RECOVERY_PRICE_USD_CENTS ??
      process.env.NEXT_PUBLIC_RECOVERY_PRICE_USD_CENTS ??
      "1",
    10
  );
}

function getFixedCcopmAmount() {
  return parseInt(
    process.env.RECOVERY_CCOPM_FIXED ??
      process.env.NEXT_PUBLIC_RECOVERY_CCOPM_FIXED ??
      "10",
    10
  );
}

function isMainnetDeploy(networkName) {
  return (
    networkName === "celo" ||
    (process.env.CELO_NETWORK ?? process.env.NEXT_PUBLIC_CELO_NETWORK ?? "")
      .toLowerCase()
      .includes("mainnet")
  );
}

function usdcPriceAtomic(usdCents) {
  return BigInt(usdCents) * 10n ** BigInt(USDC_DECIMALS - 2);
}

function copmPriceAtomic(usdCents, copPerUsd, mainnet) {
  if (mainnet) {
    const amount = BigInt(getFixedCcopmAmount());
    return amount * 10n ** BigInt(CCOPM_DECIMALS);
  }
  return BigInt(usdCents) * copPerUsd * 10n ** BigInt(USDC_DECIMALS - 2);
}

module.exports = {
  CCOPM_DECIMALS,
  USDC_DECIMALS,
  getUsdCents,
  getFixedCcopmAmount,
  isMainnetDeploy,
  usdcPriceAtomic,
  copmPriceAtomic,
};
