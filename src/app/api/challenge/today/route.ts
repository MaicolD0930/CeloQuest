import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import {
  LIVES_PER_DAY,
  todayKey,
  weekKey,
  type AnswerRecord,
} from "@/lib/game";
import { buildDailyQuestionIds } from "@/lib/questions/daily";
import { safeSeasonSync } from "@/lib/seasons";
import {
  getAttemptElapsedMs,
  resumeAttemptTimerSegment,
} from "@/lib/challenge-timer";
import { maybeResetCompletedAttempt, repairDailyAttempt } from "@/lib/challenge-retry";

export async function GET(req: NextRequest) {
  try {
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
      const ids = await buildDailyQuestionIds({
        userId: user.id,
        xpTotal: user.xpTotal,
        dateKey: date,
      });
      attempt = await prisma.dailyAttempt.create({
        data: {
          userId: user.id,
          date,
          weekKey: wKey,
          questionIds: JSON.stringify(ids),
          seenQuestionIds: JSON.stringify(ids),
          livesLeft: LIVES_PER_DAY,
        },
      });
    }

    attempt = await maybeResetCompletedAttempt(attempt, user);
    attempt = await repairDailyAttempt(attempt, user);

    if (attempt.result === "in_progress" && !attempt.completedAt) {
      const segment = resumeAttemptTimerSegment(attempt);
      attempt = {
        ...attempt,
        startedAt: segment.startedAt,
        durationMs: segment.durationMs,
      };
      void prisma.dailyAttempt
        .update({
          where: { id: attempt.id },
          data: {
            startedAt: segment.startedAt,
            durationMs: segment.durationMs,
          },
        })
        .catch((err) => console.error("[challenge/today] timer persist:", err));
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
          difficulty: q.difficulty,
          text: tr?.text ?? "",
          options: tr ? (JSON.parse(tr.options) as string[]) : [],
        };
      });

    const answers: AnswerRecord[] = JSON.parse(attempt.answers);

    const awaitingRefill =
      attempt.result === "awaiting_refill" && !attempt.completedAt;
    const canRefill =
      awaitingRefill && !attempt.lifeRefillUsed;

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
    });
  } catch (error) {
    console.error("[challenge/today] GET failed:", error);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
