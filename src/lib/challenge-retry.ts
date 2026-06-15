import { prisma } from "@/lib/prisma";
import type { DailyAttempt, User } from "@prisma/client";
import { LIVES_PER_DAY, todayKey, type AnswerRecord } from "@/lib/game";
import { allowDailyChallengeRetry } from "@/lib/dev-flags";
import { buildDailyQuestionIds } from "@/lib/questions/daily";
import { finalizeDailyAttempt } from "@/lib/attempts";

function parseQuestionIds(raw: string): string[] {
  try {
    const ids = JSON.parse(raw) as string[];
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

function parseAnswers(raw: string): AnswerRecord[] {
  try {
    const answers = JSON.parse(raw) as AnswerRecord[];
    return Array.isArray(answers) ? answers : [];
  } catch {
    return [];
  }
}

async function resetAttemptQuestions(
  attempt: DailyAttempt,
  user: { id: string; xpTotal: number }
): Promise<DailyAttempt> {
  const ids = await buildDailyQuestionIds({
    userId: user.id,
    xpTotal: user.xpTotal,
    dateKey: attempt.date,
    excludeTodayAttempt: true,
  });

  return prisma.dailyAttempt.update({
    where: { id: attempt.id },
    data: {
      questionIds: JSON.stringify(ids),
      answers: "[]",
      livesLeft: LIVES_PER_DAY,
      lifeRefillUsed: false,
      result: "in_progress",
      refillTxHash: null,
      refillToken: null,
      xpEarned: 0,
      completedAt: null,
      durationMs: null,
      startedAt: new Date(),
    },
  });
}

/**
 * Fix broken attempts: stale question ids after re-seed, or stuck all-answered state.
 */
export async function repairDailyAttempt(
  attempt: DailyAttempt,
  user: Pick<User, "id" | "xpTotal">
): Promise<DailyAttempt> {
  const questionIds = parseQuestionIds(attempt.questionIds);
  const answers = parseAnswers(attempt.answers);

  if (questionIds.length === 0) {
    return resetAttemptQuestions(attempt, user);
  }

  const validCount = await prisma.question.count({
    where: { id: { in: questionIds } },
  });

  if (validCount !== questionIds.length) {
    return resetAttemptQuestions(attempt, user);
  }

  const allAnswered =
    !attempt.completedAt &&
    questionIds.length > 0 &&
    answers.length >= questionIds.length;

  if (allAnswered && allowDailyChallengeRetry()) {
    return resetAttemptQuestions(attempt, user);
  }

  if (
    allAnswered &&
    (attempt.result === "in_progress" || attempt.result === "awaiting_refill")
  ) {
    const fullUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!fullUser) return attempt;

    const result =
      attempt.livesLeft <= 0 && attempt.result === "awaiting_refill"
        ? ("out_of_lives" as const)
        : ("completed" as const);

    await finalizeDailyAttempt(attempt, fullUser, result);
    const updated = await prisma.dailyAttempt.findUnique({
      where: { id: attempt.id },
    });
    return updated ?? attempt;
  }

  return attempt;
}

/** Reset a finished attempt so the same-day challenge can be replayed (dev/testing). */
export async function maybeResetCompletedAttempt(  attempt: DailyAttempt,
  user?: { id: string; xpTotal: number }
): Promise<DailyAttempt> {
  if (!allowDailyChallengeRetry() || !attempt.completedAt) {
    return attempt;
  }

  let questionIds = attempt.questionIds;
  if (user) {
    const ids = await buildDailyQuestionIds({
      userId: user.id,
      xpTotal: user.xpTotal,
      dateKey: attempt.date,
      excludeTodayAttempt: true,
    });
    questionIds = JSON.stringify(ids);
  }

  return prisma.dailyAttempt.update({
    where: { id: attempt.id },
    data: {
      questionIds,
      answers: "[]",
      livesLeft: LIVES_PER_DAY,
      lifeRefillUsed: false,
      result: "in_progress",
      refillTxHash: null,
      refillToken: null,
      xpEarned: 0,
      completedAt: null,
      durationMs: null,
      startedAt: new Date(),
    },
  });
}

/** Re-roll questions for an in-progress attempt (same day, new set). */
export async function rerollAttemptQuestions(
  attempt: DailyAttempt,
  user: { id: string; xpTotal: number }
): Promise<DailyAttempt> {
  const ids = await buildDailyQuestionIds({
    userId: user.id,
    xpTotal: user.xpTotal,
    dateKey: attempt.date ?? todayKey(),
    excludeTodayAttempt: true,
  });

  return prisma.dailyAttempt.update({
    where: { id: attempt.id },
    data: {
      questionIds: JSON.stringify(ids),
      answers: "[]",
      livesLeft: LIVES_PER_DAY,
      lifeRefillUsed: false,
      result: "in_progress",
      xpEarned: 0,
      completedAt: null,
      durationMs: null,
      startedAt: new Date(),
    },
  });
}
