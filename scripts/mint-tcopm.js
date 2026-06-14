require("dotenv").config();
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Send tCOPM from the deployer wallet to a test address.
 * Usage: RECIPIENT=0x... AMOUNT=100 npx hardhat run scripts/mint-tcopm.js --network celoSepolia
 */
async function main() {
  const { ethers } = hre;
  const recipient = process.env.RECIPIENT;
  const amountHuman = process.env.AMOUNT ?? "100";

  if (!recipient) {
    throw new Error("Set RECIPIENT=0x... in the environment");
  }

  const deploymentPath = path.join(
    __dirname,
    "..",
    "contracts",
    "deployments",
    "celo-sepolia-tcopm.json"
  );
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(
      "Deployment file not found. Run npm run contracts:deploy:tcopm first."
    );
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

  const [deployer] = await ethers.getSigners();
  const token = await ethers.getContractAt(
    "CeloColombianPesoTest",
    deployment.address
  );

  const decimals = await token.decimals();
  const amount = ethers.parseUnits(amountHuman, decimals);

  console.log(`Transferring ${amountHuman} tCOPM to ${recipient}...`);
  const tx = await token.transfer(recipient, amount);
  await tx.wait();
  console.log("Done. Tx:", tx.hash);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
