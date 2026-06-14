import { NextResponse } from "next/server";
import { createPublicClient, formatUnits, http } from "viem";
import { getCurrentUser } from "@/lib/session";
import { getActiveChain, getRpcUrl } from "@/lib/chain/config";
import { erc20Abi } from "@/lib/tokens/erc20";
import { getCopmBalance } from "@/lib/tokens/tcopm";
import { getCopmTokenConfig, getUsdcTokenConfig } from "@/lib/tokens/recovery";

function formatDisplay(formatted: string): string {
  const amount = Number(formatted);
  return Number.isFinite(amount)
    ? amount.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : formatted;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const wallet = user.walletAddress as `0x${string}`;
  const tcopmConfig = getCopmTokenConfig();
  const usdcConfig = getUsdcTokenConfig();

  const tcopm = {
    configured: Boolean(tcopmConfig.address),
    symbol: tcopmConfig.symbol,
    display: "0",
    error: false as boolean,
  };
  const usdc = {
    configured: Boolean(usdcConfig.address),
    symbol: usdcConfig.symbol,
    display: "0",
    error: false as boolean,
  };

  if (tcopmConfig.address) {
    try {
      const balance = await getCopmBalance(wallet);
      if (balance) {
        tcopm.display = formatDisplay(balance.formatted);
        tcopm.symbol = balance.symbol;
      } else {
        tcopm.error = true;
      }
    } catch (error) {
      console.error("wallet/balances tcopm error:", error);
      tcopm.error = true;
    }
  }

  if (usdcConfig.address) {
    try {
      const client = createPublicClient({
        chain: getActiveChain(),
        transport: http(getRpcUrl()),
      });
      const raw = await client.readContract({
        address: usdcConfig.address,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [wallet],
      });
      usdc.display = formatDisplay(formatUnits(raw, usdcConfig.decimals));
    } catch (error) {
      console.error("wallet/balances usdc error:", error);
      usdc.error = true;
    }
  }

  return NextResponse.json({ tcopm, usdc });
}
