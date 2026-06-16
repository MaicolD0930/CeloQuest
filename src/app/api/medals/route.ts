import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { normalizeLegacyAchievementStatuses } from "@/lib/achievements";
import { resolveAchievementSeasonLabel } from "@/lib/seasons/display";
import { getSeasonNumberMap } from "@/lib/seasons/season-numbers";
import type { Locale } from "@/lib/i18n/dictionaries";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const url = new URL(req.url);
  const locale = (url.searchParams.get("locale") === "en" ? "en" : "es") as Locale;

  try {
    await normalizeLegacyAchievementStatuses(user.id);

    const achievements =
      "achievement" in prisma
        ? await prisma.achievement.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            include: {
              season: {
                select: {
                  id: true,
                  weekKey: true,
                  startDate: true,
                  endDate: true,
                },
              },
            },
          })
        : [];

    const seasonHistory =
      "weeklySeasonEntry" in prisma
        ? await prisma.weeklySeasonEntry.findMany({
            where: { userId: user.id },
            orderBy: { season: { startDate: "desc" } },
            include: {
              season: {
                select: {
                  weekKey: true,
                  startDate: true,
                  endDate: true,
                  status: true,
                },
              },
            },
          })
        : [];

    const dailyHistory = await prisma.dailyAttempt.findMany({
      where: { userId: user.id, completedAt: { not: null } },
      orderBy: { date: "desc" },
      take: 30,
      select: {
        date: true,
        xpEarned: true,
        durationMs: true,
        result: true,
        livesLeft: true,
        lifeRefillUsed: true,
        completedAt: true,
      },
    });

    const seasonNumbers = await getSeasonNumberMap();
    const achievementsWithSeason = achievements.map((a) => ({
      ...a,
      seasonLabel: resolveAchievementSeasonLabel(
        a.type,
        a.season,
        a.season ? seasonNumbers.get(a.season.id) ?? null : null,
        locale
      ),
    }));

    return NextResponse.json({
      username: user.username,
      walletAddress: user.walletAddress,
      participationStreak: user.participationStreak,
      totalWeeksParticipated: user.totalWeeksParticipated,
      achievements: achievementsWithSeason,
      seasonHistory,
      dailyHistory,
    });
  } catch (e) {
    console.error("GET /api/medals failed:", e);
    return NextResponse.json({ error: "Failed to load medals" }, { status: 500 });
  }
}
