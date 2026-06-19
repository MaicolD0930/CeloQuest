import type { PublicClient } from "viem";
import { createChainPublicClient } from "@/lib/chain/public-client";
import { recoveryPaymentAbi } from "@/lib/contracts/recovery-payment-abi";
import type { RecoveryTokenId } from "@/lib/tokens/recovery";
import { getRecoveryPriceAtomicAsync } from "@/lib/pricing/recovery-price";

export function getRecoveryContractAddress(): `0x${string}` | null {
  const addr =
    process.env.RECOVERY_CONTRACT_ADDRESS ??
    process.env.NEXT_PUBLIC_RECOVERY_CONTRACT_ADDRESS;
  if (!addr) return null;
  return addr as `0x${string}`;
}

export function getRecoveryPaymentPublicClient(): PublicClient {
  return createChainPublicClient();
}

/** Read per-token recovery price from the on-chain contract. */
export async function readRecoveryPriceForToken(
  tokenAddress: `0x${string}`
): Promise<bigint | null> {
  const contract = getRecoveryContractAddress();
  if (!contract) return null;

  try {
    const client = getRecoveryPaymentPublicClient();
    return await client.readContract({
      address: contract,
      abi: recoveryPaymentAbi,
      functionName: "recoveryPriceByToken",
      args: [tokenAddress],
    });
  } catch {
    return null;
  }
}

export async function readRecoveryPriceForTokenId(
  token: RecoveryTokenId,
  tokenAddress: `0x${string}`
): Promise<bigint> {
  const onChain = await readRecoveryPriceForToken(tokenAddress);
  if (onChain && onChain > BigInt(0)) return onChain;
  return getRecoveryPriceAtomicAsync(token);
}

export async function isTokenAllowedOnContract(
  tokenAddress: `0x${string}`
): Promise<boolean> {
  const contract = getRecoveryContractAddress();
  if (!contract) return false;

  try {
    const client = getRecoveryPaymentPublicClient();
    return await client.readContract({
      address: contract,
      abi: recoveryPaymentAbi,
      functionName: "allowedTokens",
      args: [tokenAddress],
    });
  } catch {
    return false;
  }
}
