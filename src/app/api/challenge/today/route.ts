import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import {
  LIVES_PER_DAY,
  pickDailyQuestions,
  todayKey,
  weekKey,
  type AnswerRecord,
} from "@/lib/game";
import { safeSeasonSync } from "@/lib/seasons";
import {
  getAttemptElapsedMs,
  pauseAttemptElapsedMs,
  resumeAttemptTimerSegment,
} from "@/lib/challenge-timer";
import { getAvailableRecoveryTokens } from "@/lib/tokens/recovery";
import {
  getRecoveryPricingMetaAsync,
  formatRecoveryPriceFromAtomic,
  getRecoveryPriceAtomicAsync,
} from "@/lib/pricing/recovery-price";
import { readRecoveryPriceForTokenId } from "@/lib/contracts/recovery-payment";
import { maybeResetCompletedAttempt } from "@/lib/challenge-retry";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await safeSeasonSync(user.id);

  const locale = req.nextUrl.searchParams.get("locale") === "en" ? "en" : "es";
  const date = todayKey();
  const wKey = weekKey();

  let attempt = await prisma.dailyAttempt.findUnique({
    where: { userId_date: { userId: user.id, date } },
  });

  if (!attempt) {
    const all = await prisma.question.findMany({
      select: { id: true },
      orderBy: { id: "asc" },
    });
    const ids = pickDailyQuestions(
      all.map((q) => q.id),
      user.id,
      date
    );
    attempt = await prisma.dailyAttempt.create({
      data: {
        userId: user.id,
        date,
        weekKey: wKey,
        questionIds: JSON.stringify(ids),
        livesLeft: LIVES_PER_DAY,
      },
    });
  }

  attempt = await maybeResetCompletedAttempt(attempt);

  if (
    attempt.result === "in_progress" &&
    !attempt.completedAt
  ) {
    const segment = resumeAttemptTimerSegment(attempt);
    attempt = await prisma.dailyAttempt.update({
      where: { id: attempt.id },
      data: {
        startedAt: segment.startedAt,
        durationMs: segment.durationMs,
      },
    });
  }

  const questionIds: string[] = JSON.parse(attempt.questionIds);
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    include: { translations: { where: { locale } } },
  });

  // Preserve daily order; never leak correctIndex to the client.
  const byId = new Map(questions.map((q) => [q.id, q]));
  const payload = questionIds
    .map((id) => byId.get(id))
    .filter((q) => q !== undefined)
    .map((q) => {
      const tr = q.translations[0];
      return {
        id: q.id,
        category: q.category,
        text: tr?.text ?? "",
        options: tr ? (JSON.parse(tr.options) as string[]) : [],
      };
    });

  const answers: AnswerRecord[] = JSON.parse(attempt.answers);

  const awaitingRefill =
    attempt.result === "awaiting_refill" && !attempt.completedAt;
  const canRefill =
    awaitingRefill && !attempt.lifeRefillUsed;

  const pricing = await getRecoveryPricingMetaAsync();
  const recoveryTokens = getAvailableRecoveryTokens();
  const tokens = await Promise.all(
    recoveryTokens.map(async (t) => {
      const atomic =
        t.address != null
          ? await readRecoveryPriceForTokenId(t.id, t.address)
          : await getRecoveryPriceAtomicAsync(t.id);
      return {
        id: t.id,
        symbol: t.symbol,
        priceDisplay: formatRecoveryPriceFromAtomic(t.id, atomic),
      };
    })
  );

  return NextResponse.json({
    date,
    questions: payload,
    progress: {
      answers,
      livesLeft: attempt.livesLeft,
      xpEarned: attempt.xpEarned,
      completed: !!attempt.completedAt,
      result: attempt.result,
      awaitingRefill,
      canRefill,
      lifeRefillUsed: attempt.lifeRefillUsed,
      startedAt: attempt.startedAt,
      activeDurationMs: attempt.durationMs ?? 0,
      elapsedMs: getAttemptElapsedMs(attempt),
      timerPaused: awaitingRefill,
    },
    recovery: {
      ...pricing,
      maxRefillsPerDay: 1,
      tokens,
    },
  });
}
