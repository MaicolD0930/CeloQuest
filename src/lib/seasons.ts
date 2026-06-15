import { prisma } from "@/lib/prisma";
import { weekEnd, weekKey, weekStart } from "@/lib/game";
import { prepareWeeklyRewardDistribution } from "@/lib/contracts/rewards";
import { unlockAchievement } from "@/lib/achievements";
import { previousWeekKey } from "@/lib/game";
import {
  markSeasonSynced,
  shouldSkipSeasonSync,
} from "@/lib/seasons-sync-cache";

export type SeasonRankingEntry = {
  userId: string;
  username: string;
  avatar: string;
  walletAddress: string;
  xp: number;
  durationMs: number;
};

const ACHIEVEMENT_DEFS = {
  weekly_champion: {
    type: "weekly_champion" as const,
    emoji: "🏆",
  },
  weekly_runner_up: {
    type: "weekly_runner_up" as const,
    emoji: "🥈",
  },
  weekly_third: {
    type: "weekly_third" as const,
    emoji: "🥉",
  },
} as const;

function rankAchievementType(rank: number): keyof typeof ACHIEVEMENT_DEFS | null {
  if (rank === 1) return "weekly_champion";
  if (rank === 2) return "weekly_runner_up";
  if (rank === 3) return "weekly_third";
  return null;
}

function seasonCalendarKey(key: string): string {
  const hash = key.indexOf("#");
  return hash === -1 ? key : key.slice(0, hash);
}

async function buildRankingsForWeek(key: string): Promise<SeasonRankingEntry[]> {
  const calendarKey = seasonCalendarKey(key);
  const start = weekStart(new Date(calendarKey + "T00:00:00.000Z"));
  const end = weekEnd(new Date(calendarKey + "T00:00:00.000Z"));

  const attempts = await prisma.dailyAttempt.findMany({
    where: {
      completedAt: { gte: start, lte: end },
    },
    include: { user: true },
  });

  const byUser = new Map<string, SeasonRankingEntry>();
  for (const a of attempts) {
    const e = byUser.get(a.userId) ?? {
      userId: a.userId,
      username: a.user.username,
      avatar: a.user.avatar,
      walletAddress: a.user.walletAddress,
      xp: 0,
      durationMs: 0,
    };
    e.xp += a.xpEarned;
    e.durationMs += a.durationMs ?? 0;
    byUser.set(a.userId, e);
  }

  return [...byUser.values()].sort(
    (a, b) => b.xp - a.xp || a.durationMs - b.durationMs
  );
}

async function buildRankingsFromLiveUsers(
  seasonWeekKey: string
): Promise<SeasonRankingEntry[]> {
  const users = await prisma.user.findMany({
    where: { weeklyXp: { gt: 0 }, currentWeekKey: seasonWeekKey },
    orderBy: [{ weeklyXp: "desc" }, { weeklyDurationMs: "asc" }],
  });

  return users.map((u) => ({
    userId: u.id,
    username: u.username,
    avatar: u.avatar,
    walletAddress: u.walletAddress,
    xp: u.weeklyXp,
    durationMs: u.weeklyDurationMs,
  }));
}

/** Unique weekKey for the next season (calendar week or `#N` suffix after forced rotation). */
async function resolveNextSeasonWeekKey(): Promise<{
  key: string;
  start: Date;
  end: Date;
}> {
  const calendarKey = weekKey();
  const start = weekStart();
  const end = weekEnd();

  const calendarTaken = await prisma.weeklySeason.findUnique({
    where: { weekKey: calendarKey },
  });
  if (!calendarTaken) {
    return { key: calendarKey, start, end };
  }

  for (let n = 2; n < 1000; n++) {
    const key = `${calendarKey}#${n}`;
    const exists = await prisma.weeklySeason.findUnique({ where: { weekKey: key } });
    if (!exists) {
      return { key, start, end };
    }
  }

  throw new Error("Could not allocate next season weekKey");
}

