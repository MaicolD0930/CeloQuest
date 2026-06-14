import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { completeSeasonWithReward } from "@/lib/rewards/execute-season-reward";
import { getTxExplorerUrl } from "@/lib/chain/config";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json().catch(() => ({}));
    const seasonId =
      typeof body?.seasonId === "string" ? body.seasonId : undefined;

    const result = await completeSeasonWithReward({
      seasonId,
    });

    if (!result.ok) {
      const status =
        result.reason === "SEASON_NOT_FOUND"
          ? 404
          : result.reason === "NO_WINNER"
            ? 400
            : result.reason === "SEASON_ALREADY_PAID" ||
                result.reason === "SEASON_ALREADY_PAID_ON_CHAIN"
              ? 409
              : 502;

      return NextResponse.json({ error: result.reason }, { status });
    }

    return NextResponse.json({
      ok: true,
      txHash: result.txHash,
      seasonId: result.seasonId,
      weekKey: result.weekKey,
      newSeasonWeekKey: result.newSeasonWeekKey,
      explorerTxUrl: getTxExplorerUrl(result.txHash),
    });
  } catch (error) {
    console.error("POST /api/admin/rewards/finalize error:", error);
    return NextResponse.json({ error: "FINALIZE_REWARD_ERROR" }, { status: 500 });
  }
}
