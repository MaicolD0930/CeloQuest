import { prisma } from "@/lib/prisma";
import {
  ACHIEVEMENT_CATALOG,
  getAchievementDef,
  localizedAchievement,
  type AchievementType,
} from "@/lib/achievements/catalog";
import type { Locale } from "@/lib/i18n/dictionaries";

const DEFAULT_LOCALE: Locale = "es";

export async function unlockAchievement(
  userId: string,
  type: AchievementType,
  options?: { seasonId?: string; locale?: Locale }
) {
  const def = getAchievementDef(type);
  if (!def) return null;

  const locale = options?.locale ?? DEFAULT_LOCALE;
  const { title, description } = localizedAchievement(def, locale);

  const where =
    options?.seasonId != null
      ? { userId, type, seasonId: options.seasonId }
      : { userId, type, seasonId: null };

  const existing = await prisma.achievement.findFirst({ where });
  if (existing) return existing;

  return prisma.achievement.create({
    data: {
      userId,
      seasonId: options?.seasonId ?? null,
      type,
      title,
      description,
      emoji: def.emoji,
      status: "claimed",
      mintedAt: new Date(),
    },
  });
}

export async function maybeAwardFirstWallet(userId: string, locale?: Locale) {
  return unlockAchievement(userId, "first_wallet", { locale });
}

export async function maybeAwardFirstCeloLearning(
  userId: string,
  locale?: Locale
) {
  return unlockAchievement(userId, "first_celo_learning", { locale });
}

export async function maybeAwardMilestoneAchievements(
  userId: string,
  xpTotal: number,
  locale?: Locale
) {
  const { computeLearningLevel } = await import("@/lib/questions/levels");
  const level = computeLearningLevel(xpTotal).level;

  if (level >= 2) {
    await unlockAchievement(userId, "tier_blockchain_user", { locale });
  }
  if (level >= 3) {
    await unlockAchievement(userId, "tier_celo_explorer", { locale });
  }
}

export async function maybeAwardLearningAchievements(
  userId: string,
  ctx: { isFirstChallenge: boolean; streak: number },
  locale?: Locale
) {
  if (ctx.isFirstChallenge) {
    await unlockAchievement(userId, "first_challenge", { locale });
  }
  if (ctx.streak >= 3) {
    await unlockAchievement(userId, "streak_3", { locale });
  }
  if (ctx.streak >= 7) {
    await unlockAchievement(userId, "streak_7", { locale });
  }
}

/** Normalize legacy rows that were left as pending before in-app-only achievements. */
export async function normalizeLegacyAchievementStatuses(userId: string) {
  await prisma.achievement.updateMany({
    where: { userId, status: { in: ["pending", "failed"] } },
    data: { status: "claimed", mintedAt: new Date() },
  });
}

export { ACHIEVEMENT_CATALOG, getAchievementDef };
