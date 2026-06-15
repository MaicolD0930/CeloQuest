import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import {
  computeLevel,
  todayKey,
  LIVES_PER_DAY,
  QUESTIONS_PER_DAY,
  weekEnd,
  weekKey,
  type AnswerRecord,
} from "@/lib/game";
import { getNextTierName } from "@/lib/questions/levels";
import { allowDailyChallengeRetry } from "@/lib/dev-flags";
import { isCurrentUserAdmin } from "@/lib/admin/auth";
import { maybeAwardMilestoneAchievements } from "@/lib/achievements";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const fresh = await prisma.user.findUnique({ where: { id: user.id } });
    if (!fresh) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const attempt = await prisma.dailyAttempt.findUnique({
      where: { userId_date: { userId: fresh.id, date: todayKey() } },
    });

    let answers: AnswerRecord[] = [];
    if (attempt?.answers) {
      try {
        answers = JSON.parse(attempt.answers) as AnswerRecord[];
      } catch {
        answers = [];
      }
    }

    let season = null;
    try {
      if ("weeklySeason" in prisma) {
        season = await prisma.weeklySeason.findFirst({
          where: { status: "active" },
          orderBy: { startDate: "desc" },
        });
      }
    } catch (e) {
      console.error("Season lookup failed:", e);
    }

    const isAdmin = await isCurrentUserAdmin();
    const locale = fresh.locale === "en" ? "en" : "es";
    await maybeAwardMilestoneAchievements(fresh.id, fresh.xpTotal, locale);
    const levelInfo = computeLevel(fresh.xpTotal, locale);

    return NextResponse.json({
      user: fresh,
      isAdmin,
      levelInfo: {
        ...levelInfo,
        nextTierName: getNextTierName(levelInfo.level, locale),
      },
      season: season
        ? {
            weekKey: season.weekKey,
            startDate: season.startDate,
            endDate: season.endDate,
          }
        : null,
      today: {
        started: !!attempt,
        completed:
          allowDailyChallengeRetry() ? false : !!attempt?.completedAt,
        awaitingRefill:
          attempt?.result === "awaiting_refill" && !attempt.completedAt,
        answeredCount: answers.length,
        totalQuestions: QUESTIONS_PER_DAY,
        livesLeft: attempt?.livesLeft ?? LIVES_PER_DAY,
        xpEarned: attempt?.xpEarned ?? 0,
        result: attempt?.result ?? null,
      },
      weekly: {
        xp: fresh.weeklyXp,
        durationMs: fresh.weeklyDurationMs,
        endsAt: weekEnd().toISOString(),
      },
    });
  } catch (error) {
    console.error("GET /api/users/me error:", error);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
