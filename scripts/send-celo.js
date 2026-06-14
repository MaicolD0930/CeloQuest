require("dotenv").config();
const hre = require("hardhat");

/**
 * Send native CELO from deployer to a test wallet.
 * Usage: RECIPIENT=0x... AMOUNT=0.5 npx hardhat run scripts/send-celo.js --network celoSepolia
 */
async function main() {
  const { ethers } = hre;
  const recipient = process.env.RECIPIENT;
  const amountHuman = process.env.AMOUNT ?? "0.5";

  if (!recipient) {
    throw new Error("Set RECIPIENT=0x... in the environment");
  }

  const [deployer] = await ethers.getSigners();
  const amount = ethers.parseEther(amountHuman);
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("From:   ", deployer.address);
  console.log("To:     ", recipient);
  console.log("Amount: ", amountHuman, "CELO");
  console.log("Balance:", ethers.formatEther(balance), "CELO");

  if (balance < amount) {
    throw new Error("Deployer has insufficient CELO. Try a faucet for the deployer wallet.");
  }

  const tx = await deployer.sendTransaction({ to: recipient, value: amount });
  await tx.wait();
  console.log("Done. Tx:", tx.hash);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
