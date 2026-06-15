import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import {
  ACHIEVEMENT_CATALOG,
  getAchievementDef,
  localizedAchievement,
  resolveAchievementDisplay,
} from "@/lib/achievements/catalog";
import type { Locale } from "@/lib/i18n/dictionaries";
import { getTxExplorerUrl } from "@/lib/chain/config";
import { resolveAchievementSeasonLabel } from "@/lib/seasons/display";
import { getSeasonNumberMap } from "@/lib/seasons/season-numbers";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const url = new URL(req.url);
  const locale = (url.searchParams.get("locale") === "en" ? "en" : "es") as Locale;

  const achievements = await prisma.achievement.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      season: {
        select: { id: true, weekKey: true, startDate: true, endDate: true },
      },
    },
  });

  const seasonNumbers = await getSeasonNumberMap();

  const pendingCount = achievements.filter(
    (a) => a.status === "pending" && getAchievementDef(a.type)?.claimMode === "manual"
  ).length;

  const items = achievements.map((a) => {
    const display = resolveAchievementDisplay(a.type, locale, {
      title: a.title,
      description: a.description,
      emoji: a.emoji,
    });
    const def = getAchievementDef(a.type);

    return {
      id: a.id,
      type: a.type,
      title: display.title,
      description: display.description,
      emoji: display.emoji,
      status: a.status,
      claimMode: display.claimMode ?? "badge",
      tokenId: def?.tokenId ?? null,
      image: display.image,
      nftTokenId: a.nftTokenId,
      txHash: a.txHash,
      explorerUrl: a.txHash ? getTxExplorerUrl(a.txHash) : null,
      mintedAt: a.mintedAt?.toISOString() ?? null,
      createdAt: a.createdAt.toISOString(),
      season: a.season,
      seasonLabel: resolveAchievementSeasonLabel(
        a.type,
        a.season,
        a.season ? seasonNumbers.get(a.season.id) ?? null : null,
        locale
      ),
      claimable:
        a.status === "pending" &&
        display.claimMode === "manual" &&
        def?.tokenId != null,
    };
  });

  return NextResponse.json({
    pendingCount,
    achievements: items,
    catalog: Object.values(ACHIEVEMENT_CATALOG).map((def) => ({
      type: def.type,
      tokenId: def.tokenId,
      claimMode: def.claimMode,
      image: def.image,
      ...localizedAchievement(def, locale),
    })),
  });
}
