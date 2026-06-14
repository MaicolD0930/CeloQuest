require("dotenv").config();
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

const DEFAULT_ADMIN = "0x089189B7942588bDBAdcc5cFc8E76d8bd1073bd4";

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  if (!deployer) throw new Error("Set DEPLOYER_PRIVATE_KEY in .env");

  const admin =
    process.env.REWARDS_ADMIN_ADDRESS ??
    process.env.RECOVERY_TREASURY_ADDRESS ??
    DEFAULT_ADMIN;

  const tcopm =
    process.env.TCOPM_ADDRESS ?? process.env.NEXT_PUBLIC_TCOPM_ADDRESS;
  if (!tcopm) throw new Error("Set TCOPM_ADDRESS in .env");

  console.log("Deploying CeloQuestRewards");
  console.log("  Deployer:     ", deployer.address);
  console.log("  Admin owner:  ", admin);
  console.log("  tCOPM token:  ", tcopm);
  console.log("  Reward amount: 25,000 tCOPM");

  const Factory = await ethers.getContractFactory("CeloQuestRewards");
  const contract = await Factory.deploy(tcopm, admin);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("\n✅ CeloQuestRewards deployed:", address);
  console.log("\nFund the contract with tCOPM before paying rewards:");
  console.log("  1. Approve:", address);
  console.log("  2. Call deposit(amount) as owner, or transfer tCOPM directly");

  const deployment = {
    network: "celoSepolia",
    chainId: 11142220,
    contract: "CeloQuestRewards",
    address,
    deployer: deployer.address,
    adminOwner: admin,
    rewardToken: tcopm,
    rewardAmountTcopm: "25000",
    rewardAmountAtomic: "25000000000",
    deployedAt: new Date().toISOString(),
  };

  const outDir = path.join(__dirname, "..", "contracts", "deployments");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "celo-sepolia-rewards.json");
  fs.writeFileSync(outFile, JSON.stringify(deployment, null, 2));

  console.log("\nAdd to .env:");
  console.log(`REWARDS_CONTRACT_ADDRESS=${address}`);
  console.log(`NEXT_PUBLIC_REWARDS_CONTRACT_ADDRESS=${address}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
