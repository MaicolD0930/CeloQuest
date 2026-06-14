require("dotenv").config();
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Mint new tCOPM to a wallet (owner only).
 * Usage:
 *   AMOUNT=50000000 npm run contracts:mint:tcopm:supply
 *   RECIPIENT=0x... AMOUNT=1000000 npm run contracts:mint:tcopm:supply
 */
async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error("Set DEPLOYER_PRIVATE_KEY in .env");
  }

  const recipient =
    process.env.RECIPIENT ?? deployer.address;
  const amountHuman = process.env.AMOUNT ?? "50000000";

  const tokenAddress =
    process.env.TCOPM_ADDRESS ?? process.env.NEXT_PUBLIC_TCOPM_ADDRESS;

  let address = tokenAddress;
  if (!address) {
    const deploymentPath = path.join(
      __dirname,
      "..",
      "contracts",
      "deployments",
      "celo-sepolia-tcopm.json"
    );
    if (!fs.existsSync(deploymentPath)) {
      throw new Error(
        "Set TCOPM_ADDRESS in .env or run npm run contracts:deploy:tcopm first"
      );
    }
    address = JSON.parse(fs.readFileSync(deploymentPath, "utf8")).address;
  }

  const token = await ethers.getContractAt("CeloColombianPesoTest", address);
  const decimals = await token.decimals();
  const amount = ethers.parseUnits(amountHuman, decimals);

  console.log(`Minting ${amountHuman} tCOPM to ${recipient}...`);
  console.log("  Token:", address);
  console.log("  Minter:", deployer.address);

  const tx = await token.mint(recipient, amount);
  await tx.wait();

  const balance = await token.balanceOf(recipient);
  console.log("\n✅ Mint complete");
  console.log("  Tx:", tx.hash);
  console.log(
    "  New balance:",
    ethers.formatUnits(balance, decimals),
    "tCOPM"
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
