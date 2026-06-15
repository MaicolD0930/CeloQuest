import { QUESTIONS_PER_DAY } from "@/lib/game";
import { DIFFICULTY_WEIGHTS } from "@/lib/questions/levels";

export type QuestionPoolItem = {
  id: string;
  difficulty: number;
};

const RECENT_ATTEMPTS_LOOKBACK = 14;

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

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffleInPlace<T>(arr: T[], rng: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function pickDifficultyForSlot(
  userLevel: number,
  rng: () => number
): 1 | 2 | 3 {
  const weights = DIFFICULTY_WEIGHTS[userLevel] ?? DIFFICULTY_WEIGHTS[1];
  const roll = rng();
  let acc = weights[1];
  if (roll < acc) return 1;
  acc += weights[2];
  if (roll < acc) return 2;
  return 3;
}

function groupByDifficulty(pool: QuestionPoolItem[]) {
  const groups: Record<1 | 2 | 3, QuestionPoolItem[]> = {
    1: [],
    2: [],
    3: [],
  };
  for (const q of pool) {
    const d = Math.min(3, Math.max(1, q.difficulty)) as 1 | 2 | 3;
    groups[d].push(q);
  }
  return groups;
}

export function collectRecentQuestionIds(
  attempts: { questionIds: string }[],
  lookback = RECENT_ATTEMPTS_LOOKBACK
): Set<string> {
  const recent = new Set<string>();
  for (const attempt of attempts.slice(0, lookback)) {
    try {
      const ids = JSON.parse(attempt.questionIds) as string[];
      for (const id of ids) recent.add(id);
    } catch {
      /* ignore malformed */
    }
  }
  return recent;
}

/**
 * Pick daily questions with weighted difficulty and anti-repetition.
 * Falls back to recently seen questions if the pool is too small.
 */
export function pickAdaptiveQuestions(params: {
  pool: QuestionPoolItem[];
  userId: string;
  dateKey: string;
  userLevel: number;
  excludeIds?: Set<string>;
  count?: number;
}): string[] {
  const {
    pool,
    userId,
    dateKey,
    userLevel,
    excludeIds = new Set(),
    count = QUESTIONS_PER_DAY,
  } = params;

  if (pool.length === 0) return [];
  if (pool.length <= count) {
    const rng = mulberry32(hashString(`${dateKey}:${userId}:all`));
    const shuffled = [...pool];
    shuffleInPlace(shuffled, rng);
    return shuffled.slice(0, count).map((q) => q.id);
  }

  const rng = mulberry32(hashString(`${dateKey}:${userId}:${userLevel}`));
  const freshPool = pool.filter((q) => !excludeIds.has(q.id));
  const workingPool = freshPool.length >= count ? freshPool : pool;
  const groups = groupByDifficulty(workingPool);

  const picked: QuestionPoolItem[] = [];
  const used = new Set<string>();

  for (let slot = 0; slot < count; slot++) {
    let difficulty = pickDifficultyForSlot(userLevel, rng);
    let candidates = groups[difficulty].filter((q) => !used.has(q.id));

    if (candidates.length === 0) {
      for (const fallback of [1, 2, 3] as const) {
        candidates = groups[fallback].filter((q) => !used.has(q.id));
        if (candidates.length > 0) {
          difficulty = fallback;
          break;
        }
      }
    }

    if (candidates.length === 0) break;

    shuffleInPlace(candidates, rng);
    const choice = candidates[0];
    picked.push(choice);
    used.add(choice.id);
  }

  if (picked.length < count) {
    const remainder = workingPool.filter((q) => !used.has(q.id));
    shuffleInPlace(remainder, rng);
    for (const q of remainder) {
      if (picked.length >= count) break;
      picked.push(q);
      used.add(q.id);
    }
  }

  return picked.map((q) => q.id);
}
