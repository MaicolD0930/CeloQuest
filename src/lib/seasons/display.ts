import type { Locale } from "@/lib/i18n/dictionaries";

export const COMPETITIVE_ACHIEVEMENT_TYPES = new Set([
  "weekly_champion",
  "weekly_runner_up",
  "weekly_third",
]);

export function isCompetitiveAchievementType(type: string): boolean {
  return COMPETITIVE_ACHIEVEMENT_TYPES.has(type);
}

export type SeasonDates = {
  startDate: Date | string;
  endDate: Date | string;
};

function formatNumericDate(date: Date | string, locale: Locale): string {
  const d = new Date(date);
  const day = d.getUTCDate().toString().padStart(2, "0");
  const month = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const year = d.getUTCFullYear();
  if (locale === "en") {
    return `${month}/${day}/${year}`;
  }
  return `${day}/${month}/${year}`;
}

export function formatSeasonDateRange(
  startDate: Date | string,
  endDate: Date | string,
  locale: Locale
): string {
  return `${formatNumericDate(startDate, locale)} - ${formatNumericDate(endDate, locale)}`;
}

export function formatAchievementSeasonLabel(
  seasonNumber: number,
  season: SeasonDates,
  locale: Locale
): string {
  const range = formatSeasonDateRange(season.startDate, season.endDate, locale);
  return locale === "en"
    ? `Season ${seasonNumber}, ${range}`
    : `Temporada ${seasonNumber}, ${range}`;
}

export function resolveAchievementSeasonLabel(
  type: string,
  season: SeasonDates | null | undefined,
  seasonNumber: number | null | undefined,
  locale: Locale
): string | null {
  if (!isCompetitiveAchievementType(type) || !season || seasonNumber == null) {
    return null;
  }
  return formatAchievementSeasonLabel(seasonNumber, season, locale);
}
