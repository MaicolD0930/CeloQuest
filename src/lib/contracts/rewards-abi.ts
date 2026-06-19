import { keccak256, stringToHex } from "viem";

export const REWARDS_CONTRACT_ADDRESS =
  process.env.REWARDS_CONTRACT_ADDRESS ??
  process.env.NEXT_PUBLIC_REWARDS_CONTRACT_ADDRESS ??
  "";

/** Shown in UI (marketing prize). */
export const WEEKLY_REWARD_USDC_DISPLAY = "3";
/** Actually transferred on-chain (6-decimal USDC). */
export const WEEKLY_REWARD_USDC_ACTUAL = "0.05";
/** @deprecated Use WEEKLY_REWARD_USDC_DISPLAY for UI. */
export const WEEKLY_REWARD_USDC = WEEKLY_REWARD_USDC_DISPLAY;

export const rewardsContractAbi = [
  {
    name: "finalizeSeasonReward",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "seasonId", type: "bytes32" },
      { name: "winner", type: "address" },
    ],
    outputs: [],
  },
  {
    name: "finalizeSeasonRewardForced",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "seasonId", type: "bytes32" },
      { name: "winner", type: "address" },
    ],
    outputs: [],
  },
  {
    name: "isSeasonPaid",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "seasonId", type: "bytes32" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "REWARD_AMOUNT",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "automator",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "SeasonRewardPaid",
    type: "event",
    inputs: [
      { name: "seasonId", type: "bytes32", indexed: true },
      { name: "winner", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
      { name: "forced", type: "bool", indexed: false },
    ],
  },
] as const;

export function getRewardsContractAddress(): `0x${string}` | null {
  const addr = REWARDS_CONTRACT_ADDRESS.trim();
  if (!addr || !addr.startsWith("0x") || addr.length !== 42) return null;
  return addr as `0x${string}`;
}

/** keccak256(weekKey) — must match off-chain encoding used before contract calls. */
export function weekKeyToSeasonId(weekKey: string): `0x${string}` {
  return keccak256(stringToHex(weekKey));
}
