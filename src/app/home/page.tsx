"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star,
  CalendarDays,
  Flame,
  ShieldCheck,
  Copy,
  ArrowUpRight,
  Zap,
  HeartCrack,
  Coins,
  DollarSign,
} from "lucide-react";
import { getCopmTokenConfig, getUsdcTokenConfig } from "@/lib/tokens/recovery";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { HomePageSkeleton } from "@/components/skeletons/PageSkeletons";
import { BottomNav } from "@/components/BottomNav";
import { ProfileMenu } from "@/components/ProfileMenu";
import { AppVersionBadge } from "@/components/AppVersionBadge";
import { ChallengeCompletedCard } from "@/components/ChallengeCompletedCard";
import { useMe } from "@/hooks/useMe";
import { prefetchChallengeToday } from "@/lib/client/challenge-cache";

type WalletBalanceCell = {
  configured: boolean;
  symbol: string;
  display: string;
  error: boolean;
};

type BalancesResponse = {
  tcopm: WalletBalanceCell;
  usdc: WalletBalanceCell;
};

export default function HomePage() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const { data, loading } = useMe({
    onUnauthorized: () => router.replace("/connect"),
  });
  const [balances, setBalances] = useState<BalancesResponse | null>(null);
  const [balancesLoading, setBalancesLoading] = useState(false);
  const copmToken = getCopmTokenConfig();
  const usdcToken = getUsdcTokenConfig();

  useEffect(() => {
    if (!data?.today.completed) {
      prefetchChallengeToday(locale);
    }
  }, [data?.today.completed, locale]);

  useEffect(() => {
    if (!data?.user.walletAddress) return;
    let cancelled = false;
    setBalancesLoading(true);

    fetch("/api/wallet/balances", { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) throw new Error("balances fetch failed");
        return r.json() as Promise<BalancesResponse>;
      })
      .then((payload) => {
        if (!cancelled) setBalances(payload);
      })
      .catch(() => {
        if (!cancelled) {
          setBalances({
            tcopm: {
              configured: true,
              symbol: copmToken.symbol,
              display: "0",
              error: true,
            },
            usdc: {
              configured: true,
              symbol: usdcToken.symbol,
              display: "0",
              error: true,
            },
          });
        }
      })
      .finally(() => {
        if (!cancelled) setBalancesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [data?.user.walletAddress, copmToken.symbol, usdcToken.symbol]);

  if (loading || !data) {
    return (
      <>
        <HomePageSkeleton />
        <BottomNav variant="perfil" />
      </>
    );
  }

  const { user, levelInfo, today, weekly } = data;
  const levelName =
    levelInfo.name ?? t.levels[levelInfo.level] ?? `Level ${levelInfo.level}`;
  const levelEmoji = levelInfo.emoji ?? "🌱";
  const challengeDone = today.completed;
  const inProgress = today.started && !today.completed && today.answeredCount > 0;
  const needsRefill = today.awaitingRefill;
  const progressPct = Math.round(levelInfo.progress * 100);
  const compactLayout = !challengeDone;

  return (
    <>
      <main
        className={`home-perfil flex min-h-dvh flex-1 flex-col px-4 safe-top-sm ${
          compactLayout ? "pb-20" : "pb-24"
        }`}
      >
        <div className={challengeDone ? "shrink-0" : "shrink-0 space-y-4"}>
        <header className="relative z-30 flex animate-card-pop items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`grid place-items-center overflow-hidden rounded-2xl bg-surface-2 ring-2 ring-prosperity/30 card-depth-sm ${
                compactLayout ? "size-12" : "size-16"
              }`}
            >
              <span className={`animate-bob ${compactLayout ? "text-3xl" : "text-4xl"}`}>
                {user.avatar}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-h-muted">
                {t.home.welcome}
              </p>
              <h1
                className={`font-display font-bold leading-tight ${
                  compactLayout ? "text-xl" : "text-2xl"
                }`}
              >
                {user.username}{" "}
                <span className="inline-block animate-bob">👋</span>
              </h1>
              <div className="mt-1">
                <AppVersionBadge label={t.common.versions} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle variant="perfil" />
            <ProfileMenu
              username={user.username}
              walletAddress={user.walletAddress}
              isAdmin={data?.isAdmin}
              variant="perfil"
            />
          </div>
        </header>

        <section
          className={`animate-card-pop rounded-3xl bg-surface ring-1 ring-h-border card-depth ${
            compactLayout ? "p-3.5" : challengeDone ? "mb-3 p-4" : "mb-4 p-5"
          }`}
          style={{ animationDelay: "60ms" }}
        >
          <div className="flex items-center gap-3">
            {!compactLayout && (
              <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-h-background ring-2 ring-lemon/40">
                <span className="text-4xl">{user.avatar}</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="inline-block rounded-full bg-lemon px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-h-background">
                {levelEmoji} {t.home.level} {levelInfo.level}
              </span>
              <h2
                className={`truncate font-display font-semibold ${
                  compactLayout ? "mt-0.5 text-base" : "mt-1 text-lg"
                }`}
              >
                {levelName}
              </h2>
              {levelInfo.nextTierName && levelInfo.nextLevelXp && (
                <p className="mt-0.5 truncate text-[11px] text-h-muted">
                  {t.home.nextLevelPreview}: {levelInfo.nextTierName}
                </p>
              )}
            </div>
            <Link
              href="/progress"
              className="shrink-0 rounded-xl bg-h-background px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-prosperity ring-1 ring-h-border transition-transform active:scale-95"
            >
              {t.home.myProgress}
            </Link>
          </div>
          <div className={compactLayout ? "mt-2.5" : "mt-4"}>
            <div
              className={`relative w-full overflow-hidden rounded-full bg-h-background ring-1 ring-h-border ${
                compactLayout ? "h-3" : "h-4"
              }`}
            >
              <div
                className="relative h-full animate-xp-fill rounded-full bg-gradient-to-r from-prosperity to-lemon"
                style={{ width: `${progressPct}%` }}
              >
                <div className="absolute inset-y-0 left-0 w-1/2 animate-shimmer bg-white/30" />
              </div>
            </div>
            <p className={`font-medium text-h-muted ${compactLayout ? "mt-1 text-[11px]" : "mt-2 text-xs"}`}>
              {levelInfo.nextLevelXp ? (
                <>
                  <span className="text-h-foreground">{user.xpTotal}</span> /{" "}
                  {levelInfo.nextLevelXp} {t.home.xpToNext}
                </>
              ) : (
                t.home.maxLevel
              )}
            </p>
          </div>
        </section>

        <section className={`grid grid-cols-3 gap-2 ${compactLayout ? "" : challengeDone ? "mb-3" : "mb-4"}`}>
          <StatCard
            icon={<Star className={`fill-lemon text-lemon ${compactLayout ? "size-4" : "size-5"}`} />}
            value={`${user.xpTotal}`}
            label={t.home.xp}
            valueClass="text-lemon"
            delay="120ms"
            compact={compactLayout || challengeDone}
          />
          <StatCard
            icon={<CalendarDays className={`text-prosperity ${compactLayout ? "size-4" : "size-5"}`} />}
            value={weekly.xp > 0 ? `${weekly.xp}` : "—"}
            label={t.home.weeklyXp}
            valueClass={weekly.xp > 0 ? "text-h-foreground" : "text-h-foreground/40"}
            delay="180ms"
            compact={compactLayout || challengeDone}
          />
          <StatCard
            icon={
              <Flame className={`animate-flame fill-flame text-flame ${compactLayout ? "size-4" : "size-5"}`} />
            }
            value={`${user.streak}`}
            label={t.home.streak}
            valueClass="text-flame"
            delay="240ms"
            compact={compactLayout || challengeDone}
          />
        </section>

        <IdentityRow
          walletAddress={user.walletAddress}
          label={t.home.walletConnected}
          copiedLabel={t.home.copied}
          compact={compactLayout || challengeDone}
        />

        <WalletBalancesRow
          tcopm={{
            label: `${t.home.balancePrefix} ${balances?.tcopm.symbol ?? copmToken.symbol}`,
            symbol: balances?.tcopm.symbol ?? copmToken.symbol,
            balance:
              balances && !balances.tcopm.error
                ? `${balances.tcopm.display} ${balances.tcopm.symbol ?? copmToken.symbol}`
                : null,
            loading: balancesLoading,
            error: balances?.tcopm.error ?? false,
            show: balances?.tcopm.configured ?? true,
          }}
          usdc={{
            label: t.home.usdcBalance,
            symbol: balances?.usdc.symbol ?? usdcToken.symbol,
            balance:
              balances && !balances.usdc.error
                ? `${balances.usdc.display} ${balances.usdc.symbol}`
                : null,
            loading: balancesLoading,
            error: balances?.usdc.error ?? false,
            show: balances?.usdc.configured ?? true,
          }}
          loadingLabel={t.home.tcopmBalanceLoading}
          errorLabel={t.home.tcopmBalanceError}
          compact={compactLayout || challengeDone}
        />
        </div>

        <div className="mt-4 mb-4 flex min-h-0 flex-1 flex-col">
          {challengeDone ? (
            <ChallengeCompletedCard
              layout="embedded-fill"
              title={t.home.dailyChallengeDone}
              subtitle={t.home.dailyChallengeDoneHint}
              xp={today.xpEarned}
              xpBadgeLabel={t.home.xpEarnedBadge}
              rankingLabel={t.home.viewRanking}
              playTabLabel={t.home.playTab.toUpperCase()}
            />
          ) : needsRefill ? (
            <DailyChallengeRefill
              title={t.home.needsRefill}
              cta={t.home.recoverOrWait}
              xp={today.xpEarned}
              fill
            />
          ) : (
            <DailyChallengePlay
              title={t.home.dailyChallenge}
              subtitle={
                inProgress
                  ? `${today.answeredCount}/${today.totalQuestions}`
                  : t.home.dailyChallengeReady
              }
              livesLabel={`${today.livesLeft} ${t.home.lives}`}
              cta={inProgress ? t.home.continueChallenge : t.home.playNow}
              fill
            />
          )}
        </div>
      </main>
      <BottomNav variant="perfil" />
    </>
  );
}

function StatCard({
  icon,
  value,
  label,
  valueClass,
  delay,
  compact = false,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  valueClass: string;
  delay: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex animate-card-pop flex-col items-center gap-1 rounded-2xl bg-surface ring-1 ring-h-border card-depth-sm transition-transform hover:-translate-y-0.5 ${
        compact ? "p-2.5" : "gap-1.5 p-4"
      }`}
      style={{ animationDelay: delay }}
    >
      {icon}
      <span
        className={`font-display font-bold leading-none ${valueClass} ${
          compact ? "text-xl" : "text-2xl"
        }`}
      >
        {value}
      </span>
      <span className="text-center text-[10px] font-semibold uppercase tracking-tight text-h-muted">
        {label}
      </span>
    </div>
  );
}

