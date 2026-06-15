import { prisma } from "@/lib/prisma";

/** Stable season index (1-based) ordered by start date. */
export async function getSeasonNumberMap(): Promise<Map<string, number>> {
  const seasons = await prisma.weeklySeason.findMany({
    orderBy: [{ startDate: "asc" }, { weekKey: "asc" }],
    select: { id: true },
  });

  const map = new Map<string, number>();
  seasons.forEach((season, index) => {
    map.set(season.id, index + 1);
  });
  return map;
}
