import { NextRequest, NextResponse } from "next/server";
import { normalizeTxHash } from "@/lib/chain/public-client";
import { getCurrentUser } from "@/lib/session";
import { normalizeRecoveryTokenParam } from "@/lib/tokens/recovery";
import {
  httpStatusForRefill,
  processRefillRequest,
  toRefillJson,
} from "@/lib/payments/refill-request";

export const maxDuration = 10;

/** Lightweight poll: verify receipt + grant life if payment is on-chain. */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const rawHash = req.nextUrl.searchParams.get("txHash");
    const txHash = rawHash ? normalizeTxHash(rawHash) : null;
    const token = normalizeRecoveryTokenParam(
      req.nextUrl.searchParams.get("token")
    );

    if (!txHash) {
      return NextResponse.json({ error: "txHash required" }, { status: 400 });
    }

    const payerWallet =
      req.nextUrl.searchParams.get("payerWallet") ?? undefined;

    const result = await processRefillRequest({
      userId: user.id,
      walletAddress: user.walletAddress,
      payerWallet: payerWallet ?? undefined,
      txHash,
      token,
    });

    return NextResponse.json(toRefillJson(result), {
      status: httpStatusForRefill(result),
    });
  } catch (error) {
    console.error("refill status error:", error);
    return NextResponse.json(
      { status: "pending", reason: "SERVER_ERROR" },
      { status: 202 }
    );
  }
}
