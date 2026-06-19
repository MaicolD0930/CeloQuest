import { NextRequest, NextResponse } from "next/server";
import { formatUnits } from "viem";
import { getCurrentUser } from "@/lib/session";
import { getCeloNetwork } from "@/lib/chain/config";
import { createChainPublicClient } from "@/lib/chain/public-client";
import { getMiniPayUsdcAddress } from "@/lib/chain/minipay-tokens";
import { erc20ExtendedAbi } from "@/lib/contracts/recovery-payment-abi";
import {
  getRecoveryContractAddress,
  readRecoveryPriceForToken,
} from "@/lib/contracts/recovery-payment";
import {
  getRecoveryTokenConfig,
  normalizeRecoveryTokenParam,
} from "@/lib/tokens/recovery";
import {
  formatRecoveryPriceFromAtomic,
  getRecoveryPriceAtomicAsync,
} from "@/lib/pricing/recovery-price";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const tokenId = normalizeRecoveryTokenParam(
    req.nextUrl.searchParams.get("token")
  );
  const config = getRecoveryTokenConfig(tokenId);
  const contract = getRecoveryContractAddress();

  if (!config?.address || !contract) {
    return NextResponse.json(
      { error: "PAYMENT_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  const wallet = user.walletAddress as `0x${string}`;
  const tokenAddress =
    tokenId === "USDC" && getCeloNetwork() === "mainnet"
      ? getMiniPayUsdcAddress()
      : config.address;
  const client = createChainPublicClient();

  try {
    const [raw, allowance, onChainPrice] = await Promise.all([
      client.readContract({
        address: tokenAddress,
        abi: erc20ExtendedAbi,
        functionName: "balanceOf",
        args: [wallet],
      }),
      client.readContract({
        address: tokenAddress,
        abi: erc20ExtendedAbi,
        functionName: "allowance",
        args: [wallet, contract],
      }),
      readRecoveryPriceForToken(tokenAddress),
    ]);

    const required =
      (onChainPrice && onChainPrice > BigInt(0) ? onChainPrice : null) ??
      (await getRecoveryPriceAtomicAsync(tokenId));
    const formatted = formatUnits(raw, config.decimals);
    const amount = Number(formatted);
    const display = Number.isFinite(amount)
      ? amount.toLocaleString(undefined, { maximumFractionDigits: 2 })
      : formatted;

    return NextResponse.json({
      token: tokenId,
      symbol: config.symbol,
      formatted,
      display,
      raw: raw.toString(),
      decimals: config.decimals,
      required: formatUnits(required, config.decimals),
      requiredDisplay: formatRecoveryPriceFromAtomic(tokenId, required),
      requiredRaw: required.toString(),
      sufficient: raw >= required,
      allowance: allowance.toString(),
      allowanceSufficient: allowance >= required,
      tokenAddress: tokenAddress,
      contractAddress: contract,
      walletAddress: user.walletAddress,
    });
  } catch (error) {
    console.error("recovery-balance error:", error);
    return NextResponse.json({ error: "RPC_ERROR" }, { status: 502 });
  }
}
