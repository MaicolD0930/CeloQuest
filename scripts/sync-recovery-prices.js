require("dotenv").config();
const hre = require("hardhat");

const { fetchCopPerUsd } = require("./lib/cop-usd-rate");

function getUsdCents() {
  return parseInt(process.env.RECOVERY_PRICE_USD_CENTS ?? "10", 10);
}

function priceAtomic(usdCents, copPerUsd, isUsdc) {
  if (isUsdc) return BigInt(usdCents) * 10000n;
  return BigInt(usdCents) * copPerUsd * 10000n;
}

/**
 * Sync on-chain recovery prices using live COP/USD (or COP_PER_USD fallback).
 * Usage: npm run contracts:sync:recovery-prices
 */
async function main() {
  const { ethers } = hre;
  const address =
    process.env.RECOVERY_CONTRACT_ADDRESS ??
    process.env.NEXT_PUBLIC_RECOVERY_CONTRACT_ADDRESS;

  if (!address) throw new Error("Set RECOVERY_CONTRACT_ADDRESS in .env");

  const tcopm =
    process.env.TCOPM_ADDRESS ?? process.env.NEXT_PUBLIC_TCOPM_ADDRESS;
  const usdc =
    process.env.USDC_ADDRESS ?? process.env.NEXT_PUBLIC_USDC_ADDRESS;

  const usdCents = getUsdCents();
  const copPerUsd = await fetchCopPerUsd();
  const usdcPrice = priceAtomic(usdCents, copPerUsd, true);
  const copmPrice = priceAtomic(usdCents, copPerUsd, false);

  const contract = await ethers.getContractAt(
    "RecoveryPaymentContract",
    address
  );

  console.log("Syncing prices on", address);
  console.log("  USD:", (usdCents / 100).toFixed(2));
  console.log("  COP/USD:", copPerUsd.toString());

  if (tcopm) {
    await (await contract.setAllowedToken(tcopm, true)).wait();
    const tx = await contract.setRecoveryPriceForToken(tcopm, copmPrice);
    await tx.wait();
    console.log("  tCOPM →", copmPrice.toString());
  }

  if (usdc) {
    const tx = await contract.setRecoveryPriceForToken(usdc, usdcPrice);
    await tx.wait();
    console.log("  USDC →", usdcPrice.toString());
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
