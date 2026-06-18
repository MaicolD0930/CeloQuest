require("dotenv").config();
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

const DEFAULT_TREASURY = "0x089189B7942588bDBAdcc5cFc8E76d8bd1073bd4";

const { fetchCopPerUsd } = require("./lib/cop-usd-rate");
const {
  getUsdCents,
  getFixedCcopmAmount,
  isMainnetDeploy,
  usdcPriceAtomic,
  copmPriceAtomic,
} = require("./lib/recovery-prices");

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  if (!deployer) throw new Error("Set DEPLOYER_PRIVATE_KEY in .env");

  const mainnet = isMainnetDeploy(hre.network.name);
  const treasury =
    process.env.RECOVERY_TREASURY_ADDRESS ??
    process.env.NEXT_PUBLIC_RECOVERY_TREASURY ??
    DEFAULT_TREASURY;

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

  console.log("Deploying RecoveryPaymentContract (per-token pricing)");
  console.log("  Network:      ", mainnet ? "celo mainnet" : "celo sepolia");
  console.log("  Deployer:     ", deployer.address);
  console.log("  Treasury:     ", treasury);
  console.log("  Price USD:    ", (usdCents / 100).toFixed(2));
  if (mainnet) {
    console.log("  cCOP fixed:   ", getFixedCcopmAmount(), "cCOP");
  } else {
    console.log("  COP per USD:  ", copPerUsd.toString());
  }
  console.log("  USDC price:   ", usdcPrice.toString(), "atomic");
  console.log("  COPM price:   ", copmPrice.toString(), "atomic");

  const Factory = await ethers.getContractFactory("RecoveryPaymentContract");
  const contract = await Factory.deploy(treasury);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("\n✅ RecoveryPaymentContract deployed:", address);

  if (copmToken) {
    await (await contract.setAllowedToken(copmToken, true)).wait();
    await (await contract.setRecoveryPriceForToken(copmToken, copmPrice)).wait();
    console.log(
      `  ${mainnet ? "cCOP" : "tCOPM"} allowed, price:`,
      copmPrice.toString()
    );
  }

  if (usdc) {
    await (await contract.setAllowedToken(usdc, true)).wait();
    await (await contract.setRecoveryPriceForToken(usdc, usdcPrice)).wait();
    console.log("  USDC allowed, price:", usdcPrice.toString());
  }

  const deployment = {
    network: mainnet ? "celo" : "celoSepolia",
    chainId: mainnet ? 42220 : 11142220,
    contract: "RecoveryPaymentContract",
    address,
    deployer: deployer.address,
    treasury,
    priceUsdCents: usdCents,
    copPerUsd: copPerUsd ? copPerUsd.toString() : null,
    ccopmFixed: mainnet ? getFixedCcopmAmount() : null,
    prices: {
      copm: copmToken ? copmPrice.toString() : null,
      usdc: usdc ? usdcPrice.toString() : null,
    },
    deployedAt: new Date().toISOString(),
  };

  const outDir = path.join(__dirname, "..", "contracts", "deployments");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(
    outDir,
    mainnet ? "celo-mainnet-recovery-payment.json" : "celo-sepolia-recovery-payment.json"
  );
  fs.writeFileSync(outFile, JSON.stringify(deployment, null, 2));

  console.log("\nAdd to .env:");
  console.log(`RECOVERY_CONTRACT_ADDRESS=${address}`);
  console.log(`NEXT_PUBLIC_RECOVERY_CONTRACT_ADDRESS=${address}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
