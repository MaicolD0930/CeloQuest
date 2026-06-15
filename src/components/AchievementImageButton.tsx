"use client";

import { useState } from "react";
import Image from "next/image";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { AchievementBadgeModal } from "@/components/AchievementBadgeModal";

type AchievementImageButtonProps = {
  image: string | null;
  emoji: string;
  title: string;
  description?: string;
  size?: "sm" | "md";
  className?: string;
};

const sizeClasses = {
  sm: "size-12 text-2xl",
  md: "size-16 text-3xl",
} as const;

export function AchievementImageButton({
  image,
  emoji,
  title,
  description,
  size = "md",
  className = "",
}: AchievementImageButtonProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const box = sizeClasses[size];

  if (!image) {
    return (
      <span
        className={`grid shrink-0 place-items-center rounded-xl bg-h-background ring-1 ring-h-border ${box} ${className}`}
      >
        {emoji}
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        aria-label={title}
        onClick={() => setOpen(true)}
        className={`relative shrink-0 overflow-hidden rounded-xl bg-h-background ring-1 ring-h-border transition-transform hover:scale-[1.03] active:scale-[0.98] ${box} ${className}`}
      >
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
          unoptimized
        />
      </button>

      {open && (
        <AchievementBadgeModal
          src={image}
          alt={title}
          title={title}
          description={description}
          closeLabel={t.achievements.modalClose}
          dragHint={t.achievements.modalDragHint}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
