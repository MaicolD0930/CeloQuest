/**
 * One-time backfill: unlock first_wallet + sync personal achievements for existing users.
 * Run: npx tsx scripts/backfill-achievements.ts
 */
import { prisma } from "../src/lib/prisma";
import {
  maybeAwardFirstWallet,
  maybeAwardLearningAchievements,
  maybeAwardMilestoneAchievements,
} from "../src/lib/achievements";

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      locale: true,
      xpTotal: true,
      streak: true,
    },
  });

  let updated = 0;
  for (const user of users) {
    const locale = user.locale === "en" ? "en" : "es";
    await maybeAwardFirstWallet(user.id, locale);

    const completed = await prisma.dailyAttempt.count({
      where: {
        userId: user.id,
        completedAt: { not: null },
        result: "completed",
      },
    });

    await maybeAwardLearningAchievements(user.id, {
      isFirstChallenge: completed > 0,
      streak: user.streak,
    }, locale);

    await maybeAwardMilestoneAchievements(user.id, user.xpTotal, locale);
    updated++;
  }

  console.log(`Backfilled achievements for ${updated} users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
