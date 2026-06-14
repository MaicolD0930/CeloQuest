/**
 * Dev helper: reset today's daily challenges so testers can replay.
 * Reverts XP/duration credited from completed attempts today, then deletes attempts.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function weekKey(d = new Date()) {
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diff)
  );
  return monday.toISOString().slice(0, 10);
}

async function main() {
  const date = todayKey();
  const wKey = weekKey();

  const attempts = await prisma.dailyAttempt.findMany({
    where: { date },
    include: { user: true },
  });

  for (const attempt of attempts) {
    if (!attempt.completedAt) continue;

    const u = attempt.user;
    await prisma.user.update({
      where: { id: u.id },
      data: {
        xpTotal: Math.max(0, u.xpTotal - attempt.xpEarned),
        weeklyXp:
          u.currentWeekKey === wKey
            ? Math.max(0, u.weeklyXp - attempt.xpEarned)
            : u.weeklyXp,
        weeklyDurationMs:
          u.currentWeekKey === wKey && attempt.durationMs
            ? Math.max(0, u.weeklyDurationMs - attempt.durationMs)
            : u.weeklyDurationMs,
        lastPlayedAt: null,
        streak: Math.max(0, u.streak - 1),
      },
    });
  }

  const { count } = await prisma.dailyAttempt.deleteMany({ where: { date } });
  console.log(`✅ Reset ${count} daily attempt(s) for ${date}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
