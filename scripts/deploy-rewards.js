require("dotenv").config();
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

const { isMainnetDeploy } = require("./lib/recovery-prices");

const DEFAULT_ADMIN = "0x089189B7942588bDBAdcc5cFc8E76d8bd1073bd4";
const DEFAULT_USDC_SEPOLIA = "0x01C5C0122039549AD1493B8220cABEdD739BC44E";
const DEFAULT_USDC_MAINNET = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C";

async function main() {
  const { ethers } = hre;
  const mainnet = isMainnetDeploy(hre.network.name);
  const [deployer] = await ethers.getSigners();
  if (!deployer) throw new Error("Set DEPLOYER_PRIVATE_KEY in .env");

  const admin =
    process.env.REWARDS_ADMIN_ADDRESS ??
    process.env.RECOVERY_TREASURY_ADDRESS ??
    DEFAULT_ADMIN;

  const automator =
    process.env.REWARDS_AUTOMATOR_ADDRESS ?? deployer.address;

  const usdc =
    process.env.USDC_ADDRESS ??
    process.env.NEXT_PUBLIC_USDC_ADDRESS ??
    (mainnet ? DEFAULT_USDC_MAINNET : DEFAULT_USDC_SEPOLIA);

  const rewardDisplay = "5";
  const rewardActual = "0.05";
  const rewardAtomic = "50000";

  console.log("Deploying CeloQuestRewards");
  console.log("  Network:      ", mainnet ? "celo mainnet" : "celo sepolia");
  console.log("  Deployer:     ", deployer.address);
  console.log("  Admin owner:  ", admin);
  console.log("  Automator:    ", automator);
  console.log("  USDC token:   ", usdc);
  console.log(`  Reward (UI):  ${rewardDisplay} USDC`);
  console.log(`  Reward (tx):  ${rewardActual} USDC`);

  const Factory = await ethers.getContractFactory("CeloQuestRewards");
  const contract = await Factory.deploy(usdc, admin, automator);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("\n✅ CeloQuestRewards deployed:", address);
  console.log("\nFund the contract with USDC before paying rewards:");
  console.log("  1. Approve:", address);
  console.log("  2. Call deposit(amount) as owner, or transfer USDC directly");

  const deployment = {
    network: mainnet ? "celo" : "celoSepolia",
    chainId: mainnet ? 42220 : 11142220,
    contract: "CeloQuestRewards",
    address,
    deployer: deployer.address,
    adminOwner: admin,
    automator,
    rewardToken: usdc,
    rewardAmountUsdcDisplay: rewardDisplay,
    rewardAmountUsdcActual: rewardActual,
    rewardAmountAtomic: rewardAtomic,
    deployedAt: new Date().toISOString(),
  };

  const outDir = path.join(__dirname, "..", "contracts", "deployments");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(
    outDir,
    mainnet ? "celo-mainnet-rewards.json" : "celo-sepolia-rewards.json"
  );
  fs.writeFileSync(outFile, JSON.stringify(deployment, null, 2));

  console.log("\nAdd to .env:");
  console.log(`REWARDS_CONTRACT_ADDRESS=${address}`);
  console.log(`NEXT_PUBLIC_REWARDS_CONTRACT_ADDRESS=${address}`);
  console.log(`REWARDS_AUTOMATOR_ADDRESS=${automator}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
