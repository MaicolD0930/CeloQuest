import { parseAbi } from "viem";

/** Standard ERC-20 ABI used for recovery payments and balance reads. */
export const erc20Abi = parseAbi([
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

export const ERC20_DECIMALS_DEFAULT = 6;
