import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { sendAdminToken } from "@/lib/admin/send-token";
import { getTxExplorerUrl } from "@/lib/chain/config";
import { normalizeRecoveryTokenParam } from "@/lib/tokens/recovery";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const token =
    typeof body === "object" &&
    body !== null &&
    "token" in body &&
    typeof (body as { token: unknown }).token === "string"
      ? (body as { token: string }).token
      : null;

  const to =
    typeof body === "object" &&
    body !== null &&
    "to" in body &&
    typeof (body as { to: unknown }).to === "string"
      ? (body as { to: string }).to
      : null;

  const amount =
    typeof body === "object" &&
    body !== null &&
    "amount" in body &&
    typeof (body as { amount: unknown }).amount === "string"
      ? (body as { amount: string }).amount
      : null;

  if (!token || !to || !amount) {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
  }

  const normalized = normalizeRecoveryTokenParam(token);
  if (normalized !== "USDC" && normalized !== "tCOPM" && normalized !== "cCOPM") {
    return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 400 });
  }

  try {
    const result = await sendAdminToken({ token: normalized, to, amount });
    return NextResponse.json({
      ok: true,
      txHash: result.txHash,
      explorerTxUrl: getTxExplorerUrl(result.txHash),
      symbol: result.symbol,
      amount: result.amount,
      to: result.to,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "SEND_FAILED";
    const status =
      message === "INVALID_ADDRESS" ||
      message === "INVALID_AMOUNT" ||
      message === "INVALID_TOKEN"
        ? 400
        : message === "TOKEN_NOT_CONFIGURED" ||
            message === "TREASURY_KEY_NOT_CONFIGURED"
          ? 503
          : 500;

    console.error("POST /api/admin/send-token error:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
