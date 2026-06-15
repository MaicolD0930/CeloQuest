import { NextResponse } from "next/server";

/** Lightweight probe for uptime checks (Vercel, monitoring). */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "celoquest",
    network: process.env.NEXT_PUBLIC_CELO_NETWORK ?? "sepolia",
    ts: new Date().toISOString(),
  });
}
