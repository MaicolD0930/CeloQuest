import {
  createPublicClient,
  encodeFunctionData,
  formatUnits,
  type Hash,
} from "viem";
import { getActiveChain } from "@/lib/chain/config";
import { createChainPublicClient } from "@/lib/chain/public-client";
import { erc20Abi } from "@/lib/tokens/erc20";
import {
  getCopmTokenConfig,
  getRecoveryPriceForToken,
  getRecoveryTreasury,
  type RecoveryTokenId,
} from "@/lib/tokens/recovery";

export type CopmBalance = {
  raw: bigint;
  formatted: string;
  symbol: string;
  decimals: number;
};

export type PreparedCopmRecoveryTransfer = {
  token: RecoveryTokenId;
  tokenAddress: `0x${string}`;
  treasury: `0x${string}`;
  amount: bigint;
  amountFormatted: string;
  /** ERC-20 transfer calldata target (token contract). */
  to: `0x${string}`;
  data: `0x${string}`;
};

function getPublicClient() {
  return createChainPublicClient();
}

/** Read the user's COPM balance (tCOPM on Sepolia, cCOPM on mainnet). */
export async function getCopmBalance(
  walletAddress: `0x${string}`
): Promise<CopmBalance | null> {
  const config = getCopmTokenConfig();
  if (!config.address) return null;

  const client = getPublicClient();
  const raw = await client.readContract({
    address: config.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [walletAddress],
  });

  return {
    raw,
    formatted: formatUnits(raw, config.decimals),
    symbol: config.symbol,
    decimals: config.decimals,
  };
}

/** Whether the wallet holds enough COPM for one life recovery. */
export function hasSufficientCopmBalance(balance: bigint): boolean {
  const config = getCopmTokenConfig();
  return balance >= getRecoveryPriceForToken(config.id);
}

/** Check balance on-chain and return sufficiency flag. */
export async function checkCopmRecoveryEligibility(
  walletAddress: `0x${string}`
): Promise<{
  balance: CopmBalance | null;
  sufficient: boolean;
  required: bigint;
  requiredFormatted: string;
}> {
  const config = getCopmTokenConfig();
  const required = getRecoveryPriceForToken(config.id);
  const balance = await getCopmBalance(walletAddress);

  return {
    balance,
    sufficient: balance ? hasSufficientCopmBalance(balance.raw) : false,
    required,
    requiredFormatted: formatUnits(required, config.decimals),
  };
}

/**
 * Build an ERC-20 transfer of 0.10 COPM to the recovery treasury.
 * Client sends via walletClient.sendTransaction({ to, data }).
 */
export function prepareCopmRecoveryTransfer(): PreparedCopmRecoveryTransfer {
  const config = getCopmTokenConfig();
  const treasury = getRecoveryTreasury();
  const amount = getRecoveryPriceForToken(config.id);

  if (!config.address || !treasury) {
    throw new Error("PAYMENT_NOT_CONFIGURED");
  }

  const data = encodeFunctionData({
    abi: erc20Abi,
    functionName: "transfer",
    args: [treasury, amount],
  });

  return {
    token: config.id,
    tokenAddress: config.address,
    treasury,
    amount,
    amountFormatted: formatUnits(amount, config.decimals),
    to: config.address,
    data,
  };
}

/** Explorer link for a recovery payment transaction. */
export function getCopmTxUrl(hash: Hash): string {
  const base = getActiveChain().blockExplorers?.default.url ?? "";
  return `${base.replace(/\/$/, "")}/tx/${hash}`;
}
