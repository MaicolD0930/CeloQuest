import { prisma } from "@/lib/prisma";
import type { AnswerRecord } from "@/lib/game";
import { isQuestionCategory, type QuestionCategory } from "@/lib/questions/categories";

export type CategoryMastery = {
  category: QuestionCategory;
  answered: number;
  correct: number;
  mastery: number;
};

const MASTERY_THRESHOLD = 0.7;
const MIN_ANSWERS_FOR_MASTERY = 3;

/** Aggregate per-category performance from all completed attempt answers. */
export async function computeCategoryMastery(
  userId: string
): Promise<CategoryMastery[]> {
  const attempts = await prisma.dailyAttempt.findMany({
    where: { userId, completedAt: { not: null } },
    select: { answers: true },
    orderBy: { date: "desc" },
    take: 90,
  });

  const stats = new Map<QuestionCategory, { answered: number; correct: number }>();
  const questionIds = new Set<string>();

  for (const attempt of attempts) {
    let answers: AnswerRecord[] = [];
    try {
      answers = JSON.parse(attempt.answers) as AnswerRecord[];
    } catch {
      continue;
    }
    for (const a of answers) questionIds.add(a.questionId);
  }

  if (questionIds.size === 0) {
    return [];
  }

  const questions = await prisma.question.findMany({
    where: { id: { in: [...questionIds] } },
    select: { id: true, category: true },
  });
  const categoryById = new Map(
    questions.map((q) => [q.id, q.category])
  );

  for (const attempt of attempts) {
    let answers: AnswerRecord[] = [];
    try {
      answers = JSON.parse(attempt.answers) as AnswerRecord[];
    } catch {
      continue;
    }
    for (const a of answers) {
      const catRaw = categoryById.get(a.questionId);
      if (!catRaw || !isQuestionCategory(catRaw)) continue;
      const prev = stats.get(catRaw) ?? { answered: 0, correct: 0 };
      prev.answered += 1;
      if (a.correct) prev.correct += 1;
      stats.set(catRaw, prev);
    }
  }

  return [...stats.entries()]
    .map(([category, { answered, correct }]) => ({
      category,
      answered,
      correct,
      mastery: answered > 0 ? correct / answered : 0,
    }))
    .sort((a, b) => b.mastery - a.mastery || b.answered - a.answered);
}

export function getMasteredCategories(
  mastery: CategoryMastery[]
): QuestionCategory[] {
  return mastery
    .filter(
      (m) =>
        m.answered >= MIN_ANSWERS_FOR_MASTERY &&
        m.mastery >= MASTERY_THRESHOLD
    )
    .map((m) => m.category);
}

export async function getRecentQuestionIdsForUser(
  userId: string,
  lookback = 14
): Promise<Set<string>> {
  const attempts = await prisma.dailyAttempt.findMany({
    where: { userId },
    select: { questionIds: true },
    orderBy: { date: "desc" },
    take: lookback,
  });

  const recent = new Set<string>();
  for (const a of attempts) {
    try {
      const ids = JSON.parse(a.questionIds) as string[];
      for (const id of ids) recent.add(id);
    } catch {
      /* ignore */
    }
  }
  return recent;
}

export async function countCompletedChallenges(userId: string): Promise<number> {
  return prisma.dailyAttempt.count({
    where: { userId, completedAt: { not: null }, result: "completed" },
  });
}
