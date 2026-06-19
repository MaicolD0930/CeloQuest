import { NextResponse } from "next/server";
import { getRecoveryContractAddress } from "@/lib/contracts/recovery-payment";
import { getAvailableRecoveryTokens } from "@/lib/tokens/recovery";
import { getCeloNetwork, getChainId } from "@/lib/chain/config";
import { prisma } from "@/lib/prisma";

/** Lightweight probe for uptime checks (Vercel, monitoring). */
export async function GET() {
  const contract = getRecoveryContractAddress();
  const tokens = getAvailableRecoveryTokens();

  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch (e) {
    console.error("health db probe failed:", e);
  }

  return NextResponse.json({
    ok: dbOk,
    service: "celoquest",
    network: getCeloNetwork(),
    chainId: getChainId(),
    paymentsConfigured: Boolean(contract && tokens.length > 0),
    dbOk,
    recoveryTokens: tokens.map((t) => t.id),
    ts: new Date().toISOString(),
  });
}
