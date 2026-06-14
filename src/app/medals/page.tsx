"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Award,
  CalendarDays,
  Clock,
  Copy,
  Flame,
  Medal,
  ShieldCheck,
  Star,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ProfileMenu } from "@/components/ProfileMenu";
import { BottomNav } from "@/components/BottomNav";
import { formatDurationMs } from "@/lib/format";

type Achievement = {
  id: string;
  type: string;
  title: string;
  description: string;
  emoji: string;
  nftTokenId: string | null;
  txHash: string | null;
  mintedAt: string | null;
  createdAt: string;
  season: { weekKey: string; startDate: string; endDate: string } | null;
};

type SeasonEntry = {
  rank: number;
  xp: number;
  durationMs: number;
  season: { weekKey: string; startDate: string; endDate: string; status: string };
};

type Reward = {
  rank: number;
  rewardType: string;
  amount: string | null;
  status: string;
  season: { weekKey: string };
};

type MedalsResponse = {
  username: string;
  walletAddress: string;
  participationStreak: number;
  totalWeeksParticipated: number;
  achievements: Achievement[];
  seasonHistory: SeasonEntry[];
  dailyHistory: {
    date: string;
    xpEarned: number;
    durationMs: number | null;
    result: string;
    lifeRefillUsed: boolean;
  }[];
  pendingRewards: Reward[];
};

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

