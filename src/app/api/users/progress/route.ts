import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { computeLevel } from "@/lib/game";
import { getNextTierName } from "@/lib/questions/levels";
import {
  computeCategoryMastery,
  getMasteredCategories,
  countCompletedChallenges,
} from "@/lib/questions/progress";
import { resolveAchievementDisplay } from "@/lib/achievements/catalog";
import type { Locale } from "@/lib/i18n/dictionaries";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const url = new URL(req.url);
    const locale = (url.searchParams.get("locale") === "en" ? "en" : "es") as Locale;

    const fresh = await prisma.user.findUnique({ where: { id: user.id } });
    if (!fresh) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const levelInfo = computeLevel(fresh.xpTotal, locale);
    const nextTierName = getNextTierName(levelInfo.level, locale);

    const [categoryMastery, completedChallenges, achievements] =
      await Promise.all([
        computeCategoryMastery(fresh.id),
        countCompletedChallenges(fresh.id),
        prisma.achievement.findMany({
          where: { userId: fresh.id },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
      ]);

    const masteredCategories = getMasteredCategories(categoryMastery);

    return NextResponse.json({
      user: {
        username: fresh.username,
        avatar: fresh.avatar,
        xpTotal: fresh.xpTotal,
        streak: fresh.streak,
        walletAddress: fresh.walletAddress,
      },
      level: {
        ...levelInfo,
        nextTierName,
      },
      stats: {
        completedChallenges,
        masteredCategories,
        categoryMastery,
      },
      achievements: achievements.map((a) => {
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
          image: display.image,
          status: a.status,
          createdAt: a.createdAt,
        };
      }),
    });
  } catch (error) {
    console.error("GET /api/users/progress error:", error);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
