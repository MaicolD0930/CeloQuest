import { parseAbi } from "viem";

export const recoveryPaymentAbi = parseAbi([
  "function purchaseRecovery(address token) external",
  "function recoveryPriceByToken(address token) view returns (uint256)",
  "function treasury() view returns (address)",
  "function allowedTokens(address token) view returns (bool)",
  "function setRecoveryPriceForToken(address token, uint256 newPrice) external",
  "function setAllowedToken(address token, bool allowed) external",
  "function setTreasury(address newTreasury) external",
  "function withdrawToken(address token, uint256 amount) external",
  "event RecoveryPurchased(address indexed user, address indexed token, uint256 amount, uint256 timestamp)",
  "event RecoveryPriceUpdated(address indexed token, uint256 oldPrice, uint256 newPrice)",
  "event TokenAllowed(address indexed token, bool allowed)",
  "event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury)",
]);

export const erc20ExtendedAbi = parseAbi([
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);
