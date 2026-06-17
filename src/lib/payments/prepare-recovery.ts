import { encodeFunctionData } from "viem";
import { recoveryPaymentAbi } from "@/lib/contracts/recovery-payment-abi";
import {
  getRecoveryContractAddress,
  readRecoveryPriceForTokenId,
} from "@/lib/contracts/recovery-payment";
import {
  formatRecoveryPriceFromAtomic,
  getRecoveryPricingMetaAsync,
} from "@/lib/pricing/recovery-price";
import {
  getRecoveryTokenConfig,
  getRecoveryTreasury,
  normalizeRecoveryTokenParam,
  type RecoveryTokenId,
} from "@/lib/tokens/recovery";
import { getRecoveryPaymentPublicClient } from "@/lib/contracts/recovery-payment";

export type PreparedRecoveryPayment = {
  token: RecoveryTokenId;
  tokenAddress: `0x${string}`;
  contractAddress: `0x${string}`;
  treasuryAddress: `0x${string}`;
  recoveryPrice: string;
  priceDisplay: string;
  priceUsd: number;
  walletAddress?: string;
};

export async function resolveTreasuryAddress(): Promise<`0x${string}` | null> {
  const fromEnv = getRecoveryTreasury();
  if (fromEnv) return fromEnv;

  const contractAddress = getRecoveryContractAddress();
  if (!contractAddress) return null;

  try {
    const treasury = await getRecoveryPaymentPublicClient().readContract({
      address: contractAddress,
      abi: recoveryPaymentAbi,
      functionName: "treasury",
    });
    return treasury as `0x${string}`;
  } catch {
    return null;
  }
}

/** Build calldata for RecoveryPaymentContract.purchaseRecovery (server-side env). */
export async function prepareRecoveryPayment(
  tokenInput: unknown,
  walletAddress?: string
): Promise<PreparedRecoveryPayment> {
  const token = normalizeRecoveryTokenParam(tokenInput);
  const config = getRecoveryTokenConfig(token);
  const contractAddress = getRecoveryContractAddress();
  const treasuryAddress = await resolveTreasuryAddress();

  if (!config?.address || !contractAddress || !treasuryAddress) {
    throw new Error("PAYMENT_NOT_CONFIGURED");
  }

  const recoveryPrice = await readRecoveryPriceForTokenId(token, config.address);
  const meta = await getRecoveryPricingMetaAsync();

  encodeFunctionData({
    abi: recoveryPaymentAbi,
    functionName: "purchaseRecovery",
    args: [config.address],
  });

  return {
    token,
    tokenAddress: config.address,
    contractAddress,
    treasuryAddress,
    recoveryPrice: recoveryPrice.toString(),
    priceDisplay: formatRecoveryPriceFromAtomic(token, recoveryPrice),
    priceUsd: meta.priceUsd,
    walletAddress,
  };
}

export function encodePurchaseRecovery(tokenAddress: `0x${string}`): `0x${string}` {
  return encodeFunctionData({
    abi: recoveryPaymentAbi,
    functionName: "purchaseRecovery",
    args: [tokenAddress],
  });
}

export {
  getRecoveryPricingMetaAsync,
  formatRecoveryPriceFromAtomic,
  getRecoveryPriceAtomicAsync,
} from "@/lib/pricing/recovery-price";
