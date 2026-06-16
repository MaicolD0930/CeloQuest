import { NextResponse } from "next/server";
import { ensureActiveSeason } from "@/lib/seasons";
import { payPendingSeasonRewards } from "@/lib/rewards/execute-season-reward";

/**
 * Vercel Cron — archive stale seasons and pay pending weekly rewards (USDC).
 * Secured with CRON_SECRET (Authorization: Bearer …).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_NOT_CONFIGURED" }, { status: 503 });
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureActiveSeason();
    await payPendingSeasonRewards();
    return NextResponse.json({ ok: true, ts: new Date().toISOString() });
  } catch (error) {
    console.error("[cron/seasons]", error);
    return NextResponse.json({ error: "CRON_FAILED" }, { status: 500 });
  }
}
