import { NextRequest, NextResponse } from "next/server";
import { normalizeTxHash } from "@/lib/chain/public-client";
import { getCurrentUser } from "@/lib/session";
import { normalizeRecoveryTokenParam } from "@/lib/tokens/recovery";
import {
  httpStatusForRefill,
  processRefillRequest,
  toRefillJson,
} from "@/lib/payments/refill-request";

/** Vercel Hobby caps at 10s — keep verification under that budget. */
export const maxDuration = 10;

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const rawHash = typeof body?.txHash === "string" ? body.txHash : null;
    const txHash = rawHash ? normalizeTxHash(rawHash) : null;
    const token = normalizeRecoveryTokenParam(body?.token);

    if (!txHash) {
      return NextResponse.json({ error: "txHash required" }, { status: 400 });
    }

    const payerWallet =
      typeof body?.payerWallet === "string" ? body.payerWallet : undefined;

    const result = await processRefillRequest({
      userId: user.id,
      walletAddress: user.walletAddress,
      payerWallet,
      txHash,
      token,
      optimistic: body?.optimistic === true,
    });

    if (result.status === "failed") {
      console.error("refill verification failed", {
        reason: result.reason,
        txHash,
        token,
        wallet: user.walletAddress,
      });
    }

    return NextResponse.json(toRefillJson(result), {
      status: httpStatusForRefill(result),
    });
  } catch (error) {
    console.error("refill route error:", error);
    return NextResponse.json(
      { status: "pending", reason: "SERVER_ERROR" },
      { status: 202 }
    );
  }
}
