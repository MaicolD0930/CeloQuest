export const ACHIEVEMENTS_CONTRACT_ADDRESS =
  process.env.ACHIEVEMENTS_CONTRACT_ADDRESS ??
  process.env.NEXT_PUBLIC_ACHIEVEMENTS_CONTRACT_ADDRESS ??
  "";

export const achievementsContractAbi = [
  {
    name: "mintPersonal",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "mintCompetitive",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "personalClaimed",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "wallet", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "AchievementMinted",
    type: "event",
    inputs: [
      { name: "to", type: "address", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;

export function getAchievementsContractAddress(): `0x${string}` | null {
  const addr = ACHIEVEMENTS_CONTRACT_ADDRESS.trim();
  if (!addr || !addr.startsWith("0x") || addr.length !== 42) return null;
  return addr as `0x${string}`;
}
