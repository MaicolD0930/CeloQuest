export const QUESTION_CATEGORIES = [
  "blockchain",
  "wallets",
  "celo",
  "minipay",
  "stablecoins",
  "security",
] as const;

export type QuestionCategory = (typeof QUESTION_CATEGORIES)[number];

export const CATEGORY_META: Record<
  QuestionCategory,
  { emoji: string; color: string }
> = {
  blockchain: { emoji: "🧱", color: "bg-sky-500/15 text-sky-700" },
  wallets: { emoji: "👛", color: "bg-violet-500/15 text-violet-700" },
  celo: { emoji: "💛", color: "bg-amber-500/15 text-amber-800" },
  minipay: { emoji: "📱", color: "bg-emerald-500/15 text-emerald-700" },
  stablecoins: { emoji: "💵", color: "bg-teal-500/15 text-teal-700" },
  security: { emoji: "🛡️", color: "bg-rose-500/15 text-rose-700" },
};

export function isQuestionCategory(value: string): value is QuestionCategory {
  return (QUESTION_CATEGORIES as readonly string[]).includes(value);
}
