import { prisma } from "@/lib/prisma";
import {
  ACHIEVEMENT_CATALOG,
  competitiveTypeForRank,
  getAchievementDef,
  localizedAchievement,
  type AchievementType,
} from "@/lib/achievements/catalog";
import type { Locale } from "@/lib/i18n/dictionaries";
import {
  markAchievementClaimed,
  markAchievementFailed,
  mintAchievementNft,
} from "@/lib/nft/mint-achievement";

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
      status: def.claimMode === "badge" ? "claimed" : "pending",
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

export async function claimPersonalAchievement(
  userId: string,
  walletAddress: string,
  type: AchievementType
) {
  const def = getAchievementDef(type);
  if (!def || def.claimMode !== "manual" || !def.tokenId) {
    return { ok: false as const, reason: "NOT_CLAIMABLE" };
  }

  const achievement = await prisma.achievement.findFirst({
    where: { userId, type, seasonId: null },
  });

  if (!achievement) {
    return { ok: false as const, reason: "NOT_UNLOCKED" };
  }
  if (achievement.status === "claimed") {
    return { ok: false as const, reason: "ALREADY_CLAIMED" };
  }

  if (achievement.status === "failed") {
    await prisma.achievement.update({
      where: { id: achievement.id },
      data: { status: "pending" },
    });
  }

  const eligible = await validateAchievementEligibility(userId, type);
  if (!eligible) {
    return { ok: false as const, reason: "NOT_ELIGIBLE" };
  }

  const mint = await mintAchievementNft({
    walletAddress,
    type,
    competitive: false,
  });

  if (!mint.ok) {
    await markAchievementFailed(achievement.id);
    return { ok: false as const, reason: mint.reason };
  }

  await markAchievementClaimed(achievement.id, mint.txHash, mint.tokenId);

  return {
    ok: true as const,
    txHash: mint.txHash,
    tokenId: mint.tokenId,
    achievementId: achievement.id,
  };
}

export async function distributeCompetitiveNfts(seasonId: string) {
  const entries = await prisma.weeklySeasonEntry.findMany({
    where: { seasonId, rank: { lte: 3 } },
    orderBy: { rank: "asc" },
  });

  const results: Array<{ rank: number; ok: boolean; reason?: string }> = [];

  for (const entry of entries) {
    const type = competitiveTypeForRank(entry.rank);
    if (!type) continue;

    const achievement = await prisma.achievement.findFirst({
      where: { userId: entry.userId, type, seasonId },
    });

    if (!achievement) continue;
    if (achievement.status === "claimed") {
      results.push({ rank: entry.rank, ok: true });
      continue;
    }

    const mint = await mintAchievementNft({
      walletAddress: entry.walletAddress,
      type,
      competitive: true,
    });

    if (!mint.ok) {
      await markAchievementFailed(achievement.id);
      await prisma.rewardDistribution.updateMany({
        where: {
          seasonId,
          userId: entry.userId,
          rewardType: "nft",
          rank: entry.rank,
        },
        data: { status: "failed" },
      });
      results.push({ rank: entry.rank, ok: false, reason: mint.reason });
      continue;
    }

    await markAchievementClaimed(achievement.id, mint.txHash, mint.tokenId);
    await prisma.rewardDistribution.updateMany({
      where: {
        seasonId,
        userId: entry.userId,
        rewardType: "nft",
        rank: entry.rank,
      },
      data: {
        status: "paid",
        txHash: mint.txHash.toLowerCase(),
      },
    });

    results.push({ rank: entry.rank, ok: true });
  }

  return results;
}

/** Validate user still meets unlock condition before claim. */
export async function validateAchievementEligibility(
  userId: string,
  type: AchievementType
): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return false;

  switch (type) {
    case "first_wallet":
      return true;
    case "first_challenge": {
      const count = await prisma.dailyAttempt.count({
        where: { userId, completedAt: { not: null }, result: "completed" },
      });
      return count > 0;
    }
    case "streak_3":
      return user.streak >= 3;
    case "streak_7":
      return user.streak >= 7;
    case "tier_celo_explorer": {
      const { computeLearningLevel } = await import("@/lib/questions/levels");
      return computeLearningLevel(user.xpTotal).level >= 3;
    }
    default:
      return false;
  }
}

export { ACHIEVEMENT_CATALOG, getAchievementDef };
