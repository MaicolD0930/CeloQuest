import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import {
  ACHIEVEMENT_CATALOG,
  localizedAchievement,
  resolveAchievementDisplay,
} from "@/lib/achievements/catalog";
import type { Locale } from "@/lib/i18n/dictionaries";
import { resolveAchievementSeasonLabel } from "@/lib/seasons/display";
import { getSeasonNumberMap } from "@/lib/seasons/season-numbers";
import { normalizeLegacyAchievementStatuses } from "@/lib/achievements";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const url = new URL(req.url);
  const locale = (url.searchParams.get("locale") === "en" ? "en" : "es") as Locale;

  await normalizeLegacyAchievementStatuses(user.id);

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

  const items = achievements.map((a) => {
    const display = resolveAchievementDisplay(a.type, locale, {
      title: a.title,
      description: a.description,
      emoji: a.emoji,
    });

    return {
      id: a.id,
      type: a.type,
      title: display.title,
      description: display.description,
      emoji: display.emoji,
      status: a.status === "pending" || a.status === "failed" ? "claimed" : a.status,
      image: display.image,
      createdAt: a.createdAt.toISOString(),
      season: a.season,
      seasonLabel: resolveAchievementSeasonLabel(
        a.type,
        a.season,
        a.season ? seasonNumbers.get(a.season.id) ?? null : null,
        locale
      ),
    };
  });

  return NextResponse.json({
    earnedCount: items.length,
    achievements: items,
    catalog: Object.values(ACHIEVEMENT_CATALOG).map((def) => ({
      type: def.type,
      claimMode: def.claimMode,
      image: def.image,
      ...localizedAchievement(def, locale),
    })),
  });
}
