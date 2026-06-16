import type { Locale } from "@/lib/i18n/dictionaries";

export type AchievementStatus = "pending" | "claimed" | "failed";
/** All achievements are in-app personal badges (no on-chain mint). */
export type AchievementClaimMode = "badge";

export type AchievementType =
  | "first_wallet"
  | "first_challenge"
  | "streak_3"
  | "streak_7"
  | "first_celo_learning"
  | "tier_blockchain_user"
  | "tier_celo_explorer"
  | "weekly_champion"
  | "weekly_runner_up"
  | "weekly_third";

export type AchievementDef = {
  type: AchievementType;
  claimMode: AchievementClaimMode;
  emoji: string;
  name: Record<Locale, string>;
  description: Record<Locale, string>;
  image: string;
};

export const ACHIEVEMENT_CATALOG: Record<AchievementType, AchievementDef> = {
  first_wallet: {
    type: "first_wallet",
    claimMode: "badge",
    emoji: "🌱",
    name: { es: "Primera wallet", en: "First Wallet" },
    description: {
      es: "Has creado tu identidad Web3 en CeloQuest",
      en: "You created your Web3 identity on CeloQuest",
    },
    image: "/nft-assets/images/1.png",
  },
  first_challenge: {
    type: "first_challenge",
    claimMode: "badge",
    emoji: "🎯",
    name: { es: "Primer reto", en: "First Challenge" },
    description: {
      es: "Completaste tu primer reto diario",
      en: "You completed your first daily challenge",
    },
    image: "/nft-assets/images/2.png",
  },
  streak_3: {
    type: "streak_3",
    claimMode: "badge",
    emoji: "🔥",
    name: { es: "Racha de 3 días", en: "3 Day Streak" },
    description: {
      es: "Jugaste 3 días seguidos",
      en: "You played 3 days in a row",
    },
    image: "/nft-assets/images/3.png",
  },
  streak_7: {
    type: "streak_7",
    claimMode: "badge",
    emoji: "⚡",
    name: { es: "Racha de 7 días", en: "7 Day Streak" },
    description: {
      es: "Una semana completa de aprendizaje",
      en: "A full week of learning",
    },
    image: "/nft-assets/images/4.png",
  },
  first_celo_learning: {
    type: "first_celo_learning",
    claimMode: "badge",
    emoji: "💛",
    name: { es: "Primer aprendizaje Celo", en: "First Celo Lesson" },
    description: {
      es: "Respondiste correctamente tu primera pregunta sobre Celo",
      en: "You answered your first Celo question correctly",
    },
    image: "/nft-assets/images/first_celo_learning.png",
  },
  tier_blockchain_user: {
    type: "tier_blockchain_user",
    claimMode: "badge",
    emoji: "🔗",
    name: { es: "Usuario Blockchain", en: "Blockchain User" },
    description: {
      es: "Alcanzaste el nivel Usuario Blockchain",
      en: "You reached Blockchain User tier",
    },
    image: "/nft-assets/images/tier_blockchain_user.png",
  },
  tier_celo_explorer: {
    type: "tier_celo_explorer",
    claimMode: "badge",
    emoji: "🟢",
    name: { es: "Celo Explorer", en: "Celo Explorer" },
    description: {
      es: "Alcanzaste el nivel Celo Explorer",
      en: "You reached Celo Explorer tier",
    },
    image: "/nft-assets/images/5.png",
  },
  weekly_champion: {
    type: "weekly_champion",
    claimMode: "badge",
    emoji: "🏆",
    name: { es: "Campeón semanal", en: "Weekly Champion" },
    description: {
      es: "Primer lugar en la temporada semanal",
      en: "First place in the weekly season",
    },
    image: "/nft-assets/images/6.png",
  },
  weekly_runner_up: {
    type: "weekly_runner_up",
    claimMode: "badge",
    emoji: "🥈",
    name: { es: "Subcampeón semanal", en: "Second Place" },
    description: {
      es: "Segundo lugar en la temporada semanal",
      en: "Second place in the weekly season",
    },
    image: "/nft-assets/images/7.png",
  },
  weekly_third: {
    type: "weekly_third",
    claimMode: "badge",
    emoji: "🥉",
    name: { es: "Tercer lugar semanal", en: "Third Place" },
    description: {
      es: "Tercer lugar en la temporada semanal",
      en: "Third place in the weekly season",
    },
    image: "/nft-assets/images/8.png",
  },
};