function IdentityRow({
  walletAddress,
  label,
  copiedLabel,
  compact = false,
}: {
  walletAddress: string;
  label: string;
  copiedLabel: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const short =
    walletAddress.length > 42
      ? `${walletAddress.slice(0, 38)}...`
      : walletAddress;

  function handleCopy() {
    navigator.clipboard?.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <section
      className={`flex animate-card-pop items-center gap-2.5 rounded-2xl bg-prosperity/10 ring-1 ring-prosperity/20 ${
        compact ? "p-2" : "mb-5 p-3"
      }`}
      style={{ animationDelay: "300ms" }}
    >
      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-prosperity/20 text-prosperity">
        <ShieldCheck className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-prosperity">{label}</p>
        <p className="truncate font-mono text-[11px] text-h-muted">{short}</p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy address"
        className="grid size-8 shrink-0 place-items-center rounded-lg text-h-muted transition-colors hover:text-prosperity active:scale-90"
      >
        <Copy className="size-4" />
      </button>
      {copied && (
        <span className="text-[10px] font-semibold text-prosperity">
          {copiedLabel}
        </span>
      )}
    </section>
  );
}

function WalletBalancesRow({
  tcopm,
  usdc,
  loadingLabel,
  errorLabel,
  compact = false,
}: {
  tcopm: {
    label: string;
    symbol: string;
    balance: string | null;
    loading: boolean;
    error: boolean;
    show: boolean;
  };
  usdc: {
    label: string;
    symbol: string;
    balance: string | null;
    loading: boolean;
    error: boolean;
    show: boolean;
  };
  loadingLabel: string;
  errorLabel: string;
  compact?: boolean;
}) {
  const columns = [
    tcopm.show
      ? {
          key: "tcopm",
          icon: <Coins className="size-4" />,
          accent: "lemon" as const,
          label: tcopm.label,
          symbol: tcopm.symbol,
          balance: tcopm.balance,
          loading: tcopm.loading,
          error: tcopm.error,
        }
      : null,
    usdc.show
      ? {
          key: "usdc",
          icon: <DollarSign className="size-4" />,
          accent: "prosperity" as const,
          label: usdc.label,
          symbol: usdc.symbol,
          balance: usdc.balance,
          loading: usdc.loading,
          error: usdc.error,
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    icon: React.ReactNode;
    accent: "lemon" | "prosperity";
    label: string;
    symbol: string;
    balance: string | null;
    loading: boolean;
    error: boolean;
  }>;

  if (columns.length === 0) return null;

  return (
    <section
      className={`grid animate-card-pop gap-2 ${
        columns.length === 2 ? "grid-cols-2" : "grid-cols-1"
      } ${compact ? "mb-2 mt-2" : "mb-5 mt-3"}`}
      style={{ animationDelay: "320ms" }}
    >
      {columns.map((col) => (
        <div
          key={col.key}
          className={`flex min-w-0 items-center gap-2 rounded-2xl ring-1 ${
            col.accent === "lemon"
              ? "bg-lemon/10 ring-lemon/25"
              : "bg-prosperity/10 ring-prosperity/25"
          } ${compact ? "p-2" : "p-3"}`}
        >
          <div
            className={`grid size-8 shrink-0 place-items-center rounded-xl ${
              col.accent === "lemon"
                ? "bg-lemon/20 text-lemon"
                : "bg-prosperity/20 text-prosperity"
            }`}
          >
            {col.icon}
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={`truncate text-[10px] font-semibold uppercase tracking-tight ${
                col.accent === "lemon" ? "text-lemon" : "text-prosperity"
              }`}
            >
              {col.label}
            </p>
            <p className="truncate font-mono text-xs font-bold tabular-nums text-h-foreground sm:text-sm">
              {col.loading ? (
                <span className="text-h-muted">{loadingLabel}</span>
              ) : col.error ? (
                <span className="text-[10px] font-semibold text-danger">
                  {errorLabel}
                </span>
              ) : col.balance != null ? (
                col.balance
              ) : (
                <>
                  0 <span>{col.symbol}</span>
                </>
              )}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}

function DailyChallengeRefill({
  title,
  cta,
  xp,
  fill = false,
}: {
  title: string;
  cta: string;
  xp: number;
  fill?: boolean;
}) {
  return (
    <section
      className={`relative animate-card-pop overflow-hidden rounded-[1.75rem] bg-surface text-center ring-1 ring-danger/30 card-depth ${
        fill ? "flex min-h-0 flex-1 flex-col p-5" : "p-7"
      }`}
      style={{ animationDelay: "360ms" }}
    >
      <div
        className={`flex flex-1 flex-col items-center justify-center ${
          fill ? "min-h-0" : ""
        }`}
      >
        <div className="mx-auto mb-3 grid size-14 place-items-center rounded-full bg-danger/15">
          <HeartCrack className="size-7 text-danger" />
        </div>
        <h3 className="font-display text-xl font-bold leading-tight">{title}</h3>
        {xp > 0 && (
          <p className="mt-1 text-sm text-h-muted">+{xp} XP</p>
        )}
      </div>
      <Link
        href="/challenge"
        className="btn-chunky mt-auto flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-prosperity py-3.5 font-display text-sm font-bold text-h-background"
      >
        <Zap className="size-5" />
        {cta}
        <ArrowUpRight className="size-4" />
      </Link>
    </section>
  );
}

function DailyChallengePlay({
  title,
  subtitle,
  livesLabel,
  cta,
  fill = false,
}: {
  title: string;
  subtitle: string;
  livesLabel: string;
  cta: string;
  fill?: boolean;
}) {
  return (
    <section
      className={`relative animate-card-pop overflow-hidden rounded-[1.75rem] bg-surface text-center ring-1 ring-h-border card-depth ${
        fill ? "flex min-h-0 flex-1 flex-col p-5" : "p-7"
      }`}
      style={{ animationDelay: "360ms" }}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-prosperity/10 blur-2xl" />
      <div
        className={`flex flex-1 flex-col items-center justify-center ${
          fill ? "min-h-0" : ""
        }`}
      >
        <div className="mx-auto mb-3 grid size-14 animate-float place-items-center rounded-full bg-prosperity/20">
          <Zap className="size-7 text-prosperity" />
        </div>
        <h3 className="font-display text-xl font-bold leading-tight">{title}</h3>
        <p className="mt-0.5 text-sm font-medium text-h-muted">{subtitle}</p>
        <p className="mt-1 text-xs font-bold text-h-muted">❤️ {livesLabel}</p>
      </div>
      <Link
        href="/challenge"
        className="btn-chunky mt-auto flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-lemon py-3.5 font-display text-sm font-bold text-h-background"
      >
        {cta}
        <ArrowUpRight className="size-4" />
      </Link>
    </section>
  );
}
