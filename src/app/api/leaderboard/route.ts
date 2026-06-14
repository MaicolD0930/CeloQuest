import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { computeLevel } from "@/lib/game";
import { getArchivedSeasons, getCurrentSeasonLeaderboard } from "@/lib/seasons";

export async function GET(req: NextRequest) {
  const period = req.nextUrl.searchParams.get("period") === "global" ? "global" : "weekly";
  const meId = await getCurrentUserId();

  if (period === "weekly") {
    const data = await getCurrentSeasonLeaderboard(meId);
    return NextResponse.json({
      period: "weekly",
      season: data.season,
      entries: data.entries.map((e) => ({
        ...e,
        level: 0,
      })),
      me: data.me,
    });
  }

  const users = await prisma.user.findMany({
    where: { xpTotal: { gt: 0 } },
    include: { attempts: { where: { completedAt: { not: null } } } },
    orderBy: [{ xpTotal: "desc" }],
    take: 50,
  });

  const entries = users
    .map((u) => ({
      userId: u.id,
      username: u.username,
      avatar: u.avatar,
      xp: u.xpTotal,
      level: computeLevel(u.xpTotal).level,
      durationMs: u.attempts.reduce((s, a) => s + (a.durationMs ?? 0), 0),
      isMe: u.id === meId,
    }))
    .sort((a, b) => b.xp - a.xp || a.durationMs - b.durationMs)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  const me = meId ? entries.find((e) => e.isMe) ?? null : null;

  const archived = await getArchivedSeasons(5);

  return NextResponse.json({
    period: "global",
    entries,
    me,
    archivedSeasons: archived.map((s) => ({
      weekKey: s.weekKey,
      startDate: s.startDate,
      endDate: s.endDate,
      rewardPaid: s.rewardPaid,
      rewardWinnerWallet: s.rewardWinnerWallet,
      rewardAmount: s.rewardAmount,
      topEntries: s.entries.slice(0, 3),
    })),
  });
}
