import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import {
  MAX_DAILY_XP,
  XP_PER_CORRECT,
  todayKey,
  type AnswerRecord,
} from "@/lib/game";
import { safeSeasonSync } from "@/lib/seasons";
import { finalizeDailyAttempt } from "@/lib/attempts";
import {
  pauseAttemptElapsedMs,
  repairInflatedDurationMs,
} from "@/lib/challenge-timer";
import { allowDailyChallengeRetry } from "@/lib/dev-flags";
import { maybeResetCompletedAttempt } from "@/lib/challenge-retry";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await safeSeasonSync(user.id);

  const body = await req.json().catch(() => null);
  const questionId = typeof body?.questionId === "string" ? body.questionId : null;
  const answerIndex = Number.isInteger(body?.answerIndex) ? (body.answerIndex as number) : null;
  const locale = body?.locale === "en" ? "en" : "es";

  if (!questionId || answerIndex === null) {
    return NextResponse.json({ error: "questionId and answerIndex required" }, { status: 400 });
  }

  const date = todayKey();
  let attempt = await prisma.dailyAttempt.findUnique({
    where: { userId_date: { userId: user.id, date } },
  });

  if (!attempt) {
    return NextResponse.json({ error: "Challenge not started" }, { status: 404 });
  }
  if (attempt.completedAt) {
    if (!allowDailyChallengeRetry()) {
      return NextResponse.json({ error: "Challenge already completed" }, { status: 409 });
    }
    attempt = await maybeResetCompletedAttempt(attempt, user);
  }
  if (attempt.livesLeft <= 0 && attempt.result === "awaiting_refill") {
    return NextResponse.json({ error: "Awaiting life refill" }, { status: 409 });
  }

  const questionIds: string[] = JSON.parse(attempt.questionIds);
  const answers: AnswerRecord[] = JSON.parse(attempt.answers);

  if (!questionIds.includes(questionId)) {
    return NextResponse.json({ error: "Question not in today's challenge" }, { status: 400 });
  }
  if (answers.some((a) => a.questionId === questionId)) {
    return NextResponse.json({ error: "Question already answered" }, { status: 409 });
  }

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { translations: { where: { locale } } },
  });
  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const correct = question.correctIndex === answerIndex;
  const xpGain = correct
    ? Math.min(XP_PER_CORRECT, MAX_DAILY_XP - attempt.xpEarned)
    : 0;
  const livesLeft = correct ? attempt.livesLeft : attempt.livesLeft - 1;

  if (correct && question.category === "celo") {
    const { maybeAwardFirstCeloLearning } = await import("@/lib/achievements");
    await maybeAwardFirstCeloLearning(user.id, locale);
  }

  const answersBefore = answers.length;
  answers.push({ questionId, answerIndex, correct });

  const timerAttempt = {
    ...attempt,
    durationMs: repairInflatedDurationMs(
      attempt.durationMs,
      attempt.result,
      answersBefore,
      !!attempt.completedAt
    ),
  };

  const allAnswered = answers.length >= questionIds.length;
  const lostLastLife = livesLeft <= 0 && !allAnswered;
  const canRefill = lostLastLife && !attempt.lifeRefillUsed;

  let result = attempt.result;

  if (allAnswered) {
    result = "completed";
  } else if (lostLastLife && canRefill) {
    result = "awaiting_refill";
  } else if (lostLastLife) {
    result = "out_of_lives";
  }

  const shouldFinalize =
    result === "completed" || result === "out_of_lives";

  const updateData: {
    answers: string;
    livesLeft: number;
    xpEarned: number;
    result: string;
    completedAt?: null;
    durationMs?: number;
    startedAt?: Date;
  } = {
    answers: JSON.stringify(answers),
    livesLeft,
    xpEarned: attempt.xpEarned + xpGain,
    result,
  };

  if (!shouldFinalize) {
    updateData.completedAt = null;
    updateData.durationMs = pauseAttemptElapsedMs(timerAttempt);
    if (result !== "awaiting_refill") {
      updateData.startedAt = new Date();
    }
  } else {
    updateData.durationMs = pauseAttemptElapsedMs(timerAttempt);
  }

  const updatedAttempt = await prisma.dailyAttempt.update({
    where: { id: attempt.id },
    data: updateData,
  });

  let summary = null;
  let streak = user.streak;

  if (shouldFinalize) {
    const finalized = await finalizeDailyAttempt(
      updatedAttempt,
      user,
      result as "completed" | "out_of_lives"
    );
    streak = finalized.streak;
    summary = {
      xpEarned: finalized.attempt.xpEarned,
      correctCount: finalized.correctCount,
      totalAnswered: finalized.totalAnswered,
      totalQuestions: questionIds.length,
      streak,
      durationMs: finalized.durationMs,
      outOfLives: result === "out_of_lives",
    };
  }

  const tr = question.translations[0];

  return NextResponse.json({
    correct,
    correctIndex: question.correctIndex,
    explanation: tr?.explanation ?? "",
    livesLeft,
    xpEarned: updatedAttempt.xpEarned,
    completed: shouldFinalize,
    awaitingRefill: result === "awaiting_refill",
    canRefill: result === "awaiting_refill",
    activeDurationMs: updatedAttempt.durationMs ?? 0,
    timerPaused: result === "awaiting_refill" || shouldFinalize,
    startedAt: updatedAttempt.startedAt,
    summary,
  });
}
