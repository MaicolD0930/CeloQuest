require("dotenv").config();
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error(
      "No deployer account. Set DEPLOYER_PRIVATE_KEY in .env (never commit it)."
    );
  }

  console.log("Deploying CeloColombianPesoTest (tCOPM) with:", deployer.address);

  const Factory = await ethers.getContractFactory("CeloColombianPesoTest");
  const token = await Factory.deploy();
  const deployTx = token.deploymentTransaction();
  if (deployTx) {
    console.log("  Tx:", deployTx.hash);
    await deployTx.wait(2);
  } else {
    await token.waitForDeployment();
  }

  const address = await token.getAddress();
  const supply = await token.totalSupply();
  const decimals = await token.decimals();
  const symbol = await token.symbol();
  const name = await token.name();

  const deployment = {
    network: "celoSepolia",
    chainId: 11142220,
    contract: "CeloColombianPesoTest",
    symbol,
    name,
    decimals: Number(decimals),
    address,
    deployer: deployer.address,
    initialSupply: supply.toString(),
    deployedAt: new Date().toISOString(),
  };

  const outDir = path.join(__dirname, "..", "contracts", "deployments");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "celo-sepolia-tcopm.json");
  fs.writeFileSync(outFile, JSON.stringify(deployment, null, 2));

  console.log("\n✅ tCOPM deployed");
  console.log("Address:", address);
  console.log("Symbol:", symbol);
  console.log("Decimals:", decimals);
  console.log("Initial supply (raw):", supply.toString());
  console.log("Saved to:", outFile);
  console.log("\nAdd to .env:");
  console.log(`TCOPM_ADDRESS=${address}`);
  console.log(`NEXT_PUBLIC_TCOPM_ADDRESS=${address}`);
  console.log(
    "\nExplorer:",
    `https://celo-sepolia.blockscout.com/address/${address}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
