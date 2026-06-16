require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  const usdc = new ethers.Contract(
    "0x01C5C0122039549AD1493B8220cABEdD739BC44E",
    [
      "function balanceOf(address) view returns (uint256)",
      "function decimals() view returns (uint8)",
    ],
    ethers.provider
  );
  const d = await usdc.decimals();
  const w = "0x089189B7942588bDBAdcc5cFc8E76d8bd1073bd4";
  const c = process.env.REWARDS_CONTRACT_ADDRESS;
  console.log("decimals", d);
  console.log("deployer", ethers.formatUnits(await usdc.balanceOf(w), d));
  console.log("contract", ethers.formatUnits(await usdc.balanceOf(c), d));
}

main();
