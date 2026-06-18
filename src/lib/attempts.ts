import { prisma } from "@/lib/prisma";
import type { DailyAttempt, User } from "@prisma/client";
import {
  todayKey,
  weekKey,
  yesterdayKey,
  type AnswerRecord,
} from "@/lib/game";
import {
  maybeAwardMilestoneAchievements,
  maybeAwardLearningAchievements,
} from "@/lib/achievements";
import { capAttemptDurationMs, getAttemptElapsedMs } from "@/lib/challenge-timer";
import { addWeeklyDurationMs } from "@/lib/weekly-duration";
import { ensureActiveSeason } from "@/lib/seasons";

/** Finalize a daily attempt and credit XP/streak to the user. */
export async function finalizeDailyAttempt(
  attempt: DailyAttempt,
  user: User,
  result: "completed" | "out_of_lives"
) {
  const answers: AnswerRecord[] = JSON.parse(attempt.answers);

  if (attempt.completedAt) {
    return {
      attempt,
      streak: user.streak,
      correctCount: answers.filter((a) => a.correct).length,
      totalAnswered: answers.length,
      durationMs: capAttemptDurationMs(attempt.durationMs ?? 0),
    };
  }

  const now = new Date();
  const rawDurationMs =
    attempt.durationMs != null &&
    (attempt.result === "awaiting_refill" || result === "out_of_lives" || result === "completed")
      ? attempt.durationMs
      : getAttemptElapsedMs({ ...attempt, now: now.getTime() });
  const durationMs = capAttemptDurationMs(rawDurationMs);
  const lastKey = user.lastPlayedAt ? todayKey(new Date(user.lastPlayedAt)) : null;
  const streak = lastKey === yesterdayKey() ? user.streak + 1 : 1;

  const priorCompleted = await prisma.dailyAttempt.count({
    where: {
      userId: user.id,
      completedAt: { not: null },
      result: "completed",
      id: { not: attempt.id },
    },
  });
  const isFirstCompletedChallenge = priorCompleted === 0 && result === "completed";
  const xpGain = attempt.xpEarned;

  const freshUser = await prisma.user.findUnique({ where: { id: user.id } });
  let wKey = weekKey();
  try {
    const activeSeason = await ensureActiveSeason();
    wKey = activeSeason?.weekKey ?? weekKey();
  } catch (e) {
    console.error("[finalizeDailyAttempt] ensureActiveSeason failed:", e);
  }
  const weeklyXpBase =
    freshUser?.currentWeekKey === wKey ? freshUser.weeklyXp : 0;
  const weeklyDurationBase =
    freshUser?.currentWeekKey === wKey ? freshUser.weeklyDurationMs : 0;
  const weeklyDurationMs = addWeeklyDurationMs(weeklyDurationBase, durationMs);

  const updated = await prisma.dailyAttempt.update({
    where: { id: attempt.id },
    data: {
      completedAt: now,
      durationMs,
      result,
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      xpTotal: user.xpTotal + xpGain,
      weeklyXp: weeklyXpBase + xpGain,
      weeklyDurationMs,
      currentWeekKey: wKey,
      streak,
      lastPlayedAt: now,
    },
  });

  const newXpTotal = user.xpTotal + xpGain;
  await maybeAwardMilestoneAchievements(user.id, newXpTotal);
  await maybeAwardLearningAchievements(user.id, {
    isFirstChallenge: isFirstCompletedChallenge,
    streak,
  });

  return {
    attempt: updated,
    streak,
    correctCount: answers.filter((a) => a.correct).length,
    totalAnswered: answers.length,
    durationMs,
  };
}
