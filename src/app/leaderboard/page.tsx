"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, Clock, Crown, Medal, Star, Trophy } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ProfileMenu } from "@/components/ProfileMenu";
import { BottomNav } from "@/components/BottomNav";
import { WeeklyPrizeBanner } from "@/components/WeeklyPrizeBanner";
import { formatDurationMs, formatSeasonRemaining } from "@/lib/format";
import { useMe } from "@/hooks/useMe";

type Entry = {
  userId: string;
  username: string;
  avatar: string;
  xp: number;
  level?: number;
  rank: number;
  isMe: boolean;
  durationMs?: number;
};

type Season = {
  weekKey: string;
  startDate: string;
  endDate: string;
  status?: string;
};

type LeaderboardResponse = {
  period: string;
  season?: Season | null;
  entries: Entry[];
  me: Entry | null;
  archivedSeasons?: {
    weekKey: string;
    startDate: string;
    endDate: string;
    topEntries: { username: string; avatar: string; rank: number; xp: number }[];
  }[];
};

const AVATAR_BGS = [
  "oklch(0.35 0.06 30)",
  "oklch(0.55 0.15 65)",
  "oklch(0.28 0.04 250)",
  "oklch(0.6 0.18 50)",
  "oklch(0.55 0.15 145)",
  "oklch(0.45 0.1 200)",
];

function avatarBg(userId: string) {
  let h = 0;
  for (let i = 0; i < userId.length; i++) {
    h = (h + userId.charCodeAt(i)) % AVATAR_BGS.length;
  }
  return AVATAR_BGS[h];
}

function WeeklyRulesText({ text }: { text: string }) {
  const parts = text.split(" · ");
  if (parts.length < 3) return <>{text}</>;
  return (
    <>
      {parts[0]} · {parts[1]} ·{" "}
      <span className="text-prosperity">{parts[2]}</span>
    </>
  );
}

