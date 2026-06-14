require("dotenv").config();
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

const DEFAULT_TREASURY = "0x089189B7942588bDBAdcc5cFc8E76d8bd1073bd4";

const { fetchCopPerUsd } = require("./lib/cop-usd-rate");

function getUsdCents() {
  return parseInt(
    process.env.RECOVERY_PRICE_USD_CENTS ?? "10",
    10
  );
}

function priceAtomic(usdCents, copPerUsd, isUsdc) {
  if (isUsdc) return BigInt(usdCents) * 10000n;
  return BigInt(usdCents) * copPerUsd * 10000n;
}

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  if (!deployer) throw new Error("Set DEPLOYER_PRIVATE_KEY in .env");

  const treasury =
    process.env.RECOVERY_TREASURY_ADDRESS ??
    process.env.NEXT_PUBLIC_RECOVERY_TREASURY ??
    DEFAULT_TREASURY;

  const tcopm =
    process.env.TCOPM_ADDRESS ?? process.env.NEXT_PUBLIC_TCOPM_ADDRESS;
  const usdc =
    process.env.USDC_ADDRESS ?? process.env.NEXT_PUBLIC_USDC_ADDRESS;

  const usdCents = getUsdCents();
  const copPerUsd = await fetchCopPerUsd();
  const usdcPrice = priceAtomic(usdCents, copPerUsd, true);
  const copmPrice = priceAtomic(usdCents, copPerUsd, false);

  console.log("Deploying RecoveryPaymentContract (per-token pricing)");
  console.log("  Deployer:     ", deployer.address);
  console.log("  Treasury:     ", treasury);
  console.log("  Price USD:    ", (usdCents / 100).toFixed(2));
  console.log("  COP per USD:  ", copPerUsd.toString());
  console.log("  USDC price:   ", usdcPrice.toString(), "atomic");
  console.log("  COPM price:   ", copmPrice.toString(), "atomic");

  const Factory = await ethers.getContractFactory("RecoveryPaymentContract");
  const contract = await Factory.deploy(treasury);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("\n✅ RecoveryPaymentContract deployed:", address);

  if (tcopm) {
    await (await contract.setAllowedToken(tcopm, true)).wait();
    await (await contract.setRecoveryPriceForToken(tcopm, copmPrice)).wait();
    console.log("  tCOPM allowed, price:", copmPrice.toString());
  }

  if (usdc) {
    await (await contract.setAllowedToken(usdc, true)).wait();
    await (await contract.setRecoveryPriceForToken(usdc, usdcPrice)).wait();
    console.log("  USDC allowed, price:", usdcPrice.toString());
  }

  const deployment = {
    network: "celoSepolia",
    chainId: 11142220,
    contract: "RecoveryPaymentContract",
    address,
    deployer: deployer.address,
    treasury,
    priceUsdCents: usdCents,
    copPerUsd: copPerUsd.toString(),
    prices: {
      tcopm: tcopm ? copmPrice.toString() : null,
      usdc: usdc ? usdcPrice.toString() : null,
    },
    deployedAt: new Date().toISOString(),
  };

  const outDir = path.join(__dirname, "..", "contracts", "deployments");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "celo-sepolia-recovery-payment.json");
  fs.writeFileSync(outFile, JSON.stringify(deployment, null, 2));

  console.log("\nAdd to .env:");
  console.log(`RECOVERY_CONTRACT_ADDRESS=${address}`);
  console.log(`NEXT_PUBLIC_RECOVERY_CONTRACT_ADDRESS=${address}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
