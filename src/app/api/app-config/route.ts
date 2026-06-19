import { NextResponse } from "next/server";
import {
  getCeloNetwork,
  getChainId,
  getRpcUrl,
} from "@/lib/chain/config";
import { getCopmTokenConfig, getUsdcTokenConfig } from "@/lib/tokens/recovery";
import { getMiniPayUsdcAddress } from "@/lib/chain/minipay-tokens";

/** Runtime chain + token config (server env — not build-time NEXT_PUBLIC only). */
export async function GET() {
  const network = getCeloNetwork();
  const copm = getCopmTokenConfig();
  const usdc = getUsdcTokenConfig();
  const usdcReadAddress =
    network === "mainnet" ? getMiniPayUsdcAddress() : usdc.address;

  return NextResponse.json({
    network,
    chainId: getChainId(),
    rpcUrl: getRpcUrl(),
    tokens: {
      copm: {
        id: copm.id,
        symbol: copm.symbol,
        address: copm.address,
        decimals: copm.decimals,
      },
      usdc: {
        id: usdc.id,
        symbol: usdc.symbol,
        address: usdc.address,
        readAddress: usdcReadAddress,
        decimals: usdc.decimals,
      },
    },
  });
}
