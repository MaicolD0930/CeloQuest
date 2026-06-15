"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import {
  CATEGORY_META,
  isQuestionCategory,
  type QuestionCategory,
} from "@/lib/questions/categories";

type Props = {
  category: string;
  className?: string;
};

export function CategoryBadge({ category, className = "" }: Props) {
  const { t } = useLocale();
  const cat = isQuestionCategory(category) ? category : null;
  const meta = cat ? CATEGORY_META[cat] : null;
  const label = cat
    ? t.categories[cat]
    : category;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
        meta?.color ?? "bg-h-background text-h-muted"
      } ${className}`}
    >
      {meta?.emoji && <span aria-hidden>{meta.emoji}</span>}
      {label}
    </span>
  );
}

export function categoryLabel(
  category: string,
  labels: Record<QuestionCategory, string>
): string {
  return isQuestionCategory(category) ? labels[category] : category;
}
