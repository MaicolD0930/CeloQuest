require("dotenv").config();
const hre = require("hardhat");

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

const REWARDS_ABI = [
  "function deposit(uint256 amount)",
  "function REWARD_AMOUNT() view returns (uint256)",
];

/**
 * Fund CeloQuestRewards with USDC via approve + deposit.
 * Usage: AMOUNT_USDC=30 npx hardhat run scripts/fund-rewards-usdc.js --network celoSepolia
 */
async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  if (!deployer) throw new Error("Set DEPLOYER_PRIVATE_KEY in .env");

  const rewardsAddress = process.env.REWARDS_CONTRACT_ADDRESS;
  const usdcAddress =
    process.env.USDC_ADDRESS ?? process.env.NEXT_PUBLIC_USDC_ADDRESS;
  const amountUsdc = process.env.AMOUNT_USDC ?? "30";

  if (!rewardsAddress) throw new Error("Set REWARDS_CONTRACT_ADDRESS in .env");
  if (!usdcAddress) throw new Error("Set USDC_ADDRESS in .env");

  const usdc = new ethers.Contract(usdcAddress, ERC20_ABI, deployer);
  const rewards = new ethers.Contract(rewardsAddress, REWARDS_ABI, deployer);

  const symbol = await usdc.symbol();
  const decimals = await usdc.decimals();
  const amount = ethers.parseUnits(amountUsdc, decimals);
  const balance = await usdc.balanceOf(deployer.address);
  const rewardAmount = await rewards.REWARD_AMOUNT();

  console.log("Funding CeloQuestRewards");
  console.log("  Deployer: ", deployer.address);
  console.log("  Rewards:  ", rewardsAddress);
  console.log("  Token:    ", usdcAddress, `(${symbol})`);
  console.log("  Amount:   ", amountUsdc, symbol);
  console.log("  Balance:  ", ethers.formatUnits(balance, decimals), symbol);
  console.log(
    "  Per win:  ",
    ethers.formatUnits(rewardAmount, decimals),
    symbol
  );

  if (balance < amount) {
    throw new Error(
      `Insufficient ${symbol}. Have ${ethers.formatUnits(balance, decimals)}, need ${amountUsdc}`
    );
  }

  const approveTx = await usdc.approve(rewardsAddress, amount);
  await approveTx.wait();
  console.log("Approved:", approveTx.hash);

  const depositTx = await rewards.deposit(amount);
  await depositTx.wait();
  console.log("Deposited:", depositTx.hash);

  const contractBalance = await usdc.balanceOf(rewardsAddress);
  console.log(
    "\n✅ Contract balance:",
    ethers.formatUnits(contractBalance, decimals),
    symbol
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
