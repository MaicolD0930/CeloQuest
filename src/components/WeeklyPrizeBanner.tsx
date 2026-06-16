"use client";

import Link from "next/link";
import { Coins, Trophy } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { WEEKLY_REWARD_USDC } from "@/lib/contracts/rewards-abi";

type WeeklyPrizeBannerProps = {
  variant?: "featured" | "compact";
  className?: string;
  /** When set, compact variant shows a link (e.g. home → ranking). */
  href?: string;
  linkLabel?: string;
};

export function WeeklyPrizeBanner({
  variant = "featured",
  className = "",
  href,
  linkLabel,
}: WeeklyPrizeBannerProps) {
  const { t } = useLocale();
  const amount = WEEKLY_REWARD_USDC;
  const hint = t.weeklyPrize.hint.replace("{amount}", amount);

  if (variant === "compact") {
    const inner = (
      <div
        className={`flex animate-card-pop items-center gap-3 rounded-2xl border border-lemon/35 bg-gradient-to-r from-lemon/15 via-surface to-prosperity/10 p-3 ring-1 ring-lemon/20 ${href ? "transition-transform active:scale-[0.99]" : ""} ${className}`}
      >
        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-lemon/20 ring-1 ring-lemon/40">
          <Coins className="size-5 text-lemon" />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-lemon">
            {t.weeklyPrize.badge}
          </p>
          <p className="font-display text-base font-extrabold leading-tight text-h-foreground">
            {t.weeklyPrize.title.replace("{amount}", amount)}
          </p>
          <p className="mt-0.5 line-clamp-2 text-[11px] font-medium text-h-muted">
            {hint}
          </p>
        </div>
        {href && linkLabel && (
          <span className="shrink-0 rounded-lg bg-lemon/20 px-2 py-1 text-[10px] font-bold text-lemon">
            {linkLabel}
          </span>
        )}
      </div>
    );

    if (href) {
      return (
        <Link href={href} className="block">
          {inner}
        </Link>
      );
    }
    return inner;
  }

  return (
    <section
      className={`leaderboard-rise relative overflow-hidden rounded-2xl border border-lemon/40 bg-gradient-to-br from-lemon/20 via-surface to-prosperity/15 p-4 shadow-[0_0_32px_oklch(0.78_0.16_85/0.15)] ${className}`}
      style={{ animationDelay: "40ms" }}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-lemon/20 blur-2xl"
        aria-hidden
      />
      <div className="relative flex items-start gap-3">
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-lemon/25 ring-2 ring-lemon/50">
          <Trophy className="size-6 text-lemon" fill="currentColor" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-lemon">
            {t.weeklyPrize.badge}
          </p>
          <p className="mt-0.5 font-display text-2xl font-black tracking-tight text-h-foreground">
            {t.weeklyPrize.title.replace("{amount}", amount)}
          </p>
          <p className="mt-1.5 text-sm font-medium leading-snug text-h-muted">
            {hint}
          </p>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-h-background/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-prosperity ring-1 ring-prosperity/30">
            <Coins className="size-3" />
            {t.weeklyPrize.onChain}
          </p>
        </div>
      </div>
    </section>
  );
}
