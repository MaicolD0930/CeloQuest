"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
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
import { useMe } from "@/hooks/useMe";
import { resolveAchievementDisplay } from "@/lib/achievements/catalog";
import { AchievementSeasonLabel } from "@/components/AchievementSeasonLabel";
import { AchievementImageButton } from "@/components/AchievementImageButton";

type AchievementItem = {
  id: string;
  type: string;
  title: string;
  description: string;
  emoji: string;
  status: string;
  image: string | null;
  createdAt: string;
  seasonLabel: string | null;
};

type SeasonEntry = {
  rank: number;
  xp: number;
  durationMs: number;
  season: { weekKey: string; startDate: string; endDate: string; status: string };
};

type PageData = {
  username: string;
  walletAddress: string;
  participationStreak: number;
  totalWeeksParticipated: number;
  achievements: AchievementItem[];
  seasonHistory: SeasonEntry[];
  dailyHistory: {
    date: string;
    xpEarned: number;
    durationMs: number | null;
    result: string;
    lifeRefillUsed: boolean;
  }[];
};

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

export default function AchievementsPage() {
  const { t, locale } = useLocale();
  const { data: meData } = useMe();
  const isAdmin = !!meData?.isAdmin;
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"badges" | "history">("badges");

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const r = await fetch(`/api/medals?locale=${locale}`, {
        credentials: "include",
      });
      if (r.status === 401) {
        window.location.assign("/connect");
        return;
      }
      if (!r.ok) {
        setError(t.common.error);
        return;
      }
      const medals = (await r.json()) as PageData;
      setData({
        ...medals,
        achievements: medals.achievements.map((a) => {
          const display = resolveAchievementDisplay(a.type, locale, {
            title: a.title,
            description: a.description,
            emoji: a.emoji,
          });
          return {
            id: a.id,
            type: a.type,
            title: display.title,
            description: display.description,
            emoji: display.emoji,
            status: a.status ?? "claimed",
            image: display.image,
            createdAt: a.createdAt,
            seasonLabel: a.seasonLabel,
          };
        }),
      });
    } catch {
      setError(t.common.error);
    } finally {
      setLoading(false);
    }
  }, [locale, t.common.error]);

  useEffect(() => {
    void load();
  }, [load]);

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
          <p className="font-display font-bold text-h-muted">{error ?? t.common.error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="btn-chunky mt-6 rounded-2xl bg-prosperity px-8 py-4 font-display font-bold text-h-background"
          >
            {t.common.retry}
          </button>
        </main>
        <BottomNav variant="perfil" />
      </>
    );
  }

  return (
    <div className="home-perfil flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-4 pb-2 pt-4 safe-top">
        <div className="flex items-center gap-2">
          <Award className="size-7 text-lemon" />
          <div>
            <h1 className="font-display text-xl font-bold">{t.achievements.title}</h1>
            <p className="text-xs text-h-muted">{t.achievements.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle variant="perfil" />
          <ProfileMenu
            isAdmin={isAdmin}
            username={data.username}
            walletAddress={data.walletAddress}
            variant="perfil"
          />
        </div>
      </header>

      <main className="flex-1 px-4 pb-28">
        <section className="mb-4 grid grid-cols-3 gap-3">
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

        <div className="mt-5 grid grid-cols-2 gap-1.5 rounded-2xl border border-h-border/60 bg-surface p-1.5 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setTab("badges")}
            className={`rounded-xl py-2.5 transition-all ${
              tab === "badges"
                ? "border border-lemon/40 bg-gradient-to-b from-lemon/30 to-lemon/10 text-h-foreground"
                : "text-h-muted hover:text-h-foreground"
            }`}
          >
            {t.achievements.tabBadges}
          </button>
          <button
            type="button"
            onClick={() => setTab("history")}
            className={`rounded-xl py-2.5 transition-all ${
              tab === "history"
                ? "border border-lemon/40 bg-gradient-to-b from-lemon/30 to-lemon/10 text-h-foreground"
                : "text-h-muted hover:text-h-foreground"
            }`}
          >
            {t.achievements.tabHistory}
          </button>
        </div>

        {tab === "badges" ? (
          <Section title={t.medals.achievements} icon={<Award className="size-4 text-lemon" />}>
            {data.achievements.length === 0 ? (
              <EmptyState message={t.medals.noAchievements} />
            ) : (
              <div className="flex flex-col gap-2">
                {data.achievements.map((a) => (
                  <article
                    key={a.id}
                    className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 ring-1 ring-h-border card-depth-sm"
                  >
                    <AchievementImageButton
                      image={a.image}
                      emoji={a.emoji}
                      title={a.title}
                      description={a.description}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display font-bold text-h-foreground">
                        {a.title}
                      </p>
                      <p className="text-xs font-semibold text-h-muted">{a.description}</p>
                      {a.seasonLabel && <AchievementSeasonLabel label={a.seasonLabel} />}
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-prosperity">
                        {t.achievements.statusEarned}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </Section>
        ) : (
          <>
            <Section
              title={t.medals.competitionHistory}
              icon={<Star className="size-4 fill-prosperity/30 text-prosperity" />}
            >
              {data.seasonHistory.length === 0 ? (
                <EmptyState message={t.medals.noHistory} />
              ) : (
                <div className="flex flex-col gap-2">
                  {data.seasonHistory.map((h) => (
                    <div
                      key={h.season.weekKey}
                      className="flex items-center justify-between rounded-2xl bg-surface px-4 py-3 ring-1 ring-h-border card-depth-sm"
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
            >
              {data.dailyHistory.length === 0 ? (
                <EmptyState message={t.medals.noDailyHistory} />
              ) : (
                <div className="flex flex-col gap-2">
                  {data.dailyHistory.map((d) => (
                    <div
                      key={d.date}
                      className="flex items-center justify-between rounded-2xl bg-surface px-4 py-3 ring-1 ring-h-border card-depth-sm"
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
          </>
        )}
      </main>

      <BottomNav variant="perfil" />
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-6">
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
    <section className="mb-2 flex items-center gap-3 rounded-2xl bg-prosperity/10 p-3 ring-1 ring-prosperity/20">
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
