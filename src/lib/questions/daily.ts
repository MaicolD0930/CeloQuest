import { prisma } from "@/lib/prisma";
import { computeLearningLevel } from "@/lib/questions/levels";
import { pickAdaptiveQuestions, collectRecentQuestionIds } from "@/lib/questions/picker";

const POOL_TTL_MS = 5 * 60 * 1000;
let cachedPool: {
  fetchedAt: number;
  items: { id: string; difficulty: number }[];
} | null = null;

async function getQuestionPool() {
  const now = Date.now();
  if (cachedPool && now - cachedPool.fetchedAt < POOL_TTL_MS) {
    return cachedPool.items;
  }
  const all = await prisma.question.findMany({
    select: { id: true, difficulty: true },
  });
  cachedPool = { fetchedAt: now, items: all };
  return all;
}

export async function buildDailyQuestionIds(params: {
  userId: string;
  xpTotal: number;
  dateKey: string;
  excludeTodayAttempt?: boolean;
  extraExcludeIds?: Iterable<string>;
  seedExtra?: string;
}): Promise<string[]> {
  const {
    userId,
    xpTotal,
    dateKey,
    excludeTodayAttempt = false,
    extraExcludeIds,
    seedExtra,
  } = params;
  const userLevel = computeLearningLevel(xpTotal).level;

  const all = await getQuestionPool();

  const recentAttempts = await prisma.dailyAttempt.findMany({
    where: {
      userId,
      ...(excludeTodayAttempt ? { date: { not: dateKey } } : {}),
    },
    select: { questionIds: true },
    orderBy: { date: "desc" },
    take: 14,
  });

  const excludeIds = collectRecentQuestionIds(recentAttempts);
  if (extraExcludeIds) {
    for (const id of extraExcludeIds) excludeIds.add(id);
  }

  return pickAdaptiveQuestions({
    pool: all,
    userId,
    dateKey,
    userLevel,
    excludeIds,
    seedExtra,
  });
}