/** Archive a season: snapshot rankings, achievements, and pending reward rows. */
export async function finalizeSeasonRecord(seasonId: string, key: string) {
  const existing = await prisma.weeklySeason.findUnique({ where: { id: seasonId } });
  if (!existing || existing.status === "archived") return;

  const rankings =
    existing.status === "active"
      ? await buildRankingsFromLiveUsers(key)
      : await buildRankingsForWeek(key);

  for (let i = 0; i < rankings.length; i++) {
    const entry = rankings[i];
    const rank = i + 1;

    await prisma.weeklySeasonEntry.create({
      data: {
        seasonId,
        userId: entry.userId,
        username: entry.username,
        avatar: entry.avatar,
        walletAddress: entry.walletAddress,
        xp: entry.xp,
        durationMs: entry.durationMs,
        rank,
      },
    });

    const achType = rankAchievementType(rank);
    if (achType) {
      await unlockAchievement(entry.userId, ACHIEVEMENT_DEFS[achType].type, {
        seasonId,
      });
    }
  }

  const topThree = rankings.slice(0, 3).map((e, i) => ({
    walletAddress: e.walletAddress as `0x${string}`,
    rank: i + 1,
  }));

  await prepareWeeklyRewardDistribution(seasonId, topThree);

  await updateWeeklyParticipationStats(key);

  const { distributeCompetitiveNfts } = await import("@/lib/achievements");
  await distributeCompetitiveNfts(seasonId);

  await prisma.weeklySeason.update({
    where: { id: seasonId },
    data: { status: "archived", finalizedAt: new Date() },
  });
}

/** Create a new active season and reset weekly leaderboard counters. */
export async function createNextActiveSeason() {
  const existing = await prisma.weeklySeason.findFirst({
    where: { status: "active" },
    orderBy: { startDate: "desc" },
  });
  if (existing) return existing;

  const { key, start, end } = await resolveNextSeasonWeekKey();
  const season = await prisma.weeklySeason.create({
    data: { weekKey: key, startDate: start, endDate: end, status: "active" },
  });

  await prisma.user.updateMany({
    data: { weeklyXp: 0, weeklyDurationMs: 0, currentWeekKey: key },
  });

  return season;
}

/** Update participation streak counters (no NFT). */
async function updateWeeklyParticipationStats(key: string) {
  const calendarKey = seasonCalendarKey(key);
  const start = weekStart(new Date(calendarKey + "T00:00:00.000Z"));
  const end = weekEnd(new Date(calendarKey + "T00:00:00.000Z"));
  const prevKey = previousWeekKey(new Date(calendarKey + "T00:00:00.000Z"));

  const attempts = await prisma.dailyAttempt.findMany({
    where: { completedAt: { gte: start, lte: end } },
    select: { userId: true },
    distinct: ["userId"],
  });

  for (const { userId } of attempts) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) continue;

    const streak =
      user.lastParticipatedWeekKey === prevKey
        ? user.participationStreak + 1
        : 1;

    await prisma.user.update({
      where: { id: userId },
      data: {
        participationStreak: streak,
        lastParticipatedWeekKey: calendarKey,
        totalWeeksParticipated: user.totalWeeksParticipated + 1,
      },
    });
  }
}

/** Ensure the active season matches the current Mon–Sun week; archive prior weeks. */
export async function ensureActiveSeason() {
  if (!("weeklySeason" in prisma)) {
    console.warn(
      "[seasons] Prisma client outdated — run: npx prisma generate && restart dev server"
    );
    return null;
  }

  const calendarStart = weekStart();

  const paidStillActive = await prisma.weeklySeason.findMany({
    where: { status: "active", rewardPaid: true },
    include: { _count: { select: { entries: true } } },
  });
  for (const season of paidStillActive) {
    if (season._count.entries === 0) {
      await finalizeSeasonRecord(season.id, season.weekKey);
    } else {
      await prisma.weeklySeason.update({
        where: { id: season.id },
        data: {
          status: "archived",
          finalizedAt: season.finalizedAt ?? new Date(),
        },
      });
    }
  }

  const stale = await prisma.weeklySeason.findMany({
    where: { status: "active", endDate: { lt: calendarStart } },
  });

  for (const season of stale) {
    await finalizeSeasonRecord(season.id, season.weekKey);
  }

  const { payPendingSeasonRewards } = await import(
    "@/lib/rewards/execute-season-reward"
  );
  await payPendingSeasonRewards();

  return createNextActiveSeason();
}

