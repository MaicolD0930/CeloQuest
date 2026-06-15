import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import {
  claimPersonalAchievement,
  getAchievementDef,
} from "@/lib/achievements";
import type { AchievementType } from "@/lib/achievements/catalog";
import { getTxExplorerUrl } from "@/lib/chain/config";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const type =
    typeof body?.type === "string" ? (body.type as AchievementType) : null;

  if (!type || !getAchievementDef(type)) {
    return NextResponse.json({ error: "INVALID_TYPE" }, { status: 400 });
  }

  const def = getAchievementDef(type);
  if (!def || def.claimMode !== "manual") {
    return NextResponse.json({ error: "NOT_CLAIMABLE" }, { status: 400 });
  }

  const result = await claimPersonalAchievement(
    user.id,
    user.walletAddress,
    type
  );

  if (!result.ok) {
    const status =
      result.reason === "NOT_UNLOCKED" || result.reason === "NOT_ELIGIBLE"
        ? 403
        : result.reason === "ALREADY_CLAIMED"
          ? 409
          : 502;

    return NextResponse.json({ error: result.reason }, { status });
  }

  return NextResponse.json({
    ok: true,
    txHash: result.txHash,
    tokenId: result.tokenId,
    explorerUrl: getTxExplorerUrl(result.txHash),
    achievementId: result.achievementId,
  });
}
