"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Star,
  Trophy,
} from "lucide-react";

type Props = {
  title: string;
  subtitle: string;
  xp: number;
  xpBadgeLabel: string;
  rankingLabel: string;
  homeLabel?: string;
  playTabLabel?: string;
  /** embedded = compact · embedded-fill = fills /home · full = /challenge */
  layout?: "full" | "embedded" | "embedded-fill";
  backHref?: string;
  className?: string;
};

function SuccessCheckIcon({ size }: { size: "sm" | "md" | "lg" }) {
  const box =
    size === "sm" ? "size-[4.5rem]" : size === "md" ? "size-24" : "size-28";
  const insetMid =
    size === "sm" ? "inset-[7px]" : size === "md" ? "inset-[9px]" : "inset-[10px]";
  const insetCore =
    size === "sm" ? "inset-[15px]" : size === "md" ? "inset-[18px]" : "inset-[22px]";
  const checkSize =
    size === "sm" ? "size-6" : size === "md" ? "size-8" : "size-9";

  return (
    <div className={`relative mx-auto grid ${box} place-items-center`}>
      <div className="relative size-full">
        <div className="absolute inset-0 animate-check-ripple rounded-full ring-2 ring-prosperity/35" />
        <div
          className={`absolute ${insetMid} animate-check-ripple-delayed rounded-full ring-2 ring-prosperity/55 bg-surface/80`}
        />
        <div
          className={`absolute ${insetCore} grid animate-check-glow place-items-center rounded-full bg-prosperity`}
        >
          <Check className={`${checkSize} text-h-background stroke-[3]`} />
        </div>
      </div>
    </div>
  );
}

export function ChallengeCompletedCard({
  title,
  subtitle,
  xp,
  xpBadgeLabel,
  rankingLabel,
  homeLabel,
  playTabLabel = "JUGAR",
  layout = "embedded",
  backHref = "/home",
  className = "",
}: Props) {
  const isFull = layout === "full";
  const isFill = layout === "embedded-fill";
  const isCompact = layout === "embedded";

  const iconSize: "sm" | "md" | "lg" = isCompact ? "sm" : isFill ? "md" : "lg";

  const body = (
    <>
      {isFull && (
        <div className="mb-6 flex justify-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-prosperity">
            {playTabLabel}
          </span>
        </div>
      )}

      <div
        className={
          isFill
            ? "flex flex-1 flex-col items-center justify-center py-2"
            : isCompact
              ? "mb-3"
              : "mb-6"
        }
      >
        <SuccessCheckIcon size={iconSize} />

        <h2
          className={`animate-card-pop font-display font-bold leading-tight text-h-foreground ${
            isCompact
              ? "mt-3 text-lg"
              : isFill
                ? "mt-5 text-xl"
                : "mt-0 text-[1.65rem]"
          }`}
          style={{ animationDelay: "120ms" }}
        >
          {title}
        </h2>
        <p
          className={`animate-card-pop font-medium text-h-muted ${
            isCompact
              ? "mt-1 text-xs"
              : isFill
                ? "mt-2 max-w-[16rem] text-sm"
                : "mt-2 text-sm"
          }`}
          style={{ animationDelay: "180ms" }}
        >
          {subtitle}
        </p>

        {xp > 0 && (
          <div
            className={`inline-flex animate-card-pop items-center gap-1.5 rounded-full border border-prosperity/50 ${
              isCompact
                ? "mt-2.5 px-3 py-1"
                : isFill
                  ? "mt-4 px-4 py-1.5"
                  : "mt-5 px-4 py-2"
            }`}
            style={{ animationDelay: "240ms" }}
          >
            <Star
              className={`fill-prosperity text-prosperity ${
                isCompact ? "size-3.5" : "size-4"
              }`}
            />
            <span
              className={`font-display font-bold text-prosperity ${
                isCompact ? "text-xs" : "text-sm"
              }`}
            >
              +{xp} {xpBadgeLabel}
            </span>
          </div>
        )}
      </div>

      <div
        className={`flex w-full flex-col animate-card-pop ${
          isFill ? "mt-auto shrink-0 pt-2" : isCompact ? "mt-4 gap-2" : "mt-8 gap-3"
        }`}
        style={{ animationDelay: "300ms" }}
      >
        <Link
          href="/leaderboard"
          className={`flex w-full items-center justify-center gap-2 rounded-2xl bg-prosperity font-display font-bold text-h-background shadow-[0_4px_0_0_var(--color-prosperity-shadow)] transition-transform active:translate-y-1 active:shadow-none ${
            isCompact ? "py-3 text-sm" : "py-4 text-base"
          }`}
        >
          <Trophy className={isCompact ? "size-4" : "size-5"} />
          {rankingLabel}
          <ArrowUpRight className={isCompact ? "size-3.5" : "size-4"} />
        </Link>

        {isFull && homeLabel && (
          <Link
            href={backHref}
            className="flex w-full items-center justify-center rounded-2xl border-2 border-prosperity/70 bg-transparent py-4 font-display text-base font-bold text-prosperity transition-transform active:scale-[0.98]"
          >
            {homeLabel}
          </Link>
        )}
      </div>
    </>
  );

  return (
    <section
      className={`relative animate-card-pop overflow-hidden text-center ${
        isFull
          ? "bg-transparent px-2 py-4"
          : `rounded-[1.75rem] bg-h-background ring-1 ring-prosperity/25 ${
              isFill
                ? "flex min-h-0 flex-1 flex-col px-5 py-6"
                : "px-4 py-4"
            }`
      } ${className}`}
      style={{ animationDelay: isFull ? undefined : "360ms" }}
    >
      {!isFull && (
        <>
          <div className="pointer-events-none absolute -right-12 -top-12 size-32 rounded-full bg-prosperity/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 size-32 rounded-full bg-prosperity/5 blur-3xl" />
        </>
      )}

      <div className={`relative ${isFill ? "flex min-h-0 flex-1 flex-col" : ""}`}>
        {body}
      </div>
    </section>
  );
}
