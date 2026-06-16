import { NextResponse } from "next/server";
import { getRecoveryContractAddress } from "@/lib/contracts/recovery-payment";
import { getAvailableRecoveryTokens } from "@/lib/tokens/recovery";

/** Lightweight probe for uptime checks (Vercel, monitoring). */
export async function GET() {
  const contract = getRecoveryContractAddress();
  const tokens = getAvailableRecoveryTokens();
  return NextResponse.json({
    ok: true,
    service: "celoquest",
    network: process.env.NEXT_PUBLIC_CELO_NETWORK ?? "sepolia",
    paymentsConfigured: Boolean(contract && tokens.length > 0),
    recoveryTokens: tokens.map((t) => t.id),
    ts: new Date().toISOString(),
  });
}
