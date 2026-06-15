/**
 * Point the achievements ERC-1155 contract at public metadata on your deployed app.
 *
 * Requires: contract owner key (same wallet that owns CeloQuestAchievements).
 * Usually REWARDS_ADMIN_ADDRESS / RECOVERY_TREASURY, not necessarily the deployer.
 *
 * Usage:
 *   NEXT_PUBLIC_APP_URL=https://celoquest.vercel.app npm run contracts:set:achievements-uri
 */
require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const address =
    process.env.ACHIEVEMENTS_CONTRACT_ADDRESS ??
    process.env.NEXT_PUBLIC_ACHIEVEMENTS_CONTRACT_ADDRESS;
  if (!address) {
    throw new Error("Set ACHIEVEMENTS_CONTRACT_ADDRESS in .env");
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "";
  if (!appUrl || appUrl.includes("localhost")) {
    throw new Error(
      "Set NEXT_PUBLIC_APP_URL to your public Vercel URL (no localhost)"
    );
  }

  const baseURI = `${appUrl.replace(/\/$/, "")}/nft-assets/metadata/`;
  const [signer] = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt(
    "CeloQuestAchievements",
    address,
    signer
  );

  const owner = await contract.owner();
  console.log("Contract:", address);
  console.log("Signer:  ", signer.address);
  console.log("Owner:   ", owner);
  console.log("New URI: ", baseURI);

  if (owner.toLowerCase() !== signer.address.toLowerCase()) {
    throw new Error(
      "Signer is not contract owner. Import owner key as DEPLOYER_PRIVATE_KEY or call setBaseURI from CeloScan."
    );
  }

  const tx = await contract.setBaseURI(baseURI);
  console.log("Tx:", tx.hash);
  await tx.wait();
  console.log("✅ base URI updated");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
