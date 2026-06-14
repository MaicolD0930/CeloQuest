import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getCopmBalance, hasSufficientCopmBalance } from "@/lib/tokens/tcopm";
import { getCopmTokenConfig, getRecoveryPriceForToken } from "@/lib/tokens/recovery";
import { formatUnits } from "viem";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const token = getCopmTokenConfig();
  if (!token.address) {
    return NextResponse.json(
      { error: "TOKEN_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  try {
    const balance = await getCopmBalance(
      user.walletAddress as `0x${string}`
    );

    if (!balance) {
      return NextResponse.json(
        { error: "BALANCE_UNAVAILABLE" },
        { status: 503 }
      );
    }

    const amount = Number(balance.formatted);
    const display = Number.isFinite(amount)
      ? amount.toLocaleString(undefined, { maximumFractionDigits: 2 })
      : balance.formatted;

    return NextResponse.json({
      symbol: balance.symbol,
      formatted: balance.formatted,
      display,
      raw: balance.raw.toString(),
      decimals: balance.decimals,
      sufficient: hasSufficientCopmBalance(balance.raw),
      required: formatUnits(getRecoveryPriceForToken(token.id), balance.decimals),
      tokenAddress: token.address,
      walletAddress: user.walletAddress,
    });
  } catch (error) {
    console.error("copm-balance error:", error);
    return NextResponse.json({ error: "RPC_ERROR" }, { status: 502 });
  }
}
