require("dotenv").config();
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

const DEFAULT_ADMIN = "0x089189B7942588bDBAdcc5cFc8E76d8bd1073bd4";
const DEFAULT_USDC_SEPOLIA = "0x01C5C0122039549AD1493B8220cABEdD739BC44E";

async function main() {
  const { ethers } = hre;
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
    DEFAULT_USDC_SEPOLIA;

  console.log("Deploying CeloQuestRewards");
  console.log("  Deployer:     ", deployer.address);
  console.log("  Admin owner:  ", admin);
  console.log("  Automator:    ", automator);
  console.log("  USDC token:   ", usdc);
  console.log("  Reward amount: 3 USDC");

  const Factory = await ethers.getContractFactory("CeloQuestRewards");
  const contract = await Factory.deploy(usdc, admin, automator);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("\n✅ CeloQuestRewards deployed:", address);
  console.log("\nFund the contract with USDC before paying rewards:");
  console.log("  1. Approve:", address);
  console.log("  2. Call deposit(amount) as owner, or transfer USDC directly");

  const deployment = {
    network: "celoSepolia",
    chainId: 11142220,
    contract: "CeloQuestRewards",
    address,
    deployer: deployer.address,
    adminOwner: admin,
    automator,
    rewardToken: usdc,
    rewardAmountUsdc: "3",
    rewardAmountAtomic: "3000000",
    deployedAt: new Date().toISOString(),
  };

  const outDir = path.join(__dirname, "..", "contracts", "deployments");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "celo-sepolia-rewards.json");
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
