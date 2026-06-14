import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const achievements =
      "achievement" in prisma
        ? await prisma.achievement.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            include: {
              season: {
                select: { weekKey: true, startDate: true, endDate: true },
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

    const pendingRewards =
      "rewardDistribution" in prisma
        ? await prisma.rewardDistribution.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            include: {
              season: { select: { weekKey: true } },
            },
          })
        : [];

    return NextResponse.json({
      username: user.username,
      walletAddress: user.walletAddress,
      participationStreak: user.participationStreak,
      totalWeeksParticipated: user.totalWeeksParticipated,
      achievements,
      seasonHistory,
      dailyHistory,
      pendingRewards,
    });
  } catch (e) {
    console.error("GET /api/medals failed:", e);
    return NextResponse.json({ error: "Failed to load medals" }, { status: 500 });
  }
}
