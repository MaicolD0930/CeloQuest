import { prisma } from "@/lib/prisma";
import { computeLevel } from "@/lib/game";

const MILESTONES = [
  {
    type: "celo_explorer",
    minLevel: 2,
    emoji: "🌍",
    title: "Celo Explorer",
    description: "Alcanzaste el nivel Celo User",
  },
  {
    type: "stablecoin_master",
    minLevel: 3,
    emoji: "💵",
    title: "Stablecoin Master",
    description: "Alcanzaste el nivel Web3 Citizen",
  },
] as const;

export function getParticipationNftDef(weekNumber: number) {
  if (weekNumber >= 10) {
    return {
      type: "celoquest_veteran",
      emoji: "🎖️",
      title: "CeloQuest Veteran",
      description: "10 semanas consecutivas de participación",
    };
  }
  return {
    type: `explorer_week_${weekNumber}`,
    emoji: "🌱",
    title: `CeloQuest Explorer Week ${weekNumber}`,
    description: `Semana ${weekNumber} de participación consecutiva`,
  };
}

export async function maybeAwardMilestoneAchievements(
  userId: string,
  xpTotal: number
) {
  const level = computeLevel(xpTotal).level;

  for (const m of MILESTONES) {
    if (level < m.minLevel) continue;

    const existing = await prisma.achievement.findFirst({
      where: { userId, type: m.type },
    });
    if (existing) continue;

    await prisma.achievement.create({
      data: {
        userId,
        type: m.type,
        title: m.title,
        description: m.description,
        emoji: m.emoji,
      },
    });
  }
}

export async function awardParticipationNft(
  userId: string,
  seasonId: string,
  weekNumber: number
) {
  const def = getParticipationNftDef(weekNumber);
  const existing = await prisma.achievement.findFirst({
    where: { userId, type: def.type, seasonId },
  });
  if (existing) return;

  await prisma.achievement.create({
    data: {
      userId,
      seasonId,
      type: def.type,
      title: def.title,
      description: def.description,
      emoji: def.emoji,
    },
  });
}
