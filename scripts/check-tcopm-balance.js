require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  const token = await ethers.getContractAt(
    "CeloColombianPesoTest",
    process.env.TCOPM_ADDRESS
  );
  const admin = "0x089189B7942588bDBAdcc5cFc8E76d8bd1073bd4";
  const rewards = process.env.REWARDS_CONTRACT_ADDRESS;
  const b = await token.balanceOf(admin);
  const s = await token.totalSupply();
  console.log("admin balance:", ethers.formatUnits(b, 6), "tCOPM");
  console.log("total supply:", ethers.formatUnits(s, 6), "tCOPM");
  if (rewards) {
    const rb = await token.balanceOf(rewards);
    console.log("rewards contract:", ethers.formatUnits(rb, 6), "tCOPM");
  }
}

main().catch(console.error);
