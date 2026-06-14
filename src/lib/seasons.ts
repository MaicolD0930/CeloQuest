import { prisma } from "@/lib/prisma";
import { weekEnd, weekKey, weekStart } from "@/lib/game";
import { prepareWeeklyRewardDistribution } from "@/lib/contracts/rewards";
import { awardParticipationNft } from "@/lib/achievements";
import { previousWeekKey } from "@/lib/game";

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
    emoji: "🏆",
    titleEs: "Campeón Semanal",
    titleEn: "Weekly Champion",
    descEs: "Primer lugar en la temporada semanal",
    descEn: "First place in the weekly season",
  },
  weekly_runner_up: {
    emoji: "🥈",
    titleEs: "Subcampeón Semanal",
    titleEn: "Weekly Runner-up",
    descEs: "Segundo lugar en la temporada semanal",
    descEn: "Second place in the weekly season",
  },
  weekly_third: {
    emoji: "🥉",
    titleEs: "Tercer Lugar Semanal",
    titleEn: "Weekly Third Place",
    descEs: "Tercer lugar en la temporada semanal",
    descEn: "Third place in the weekly season",
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
      const def = ACHIEVEMENT_DEFS[achType];
      await prisma.achievement.create({
        data: {
          userId: entry.userId,
          seasonId,
          type: achType,
          title: def.titleEs,
          description: def.descEs,
          emoji: def.emoji,
        },
      });
    }
  }

  const topThree = rankings.slice(0, 3).map((e, i) => ({
    walletAddress: e.walletAddress as `0x${string}`,
    rank: i + 1,
  }));

  await prepareWeeklyRewardDistribution(seasonId, topThree);

  await awardWeeklyParticipationNfts(seasonId, key);

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

/** Award streak NFTs to users who completed at least one daily challenge in the week. */
async function awardWeeklyParticipationNfts(seasonId: string, key: string) {
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

    await awardParticipationNft(userId, seasonId, streak);
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
  });
  for (const season of paidStillActive) {
    await prisma.weeklySeason.update({
      where: { id: season.id },
      data: {
        status: "archived",
        finalizedAt: season.finalizedAt ?? new Date(),
      },
    });
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
export async function safeSeasonSync(userId?: string) {
  try {
    await ensureActiveSeason();
    if (userId) await syncUserWeek(userId);
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
    await ensureActiveSeason();
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
    return await prisma.weeklySeason.findMany({
      where: { status: "archived" },
      orderBy: { finalizedAt: "desc" },
      take: limit,
      include: {
        entries: { orderBy: { rank: "asc" }, take: 10 },
      },
    });
  } catch (e) {
    console.error("[seasons] getArchivedSeasons failed:", e);
    return [];
  }
}
