require("dotenv").config();
const hre = require("hardhat");

const { fetchCopPerUsd } = require("./lib/cop-usd-rate");
const {
  getUsdCents,
  getFixedCcopmAmount,
  isMainnetDeploy,
  usdcPriceAtomic,
  copmPriceAtomic,
} = require("./lib/recovery-prices");

/**
 * Sync on-chain recovery prices (live COP/USD on Sepolia; fixed cCOP on mainnet).
 * Usage: npm run contracts:sync:recovery-prices
 */
async function main() {
  const { ethers } = hre;
  const mainnet = isMainnetDeploy(hre.network.name);
  const address =
    process.env.RECOVERY_CONTRACT_ADDRESS ??
    process.env.NEXT_PUBLIC_RECOVERY_CONTRACT_ADDRESS;

  if (!address) throw new Error("Set RECOVERY_CONTRACT_ADDRESS in .env");

  const tcopm =
    process.env.TCOPM_ADDRESS ?? process.env.NEXT_PUBLIC_TCOPM_ADDRESS;
  const ccopm =
    process.env.CCOPM_ADDRESS ?? process.env.NEXT_PUBLIC_CCOPM_ADDRESS;
  const usdc =
    process.env.USDC_ADDRESS ?? process.env.NEXT_PUBLIC_USDC_ADDRESS;

  const copmToken = mainnet ? ccopm : tcopm;
  const usdCents = getUsdCents();
  const copPerUsd = mainnet ? null : await fetchCopPerUsd();
  const usdcPrice = usdcPriceAtomic(usdCents);
  const copmPrice = copmPriceAtomic(usdCents, copPerUsd ?? 0n, mainnet);

  const contract = await ethers.getContractAt(
    "RecoveryPaymentContract",
    address
  );

  console.log("Syncing prices on", address);
  console.log("  USD:", (usdCents / 100).toFixed(2));
  if (mainnet) {
    console.log("  cCOP fixed:", getFixedCcopmAmount());
  } else {
    console.log("  COP/USD:", copPerUsd.toString());
  }

  if (copmToken) {
    await (await contract.setAllowedToken(copmToken, true)).wait();
    const tx = await contract.setRecoveryPriceForToken(copmToken, copmPrice);
    await tx.wait();
    console.log(`  ${mainnet ? "cCOP" : "tCOPM"} →`, copmPrice.toString());
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