/** Best-effort season sync — never blocks gameplay if seasons fail. */
export async function safeSeasonSync(
  userId?: string,
  options?: { force?: boolean }
) {
  if (!options?.force && shouldSkipSeasonSync(userId)) {
    return;
  }

  try {
    await ensureActiveSeason();
    if (userId) await syncUserWeek(userId);
    markSeasonSynced(userId);
  } catch (e) {
    console.error("[seasons] safeSeasonSync failed:", e);
  }
}

/** Sync user's weekly counters to the active season key. */
export async function syncUserWeek(userId: string) {
  const season = await ensureActiveSeason();
  if (!season) return;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  if (user.currentWeekKey !== season.weekKey) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        weeklyXp: 0,
        weeklyDurationMs: 0,
        currentWeekKey: season.weekKey,
      },
    });
  }
}

export async function getCurrentSeasonLeaderboard(meId: string | null) {
  try {
    await safeSeasonSync(meId ?? undefined, { force: true });
  } catch (e) {
    console.error("[seasons] leaderboard sync failed:", e);
  }
  if (!("weeklySeason" in prisma)) {
    return { season: null, entries: [], me: null };
  }
  const season = await prisma.weeklySeason.findFirst({
    where: { status: "active" },
    orderBy: { startDate: "desc" },
  });
  if (!season) return { season: null, entries: [], me: null };

  const users = await prisma.user.findMany({
    where: { weeklyXp: { gt: 0 }, currentWeekKey: season.weekKey },
    orderBy: [{ weeklyXp: "desc" }, { weeklyDurationMs: "asc" }],
    take: 50,
  });

  const entries = users.map((u, i) => ({
    userId: u.id,
    username: u.username,
    avatar: u.avatar,
    walletAddress: u.walletAddress,
    xp: u.weeklyXp,
    durationMs: u.weeklyDurationMs,
    rank: i + 1,
    isMe: u.id === meId,
  }));

  const me = meId ? entries.find((e) => e.isMe) ?? null : null;
  return {
    season: {
      weekKey: season.weekKey,
      startDate: season.startDate,
      endDate: season.endDate,
      status: season.status,
    },
    entries,
    me,
  };
}

export async function getArchivedSeasons(limit = 10) {
  if (!("weeklySeason" in prisma)) return [];
  try {
    const rows = await prisma.weeklySeason.findMany({
      where: { status: "archived" },
      orderBy: { finalizedAt: "desc" },
      take: limit * 3,
      include: {
        entries: { orderBy: { rank: "asc" }, take: 10 },
      },
    });

    // Drop empty archives (paid/rotated without a ranking snapshot).
    const withEntries = rows.filter((s) => s.entries.length > 0);

    // One card per calendar week — keep the archive that has the richest snapshot.
    const byCalendar = new Map<string, (typeof withEntries)[number]>();
    for (const season of withEntries) {
      const cal = seasonCalendarKey(season.weekKey);
      const prev = byCalendar.get(cal);
      if (
        !prev ||
        season.entries.length > prev.entries.length ||
        (season.entries.length === prev.entries.length &&
          (season.finalizedAt?.getTime() ?? 0) >
            (prev.finalizedAt?.getTime() ?? 0))
      ) {
        byCalendar.set(cal, season);
      }
    }

    return [...byCalendar.values()]
      .sort(
        (a, b) =>
          (b.finalizedAt?.getTime() ?? 0) - (a.finalizedAt?.getTime() ?? 0)
      )
      .slice(0, limit);
  } catch (e) {
    console.error("[seasons] getArchivedSeasons failed:", e);
    return [];
  }
}
