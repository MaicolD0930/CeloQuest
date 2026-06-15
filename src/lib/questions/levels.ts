import type { Locale } from "@/lib/i18n/dictionaries";

/** Learning tiers aligned with question difficulty (1–3). */
export const LEARNING_TIERS = [
  {
    level: 1,
    minXp: 0,
    emoji: "🌱",
    difficultyFocus: 1,
  },
  {
    level: 2,
    minXp: 150,
    emoji: "🔗",
    difficultyFocus: 2,
  },
  {
    level: 3,
    minXp: 500,
    emoji: "🟢",
    difficultyFocus: 3,
  },
] as const;

export type LearningTier = (typeof LEARNING_TIERS)[number];

const TIER_NAMES: Record<Locale, Record<number, string>> = {
  es: {
    1: "Explorador Web3",
    2: "Usuario Blockchain",
    3: "Celo Explorer",
  },
  en: {
    1: "Web3 Explorer",
    2: "Blockchain User",
    3: "Celo Explorer",
  },
};

/** Difficulty weights when picking questions for each learning tier. */
export const DIFFICULTY_WEIGHTS: Record<
  number,
  Record<1 | 2 | 3, number>
> = {
  1: { 1: 0.8, 2: 0.2, 3: 0 },
  2: { 1: 0.5, 2: 0.35, 3: 0.15 },
  3: { 1: 0.3, 2: 0.4, 3: 0.3 },
};

export type LearningLevelInfo = {
  level: number;
  emoji: string;
  name: string;
  minXp: number;
  nextLevelXp: number | null;
  progress: number;
  xpInTier: number;
  xpNeededForNext: number | null;
};

export function getTierName(level: number, locale: Locale): string {
  return TIER_NAMES[locale][level] ?? TIER_NAMES[locale][1];
}

export function computeLearningLevel(
  xpTotal: number,
  locale: Locale = "es"
): LearningLevelInfo {
  let current: LearningTier = LEARNING_TIERS[0];
  for (const tier of LEARNING_TIERS) {
    if (xpTotal >= tier.minXp) current = tier;
  }

  const next = LEARNING_TIERS.find((t) => t.minXp > xpTotal) ?? null;
  const base = current.minXp;
  const progress = next
    ? Math.min(1, (xpTotal - base) / (next.minXp - base))
    : 1;

  return {
    level: current.level,
    emoji: current.emoji,
    name: getTierName(current.level, locale),
    minXp: current.minXp,
    nextLevelXp: next?.minXp ?? null,
    progress,
    xpInTier: xpTotal - base,
    xpNeededForNext: next ? next.minXp - xpTotal : null,
  };
}

export function getNextTierName(
  currentLevel: number,
  locale: Locale
): string | null {
  const next = LEARNING_TIERS.find((t) => t.level === currentLevel + 1);
  return next ? getTierName(next.level, locale) : null;
}
