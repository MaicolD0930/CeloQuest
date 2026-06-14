export const QUESTIONS_PER_DAY = 5;
export const LIVES_PER_DAY = 1;
export const MAX_LIFE_REFILLS_PER_DAY = 1;
export const XP_PER_CORRECT = 2;
export const MAX_DAILY_XP = 10;

/** Base life recovery price: $0.10 USD (see pricing/recovery-price.ts). */
export const RECOVERY_PRICE_USD_CENTS = 10;

// Level thresholds by total XP. Extensible: add more entries.
export const LEVELS: { level: number; minXp: number }[] = [
  { level: 1, minXp: 0 },
  { level: 2, minXp: 50 },
  { level: 3, minXp: 150 },
];

export function computeLevel(xpTotal: number): {
  level: number;
  nextLevelXp: number | null;
  progress: number;
} {
  let current = LEVELS[0];
  for (const l of LEVELS) {
    if (xpTotal >= l.minXp) current = l;
  }
  const next = LEVELS.find((l) => l.minXp > xpTotal) ?? null;
  const base = current.minXp;
  const progress = next
    ? Math.min(1, (xpTotal - base) / (next.minXp - base))
    : 1;
  return { level: current.level, nextLevelXp: next?.minXp ?? null, progress };
}

/** YYYY-MM-DD in UTC, used as the daily challenge key. */
export function todayKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function yesterdayKey(date: Date = new Date()): string {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() - 1);
  return todayKey(d);
}

/** Start of the current ISO week (Monday 00:00 UTC). */
export function weekStart(date: Date = new Date()): Date {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const day = d.getUTCDay(); // 0 = Sunday
  const diff = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  return d;
}

/** Week key: Monday date as YYYY-MM-DD (UTC). */
export function weekKey(date: Date = new Date()): string {
  return weekStart(date).toISOString().slice(0, 10);
}

/** End of the current ISO week (Sunday 23:59:59.999 UTC). */
export function weekEnd(date: Date = new Date()): Date {
  const start = weekStart(date);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

/** Previous Monday week key (UTC). */
export function previousWeekKey(date: Date = new Date()): string {
  const start = weekStart(date);
  start.setUTCDate(start.getUTCDate() - 7);
  return start.toISOString().slice(0, 10);
}

export type AttemptResult = "in_progress" | "awaiting_refill" | "completed" | "out_of_lives";

/** UTC midnight of the next day (next daily reset). */
export function nextDailyReset(date: Date = new Date()): Date {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1)
  );
  return d;
}

/** Simple deterministic hash for seeding. */
function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mulberry32 seeded PRNG. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministically pick `count` question ids for a user+date. */
export function pickDailyQuestions(
  allIds: string[],
  userId: string,
  dateKey: string,
  count: number = QUESTIONS_PER_DAY
): string[] {
  const rng = mulberry32(hashString(`${dateKey}:${userId}`));
  const shuffled = [...allIds];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

export type AnswerRecord = {
  questionId: string;
  answerIndex: number;
  correct: boolean;
};