export default function MedalsPage() {
  const { t, locale } = useLocale();
  const [data, setData] = useState<MedalsResponse | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMedals = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const r = await fetch("/api/medals", { credentials: "include" });
      if (r.status === 401) {
        window.location.assign("/connect");
        return;
      }
      if (!r.ok) {
        setError(t.common.error);
        return;
      }
      setData(await r.json());
    } catch {
      setError(t.common.error);
    } finally {
      setLoading(false);
    }
  }, [t.common.error]);

  useEffect(() => {
    fetch("/api/users/me", { credentials: "include" })
      .then(async (r) => {
        if (r.ok) {
          const json = (await r.json()) as { isAdmin?: boolean };
          setIsAdmin(!!json.isAdmin);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadMedals();
  }, [loadMedals]);

  if (loading) {
    return (
      <>
        <main className="home-perfil flex flex-1 flex-col items-center justify-center safe-top">
          <div className="relative grid size-20 animate-float place-items-center rounded-full bg-prosperity/15 ring-2 ring-prosperity/30">
            <Medal className="size-9 text-prosperity" />
          </div>
          <p className="mt-4 font-display text-sm font-semibold text-h-muted">
            {t.common.loading}
          </p>
        </main>
        <BottomNav variant="perfil" />
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <main className="home-perfil flex flex-1 flex-col items-center justify-center px-6 text-center safe-top">
          <div className="animate-card-pop text-6xl">⚠️</div>
          <p className="mt-4 font-display font-bold text-h-muted">
            {error ?? t.common.error}
          </p>
          <button
            type="button"
            onClick={loadMedals}
            className="btn-chunky mt-6 rounded-2xl bg-prosperity px-8 py-4 font-display text-base font-bold text-h-background"
          >
            {t.common.retry}
          </button>
          <Link
            href="/home"
            className="mt-3 text-sm font-bold text-h-muted underline"
          >
            {t.challenge.backHome}
          </Link>
        </main>
        <BottomNav variant="perfil" />
      </>
    );
  }

  return (
    <>
      <main className="home-perfil flex flex-1 flex-col px-4 pb-28 safe-top">
        <header className="relative z-30 animate-card-pop mb-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-surface ring-2 ring-prosperity/30 card-depth-sm">
                <Medal className="size-7 text-prosperity" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-h-muted">
                  {t.common.appName}
                </p>
                <h1 className="font-display text-2xl font-bold text-h-foreground">
                  {t.medals.title}
                </h1>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <LanguageToggle variant="perfil" />
              <ProfileMenu
                username={data.username}
                walletAddress={data.walletAddress}
                isAdmin={isAdmin}
                variant="perfil"
              />
            </div>
          </div>
          <p
            className="mt-3 text-sm font-semibold text-h-muted"
            style={{ animationDelay: "60ms" }}
          >
            {t.medals.subtitle}
          </p>
        </header>

        <section
          className="animate-card-pop mb-4 grid grid-cols-3 gap-3"
          style={{ animationDelay: "80ms" }}
        >
          <StatCard
            icon={<Flame className="size-5 animate-flame fill-flame text-flame" />}
            value={data.participationStreak > 0 ? `${data.participationStreak}` : "—"}
            label={t.medals.participationStreak}
            valueClass={data.participationStreak > 0 ? "text-flame" : "text-h-foreground/40"}
          />
          <StatCard
            icon={<CalendarDays className="size-5 text-prosperity" />}
            value={data.totalWeeksParticipated > 0 ? `${data.totalWeeksParticipated}` : "—"}
            label={t.medals.totalWeeks}
            valueClass={
              data.totalWeeksParticipated > 0 ? "text-h-foreground" : "text-h-foreground/40"
            }
          />
          <StatCard
            icon={<Award className="size-5 fill-lemon/30 text-lemon" />}
            value={data.achievements.length > 0 ? `${data.achievements.length}` : "—"}
            label={t.medals.earned}
            valueClass={data.achievements.length > 0 ? "text-lemon" : "text-h-foreground/40"}
          />
        </section>

        <WalletRow
          walletAddress={data.walletAddress}
          label={t.home.walletConnected}
          copiedLabel={t.home.copied}
        />

        <Section
          title={t.medals.achievements}
          icon={<Award className="size-4 text-lemon" />}
          delay="160ms"
        >
          {data.achievements.length === 0 ? (
            <EmptyState message={t.medals.noAchievements} />
          ) : (
            <div className="flex flex-col gap-2">
              {data.achievements.map((a, i) => (
                <div
                  key={a.id}
                  className="animate-card-pop flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 ring-1 ring-h-border card-depth-sm"
                  style={{ animationDelay: `${200 + i * 40}ms` }}
                >
                  <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-h-background text-2xl ring-1 ring-h-border">
                    {a.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display font-bold text-h-foreground">
                      {a.title}
                    </p>
                    <p className="text-xs font-semibold text-h-muted">{a.description}</p>
                    {a.nftTokenId ? (
                      <p className="mt-1 text-[10px] font-bold text-prosperity">
                        NFT #{a.nftTokenId}
                      </p>
                    ) : (
                      <p className="mt-1 text-[10px] font-bold text-h-muted/60">
                        {t.medals.onchainSoon}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section
          title={t.medals.competitionHistory}
          icon={<Star className="size-4 fill-prosperity/30 text-prosperity" />}
          delay="240ms"
        >
          {data.seasonHistory.length === 0 ? (
            <EmptyState message={t.medals.noHistory} />
          ) : (
            <div className="flex flex-col gap-2">
              {data.seasonHistory.map((h, i) => (
                <div
                  key={h.season.weekKey}
                  className="animate-card-pop flex items-center justify-between rounded-2xl bg-surface px-4 py-3 ring-1 ring-h-border card-depth-sm"
                  style={{ animationDelay: `${280 + i * 40}ms` }}
                >
                  <div className="min-w-0">
                    <p className="font-display font-bold text-h-foreground">
                      {t.medals.season} {formatWeek(h.season.startDate, locale)}
                    </p>
                    <p className="mt-0.5 flex items-center gap-2 text-xs font-semibold text-h-muted">
                      <span className="flex items-center gap-0.5 text-prosperity">
                        <Star className="size-3 fill-prosperity/30" />
                        {h.xp} XP
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="size-3" />
                        {formatDurationMs(h.durationMs)}
                      </span>
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-sm font-black ${
                      h.rank <= 3
                        ? "bg-lemon/20 text-lemon ring-1 ring-lemon/40"
                        : "bg-h-background text-h-foreground ring-1 ring-h-border"
                    }`}
                  >
                    {RANK_MEDALS[h.rank - 1] ?? `#${h.rank}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section
          title={t.medals.dailyHistory}
          icon={<CalendarDays className="size-4 text-prosperity" />}
          delay="320ms"
        >
          {data.dailyHistory.length === 0 ? (
            <EmptyState message={t.medals.noDailyHistory} />
          ) : (
            <div className="flex flex-col gap-2">
              {data.dailyHistory.map((d, i) => (
                <div
                  key={d.date}
                  className="animate-card-pop flex items-center justify-between rounded-2xl bg-surface px-4 py-3 ring-1 ring-h-border card-depth-sm"
                  style={{ animationDelay: `${360 + i * 40}ms` }}
                >
                  <div className="min-w-0">
                    <p className="font-display font-bold text-h-foreground">{d.date}</p>
                    <p className="mt-0.5 text-xs font-semibold text-h-muted">
                      {d.xpEarned} XP · {formatDurationMs(d.durationMs ?? 0)}
                      {d.lifeRefillUsed ? " · ⚡ refill" : ""}
                    </p>
                  </div>
                  <span className="text-xl">
                    {d.result === "completed" ? "✅" : "💔"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>

        {data.pendingRewards.length > 0 && (
          <Section
            title={t.medals.pendingRewards}
            icon={<Medal className="size-4 text-lemon" />}
            delay="400ms"
          >
            <div className="flex flex-col gap-2">
              {data.pendingRewards.map((r, i) => (
                <div
                  key={i}
                  className="animate-card-pop rounded-2xl border-2 border-dashed border-prosperity/40 bg-prosperity/10 px-4 py-3 ring-1 ring-prosperity/20"
                  style={{ animationDelay: `${440 + i * 40}ms` }}
                >
                  <p className="font-display font-bold text-h-foreground">
                    {r.rewardType === "token" ? "💰" : "🎨"}{" "}
                    {r.rewardType === "token"
                      ? t.medals.tokenReward
                      : t.medals.nftReward}{" "}
                    · #{r.rank}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-h-muted">
                    {t.medals.status}: {r.status}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        )}
      </main>
      <BottomNav variant="perfil" />
    </>
  );
}

function Section({
  title,
  icon,
  delay,
  children,
}: {
  title: string;
  icon: ReactNode;
  delay?: string;
  children: ReactNode;
}) {
  return (
    <section className="animate-card-pop mt-6" style={{ animationDelay: delay }}>
      <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-h-foreground">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

function StatCard({
  icon,
  value,
  label,
  valueClass,
}: {
  icon: ReactNode;
  value: string;
  label: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl bg-surface p-3 text-center ring-1 ring-h-border card-depth-sm">
      <div className="mx-auto mb-1.5 grid size-8 place-items-center">{icon}</div>
      <p className={`font-display text-lg font-bold ${valueClass ?? "text-h-foreground"}`}>
        {value}
      </p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-h-muted">
        {label}
      </p>
    </div>
  );
}

function WalletRow({
  walletAddress,
  label,
  copiedLabel,
}: {
  walletAddress: string;
  label: string;
  copiedLabel: string;
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
      className="animate-card-pop mb-2 flex items-center gap-3 rounded-2xl bg-prosperity/10 p-3 ring-1 ring-prosperity/20"
      style={{ animationDelay: "120ms" }}
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
        <span className="text-[10px] font-semibold text-prosperity">{copiedLabel}</span>
      )}
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-2xl bg-surface px-4 py-8 text-center text-sm font-semibold text-h-muted ring-1 ring-h-border">
      {message}
    </p>
  );
}

function formatWeek(iso: string, locale: string) {
  const loc = locale === "en" ? "en-US" : "es-ES";
  return new Date(iso).toLocaleDateString(loc, {
    month: "short",
    day: "numeric",
  });
}