export default function LeaderboardPage() {
  const { t, locale } = useLocale();
  const [period, setPeriod] = useState<"weekly" | "global">("weekly");
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const cacheRef = useRef<
    Partial<Record<"weekly" | "global", LeaderboardResponse>>
  >({});

  const { data: meData } = useMe();
  const meUser = meData?.user ?? null;
  const isAdmin = !!meData?.isAdmin;

  useEffect(() => {
    const cached = cacheRef.current[period];
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetch(`/api/leaderboard?period=${period}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d: LeaderboardResponse) => {
        if (!cancelled) {
          cacheRef.current[period] = d;
          setData(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

  return (
    <>
      <main className="home-perfil leaderboard-page flex flex-1 flex-col px-5 pb-28 safe-top">
        <header className="relative z-30 leaderboard-rise">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-h-border/60 bg-surface shadow-lg">
                <Trophy className="size-6 text-lemon" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold tracking-[0.2em] text-h-muted">
                  {t.common.appName.toUpperCase()}
                </p>
                <h1 className="font-display text-2xl font-extrabold leading-tight text-h-foreground">
                  {t.leaderboard.title}
                </h1>
              </div>
            </div>
            {meUser && (
              <div className="flex shrink-0 items-center gap-2">
                <LanguageToggle variant="perfil" />
                <ProfileMenu
                  username={meUser.username}
                  walletAddress={meUser.walletAddress}
                  isAdmin={isAdmin}
                  variant="perfil"
                />
              </div>
            )}
          </div>

          {period === "weekly" && data?.season && !loading && (
            <div className="mt-5 flex items-center justify-between gap-3 text-sm">
              <p className="flex min-w-0 items-center gap-2">
                <CalendarDays className="size-4 shrink-0 text-prosperity" />
                <span className="text-h-muted">{t.leaderboard.seasonLabel}:</span>
                <span className="truncate font-semibold text-h-foreground">
                  {formatRange(data.season.startDate, data.season.endDate, locale)}
                </span>
              </p>
              <SeasonCountdown
                endDate={data.season.endDate}
                endsInLabel={t.leaderboard.seasonEndsIn}
                endedLabel={t.leaderboard.seasonEnded}
              />
            </div>
          )}
        </header>

        <div
          className="leaderboard-rise mt-5 grid grid-cols-2 gap-1.5 rounded-2xl border border-h-border/60 bg-surface p-1.5 text-sm font-semibold"
          style={{ animationDelay: "60ms" }}
        >
          {(["weekly", "global"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-xl py-2.5 transition-all active:scale-[0.98] ${
                period === p
                  ? "border border-lemon/40 bg-gradient-to-b from-lemon/30 to-lemon/10 text-h-foreground shadow-[0_0_24px_oklch(0.78_0.16_85/0.3)]"
                  : "text-h-muted hover:text-h-foreground"
              }`}
            >
              {p === "weekly" ? t.leaderboard.weekly : t.leaderboard.global}
            </button>
          ))}
        </div>

        {period === "weekly" && (
          <WeeklyPrizeBanner variant="featured" className="mt-4" />
        )}

        {period === "weekly" && (
          <p
            className="leaderboard-rise mt-3 text-center text-xs text-h-muted"
            style={{ animationDelay: "80ms" }}
          >
            <WeeklyRulesText text={t.leaderboard.weeklyRules} />
          </p>
        )}

        <div className="mt-5 flex flex-1 flex-col gap-2.5">
          {loading ? (
            <div className="flex flex-1 flex-col items-center justify-center py-16">
              <div className="relative grid size-20 animate-float place-items-center rounded-full bg-prosperity/15 ring-2 ring-prosperity/30">
                <Trophy className="size-9 text-prosperity" />
              </div>
              <p className="mt-4 font-display text-sm font-semibold text-h-muted">
                {t.common.loading}
              </p>
            </div>
          ) : !data || data.entries.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
              <div className="leaderboard-rise text-6xl">🌱</div>
              <p className="mt-4 max-w-xs font-display text-base font-semibold text-h-muted">
                {t.leaderboard.noPlayers}
              </p>
              <p className="mt-1 text-xs text-h-muted/70">{t.leaderboard.empty}</p>
            </div>
          ) : (
            <>
              {data.entries.length >= 3 && (
                <PodiumTop3
                  entries={data.entries.slice(0, 3)}
                  youLabel={t.leaderboard.you}
                  showDuration={period === "weekly"}
                />
              )}

              {data.entries.slice(data.entries.length >= 3 ? 3 : 0).map((e, i) => (
                <LeaderboardRow
                  key={e.userId}
                  entry={e}
                  youLabel={t.leaderboard.you}
                  showDuration={period === "weekly"}
                  levelLabel={
                    period === "global" && e.level
                      ? (t.levels[e.level] ?? `Level ${e.level}`)
                      : undefined
                  }
                  delay={i * 80}
                />
              ))}

              {data.me && data.me.rank > data.entries.length && (
                <div className="sticky bottom-24 mt-2">
                  <LeaderboardRow
                    entry={data.me}
                    youLabel={t.leaderboard.you}
                    showDuration={period === "weekly"}
                    highlight
                  />
                </div>
              )}
            </>
          )}
        </div>

        {period === "global" &&
          data?.archivedSeasons &&
          data.archivedSeasons.length > 0 && (
            <section className="leaderboard-rise mt-8" style={{ animationDelay: "200ms" }}>
              <h2 className="font-display text-lg font-bold text-h-foreground">
                {t.leaderboard.pastSeasons}
              </h2>
              <div className="mt-3 flex flex-col gap-2">
                {data.archivedSeasons
                  .filter((s) => s.topEntries.length > 0)
                  .map((s, i) => (
                    <div
                      key={s.weekKey}
                      className="rounded-2xl border border-h-border/60 bg-surface/80 px-4 py-3 backdrop-blur"
                      style={{ animationDelay: `${240 + i * 40}ms` }}
                    >
                      <p className="flex items-center gap-2 font-display font-bold text-h-foreground">
                        <CalendarDays className="size-4 text-prosperity" />
                        {formatRange(s.startDate, s.endDate, locale)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {s.topEntries.map((e) => (
                          <span
                            key={`${s.weekKey}-${e.rank}`}
                            className="inline-flex items-center gap-1 rounded-full border border-h-border/60 bg-h-background px-2.5 py-1 text-xs font-bold text-h-foreground"
                          >
                            <Medal
                              className="size-3"
                              style={{
                                color:
                                  e.rank === 1
                                    ? "var(--lb-gold)"
                                    : e.rank === 2
                                      ? "var(--lb-silver)"
                                      : "var(--lb-bronze)",
                              }}
                            />
                            {e.username}{" "}
                            <span className="text-prosperity">{e.xp} XP</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          )}
      </main>
      <BottomNav variant="perfil" />
    </>
  );
}

function PodiumTop3({
  entries,
  youLabel,
  showDuration,
}: {
  entries: Entry[];
  youLabel: string;
  showDuration?: boolean;
}) {
  const order: { player: Entry; place: 1 | 2 | 3 }[] = [
    { player: entries[1], place: 2 },
    { player: entries[0], place: 1 },
    { player: entries[2], place: 3 },
  ].filter((x) => x.player) as { player: Entry; place: 1 | 2 | 3 }[];

  const heights: Record<1 | 2 | 3, string> = {
    1: "h-32",
    2: "h-24",
    3: "h-20",
  };

  return (
    <section
      className="leaderboard-rise relative overflow-hidden rounded-3xl border border-h-border/60 bg-surface/80 p-5 pb-3 shadow-2xl backdrop-blur"
      style={{ animationDelay: "100ms" }}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-lemon/5 via-transparent to-prosperity/5"
        aria-hidden
      />

      <div className="relative mb-5 flex items-center justify-center gap-2">
        <Crown className="size-4 text-lemon" />
        <span className="text-xs font-bold tracking-[0.25em] leaderboard-shimmer-text">
          TOP 3
        </span>
        <Crown className="size-4 text-lemon" />
      </div>

      <div className="relative grid grid-cols-3 items-end gap-3">
        {order.map(({ player, place }) => (
          <PodiumColumn
            key={player.userId}
            player={player}
            place={place}
            heightClass={heights[place]}
            youLabel={youLabel}
            showDuration={showDuration}
          />
        ))}
      </div>
    </section>
  );
}

function PodiumColumn({
  player,
  place,
  heightClass,
  youLabel,
  showDuration,
}: {
  player: Entry;
  place: 1 | 2 | 3;
  heightClass: string;
  youLabel: string;
  showDuration?: boolean;
}) {
  const ringColor =
    place === 1 ? "var(--lb-gold)" : place === 2 ? "var(--lb-silver)" : "var(--lb-bronze)";
  const podiumBg =
    place === 1
      ? "var(--lb-gradient-podium-1)"
      : place === 2
        ? "var(--lb-gradient-podium-2)"
        : "var(--lb-gradient-podium-3)";
  const medalBg =
    place === 1
      ? "var(--lb-gradient-gold)"
      : place === 2
        ? "var(--lb-gradient-silver)"
        : "var(--lb-gradient-bronze)";

  return (
    <div
      className="flex flex-col items-center"
      style={{ animationDelay: `${place * 100}ms` }}
    >
      {place === 1 && (
        <Crown
          className="mb-1 size-5 animate-float text-lemon"
          fill="currentColor"
        />
      )}

      <div
        className={`relative mb-2 grid size-16 place-items-center rounded-2xl text-3xl ${
          place === 1 ? "leaderboard-pulse-glow" : ""
        }`}
        style={{
          background: avatarBg(player.userId),
          boxShadow: place === 1 ? undefined : `0 0 0 2px ${ringColor}`,
        }}
      >
        <span>{player.avatar}</span>
        <div
          className="absolute -bottom-1.5 -right-1.5 grid size-6 place-items-center rounded-full border-2 border-surface text-[10px] font-black text-h-background"
          style={{ background: ringColor }}
        >
          {place}
        </div>
      </div>

      <p className="max-w-[4.5rem] text-center text-sm font-bold leading-tight text-h-foreground">
        {player.username}
        {player.isMe && (
          <span className="ml-1 text-[10px] font-bold text-lemon">({youLabel})</span>
        )}
      </p>
      <p className="mt-0.5 text-xs font-extrabold text-prosperity">{player.xp} XP</p>
      {showDuration && (
        <p className="mt-0.5 flex items-center gap-1 text-[10px] text-h-muted">
          <Clock className="size-2.5 shrink-0" />
          {formatDurationMs(player.durationMs ?? 0)}
        </p>
      )}

      <div
        className={`leaderboard-rise mt-2 grid w-full place-items-center rounded-t-xl border-x border-t border-h-border/40 ${heightClass}`}
        style={{ background: podiumBg, animationDelay: `${place * 80 + 120}ms` }}
      >
        <div
          className="grid size-8 place-items-center rounded-full shadow-lg"
          style={{ background: medalBg }}
        >
          <Medal className="size-4 text-h-background" strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
}

function LeaderboardRow({
  entry,
  youLabel,
  levelLabel,
  highlight,
  showDuration,
  delay = 0,
}: {
  entry: Entry;
  youLabel: string;
  levelLabel?: string;
  highlight?: boolean;
  showDuration?: boolean;
  delay?: number;
}) {
  return (
    <div
      className={`leaderboard-rise flex items-center gap-3 rounded-2xl border border-h-border/60 bg-surface/80 p-3 pr-4 backdrop-blur transition-all hover:border-lemon/40 hover:bg-surface ${
        entry.isMe || highlight ? "border-lemon/60" : ""
      }`}
      style={{
        animationDelay: `${delay}ms`,
        boxShadow: entry.isMe || highlight ? "var(--lb-shadow-you)" : undefined,
      }}
    >
      <div className="grid size-9 shrink-0 place-items-center rounded-full border border-h-border/60 bg-h-background text-sm font-bold text-h-muted">
        {entry.rank}
      </div>
      <div
        className="grid size-10 shrink-0 place-items-center rounded-xl text-xl"
        style={{ background: avatarBg(entry.userId) }}
      >
        {entry.avatar}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-h-foreground">
          {entry.username}
          {entry.isMe && (
            <span className="ml-1.5 inline-block rounded-md bg-lemon px-1.5 py-0.5 text-[9px] font-black text-h-background">
              {youLabel.toUpperCase()}
            </span>
          )}
        </p>
        {levelLabel && (
          <p className="text-[11px] text-h-muted">{levelLabel}</p>
        )}
      </div>
      <div className="shrink-0 text-right">
        <p className="flex items-center justify-end gap-1 text-sm font-extrabold text-prosperity">
          <Star className="size-3.5 fill-prosperity/30 text-prosperity" />
          {entry.xp}
        </p>
        {showDuration && (
          <p className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-h-muted">
            <Clock className="size-2.5 shrink-0" />
            {formatDurationMs(entry.durationMs ?? 0)}
          </p>
        )}
      </div>
    </div>
  );
}

function formatRange(start: string, end: string, locale: string) {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const loc = locale === "en" ? "en-US" : "es-ES";
  return `${new Date(start).toLocaleDateString(loc, opts)} – ${new Date(end).toLocaleDateString(loc, opts)}`;
}

function SeasonCountdown({
  endDate,
  endsInLabel,
  endedLabel,
}: {
  endDate: string;
  endsInLabel: string;
  endedLabel: string;
}) {
  const [remaining, setRemaining] = useState(() => formatSeasonRemaining(endDate));

  useEffect(() => {
    const tick = () => setRemaining(formatSeasonRemaining(endDate));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [endDate]);

  return (
    <p className="flex shrink-0 items-center gap-2 whitespace-nowrap text-xs">
      <Clock className="size-4 shrink-0 animate-float text-lemon" />
      {remaining ? (
        <>
          <span className="text-h-muted">{endsInLabel}</span>
          <span className="font-bold leaderboard-shimmer-text font-mono tabular-nums">
            {remaining}
          </span>
        </>
      ) : (
        <span className="font-bold text-lemon">{endedLabel}</span>
      )}
    </p>
  );
}