/** Older DB rows may use pre-catalog type strings. */
const LEGACY_ACHIEVEMENT_ALIASES: Record<string, AchievementType> = {
  celo_user: "tier_celo_explorer",
  tier_celo_user: "tier_celo_explorer",
  blockchain_user: "tier_blockchain_user",
  tier_blockchain: "tier_blockchain_user",
};

export function getAchievementDef(type: string): AchievementDef | null {
  const key = LEGACY_ACHIEVEMENT_ALIASES[type] ?? type;
  return (ACHIEVEMENT_CATALOG as Record<string, AchievementDef>)[key] ?? null;
}

function inferLegacyAchievementType(
  type: string,
  fallback?: { title: string; description: string }
): AchievementType | null {
  if (LEGACY_ACHIEVEMENT_ALIASES[type]) {
    return LEGACY_ACHIEVEMENT_ALIASES[type];
  }

  const title = fallback?.title?.toLowerCase() ?? "";
  const description = fallback?.description?.toLowerCase() ?? "";

  if (
    title.includes("blockchain user") ||
    title.includes("usuario blockchain") ||
    description.includes("usuario blockchain") ||
    description.includes("blockchain user")
  ) {
    return "tier_blockchain_user";
  }

  if (
    description.includes("alcanzaste el nivel") ||
    description.includes("you reached") ||
    (description.includes("reached") && description.includes("tier"))
  ) {
    if (
      description.includes("celo explorer") ||
      description.includes("celo user")
    ) {
      return "tier_celo_explorer";
    }
  }

  return null;
}

function resolveWelcomeAccountBadge(
  locale: Locale,
  fallback?: { emoji?: string }
): AchievementDisplay {
  return {
    title: locale === "en" ? "Celo Explorer" : "Celo Explorer",
    description:
      locale === "en"
        ? "You created your account on CeloQuest"
        : "Creaste tu cuenta en CeloQuest",
    emoji: fallback?.emoji ?? "🌍",
    image: null,
    claimMode: "badge",
  };
}

export function competitiveTypeForRank(
  rank: number
): AchievementType | null {
  if (rank === 1) return "weekly_champion";
  if (rank === 2) return "weekly_runner_up";
  if (rank === 3) return "weekly_third";
  return null;
}

export function localizedAchievement(
  def: AchievementDef,
  locale: Locale
): { title: string; description: string } {
  return {
    title: def.name[locale],
    description: def.description[locale],
  };
}

export type AchievementDisplay = {
  title: string;
  description: string;
  emoji: string;
  image: string | null;
  claimMode: AchievementClaimMode | null;
};

/** Resolve UI copy from catalog + locale (ignores stale DB title/description). */
export function resolveAchievementDisplay(
  type: string,
  locale: Locale,
  fallback?: { title: string; description: string; emoji?: string }
): AchievementDisplay {
  if (type === "celo_explorer") {
    return resolveWelcomeAccountBadge(locale, fallback);
  }

  const def =
    getAchievementDef(type) ??
    (() => {
      const legacy = inferLegacyAchievementType(type, fallback);
      return legacy ? getAchievementDef(legacy) : null;
    })();

  if (def) {
    const { title, description } = localizedAchievement(def, locale);
    return {
      title,
      description,
      emoji: def.emoji,
      image: def.image,
      claimMode: def.claimMode,
    };
  }

  const weekMatch = type.match(/^explorer_week_(\d+)$/);
  if (weekMatch) {
    const n = weekMatch[1];
    return {
      title:
        locale === "en"
          ? `CeloQuest Explorer Week ${n}`
          : `CeloQuest Explorer Semana ${n}`,
      description:
        locale === "en"
          ? `Week ${n} of consecutive participation`
          : `Semana ${n} de participación consecutiva`,
      emoji: "🌱",
      image: null,
      claimMode: "badge",
    };
  }

  if (type === "celoquest_veteran") {
    return {
      title: locale === "en" ? "CeloQuest Veteran" : "Veterano CeloQuest",
      description:
        locale === "en"
          ? "10 consecutive weeks of participation"
          : "10 semanas consecutivas de participación",
      emoji: "🎖️",
      image: null,
      claimMode: "badge",
    };
  }

  return {
    title: fallback?.title ?? type,
    description: fallback?.description ?? "",
    emoji: fallback?.emoji ?? "🏅",
    image: null,
    claimMode: null,
  };
}
