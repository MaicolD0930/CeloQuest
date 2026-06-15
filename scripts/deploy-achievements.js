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

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    "http://localhost:3000";
  const baseURI = `${appUrl.replace(/\/$/, "")}/nft-assets/metadata/`;

  console.log("Deploying CeloQuestAchievements (ERC-1155)");
  console.log("  Deployer:  ", deployer.address);
  console.log("  Admin:     ", admin);
  console.log("  Base URI:  ", baseURI);

  const Factory = await ethers.getContractFactory("CeloQuestAchievements");
  const contract = await Factory.deploy(baseURI, admin);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("\n✅ CeloQuestAchievements deployed:", address);

  const deployment = {
    network: "celoSepolia",
    chainId: 11142220,
    contract: "CeloQuestAchievements",
    address,
    deployer: deployer.address,
    adminOwner: admin,
    baseURI,
    deployedAt: new Date().toISOString(),
  };

  const outDir = path.join(__dirname, "..", "contracts", "deployments");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "celo-sepolia-achievements.json");
  fs.writeFileSync(outFile, JSON.stringify(deployment, null, 2));

  console.log("\nAdd to .env:");
  console.log(`ACHIEVEMENTS_CONTRACT_ADDRESS=${address}`);
  console.log(`NEXT_PUBLIC_ACHIEVEMENTS_CONTRACT_ADDRESS=${address}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
