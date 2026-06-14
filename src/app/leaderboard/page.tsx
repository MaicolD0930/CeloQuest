"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Clock, Crown, Star, Trophy } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ProfileMenu } from "@/components/ProfileMenu";
import { BottomNav } from "@/components/BottomNav";
import { formatDurationMs, formatSeasonRemaining } from "@/lib/format";

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

const MEDALS = ["🥇", "🥈", "🥉"];

type MeUser = { username: string; walletAddress: string };

export default function LeaderboardPage() {
  const { t, locale } = useLocale();
  const [period, setPeriod] = useState<"weekly" | "global">("weekly");
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [meUser, setMeUser] = useState<MeUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users/me", { credentials: "include" })
      .then(async (r) => {
        if (r.ok) {
          const json = (await r.json()) as { user: MeUser; isAdmin?: boolean };
          setMeUser(json.user);
          setIsAdmin(!!json.isAdmin);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/leaderboard?period=${period}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) {
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
      <main className="home-perfil flex flex-1 flex-col px-4 pb-28 safe-top">
        <header className="relative z-30 animate-card-pop mb-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-surface ring-2 ring-lemon/30 card-depth-sm">
                <Trophy className="size-7 text-lemon" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-h-muted">
                  {t.common.appName}
                </p>
                <h1 className="font-display text-2xl font-bold text-h-foreground">
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
            <div
              className="mt-3 flex animate-card-pop items-center justify-between gap-3 text-sm font-semibold"
              style={{ animationDelay: "60ms" }}
            >
              <p className="flex min-w-0 items-center gap-2 text-h-muted">
                <CalendarDays className="size-4 shrink-0 text-prosperity" />
                <span className="truncate">
                  {t.leaderboard.seasonLabel}:{" "}
                  <span className="text-h-foreground">
                    {formatRange(data.season.startDate, data.season.endDate, locale)}
                  </span>
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
          className="animate-card-pop mb-4 flex gap-1 rounded-xl bg-surface p-1 ring-1 ring-h-border"
          style={{ animationDelay: "80ms" }}
        >
          {(["weekly", "global"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all active:scale-[0.98] ${
                period === p
                  ? "bg-lemon text-h-background shadow-sm"
                  : "text-h-muted hover:text-h-foreground"
              }`}
            >
              {p === "weekly" ? t.leaderboard.weekly : t.leaderboard.global}
            </button>
          ))}
        </div>

        {period === "weekly" && (
          <p
            className="animate-card-pop mb-4 text-center text-[11px] font-semibold text-h-muted"
            style={{ animationDelay: "100ms" }}
          >
            {t.leaderboard.weeklyRules}
          </p>
        )}

        <div className="flex flex-1 flex-col gap-2">
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
              <div className="animate-card-pop text-6xl">🌱</div>
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
                  delay={`${120 + i * 40}ms`}
                />
              ))}

              {data.me && data.me.rank > data.entries.length && (
                <div
                  className="sticky bottom-24 mt-2 animate-card-pop"
                  style={{ animationDelay: "200ms" }}
                >
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
            <section className="mt-8 animate-card-pop" style={{ animationDelay: "240ms" }}>
              <h2 className="font-display text-lg font-bold text-h-foreground">
                {t.leaderboard.pastSeasons}
              </h2>
              <div className="mt-3 flex flex-col gap-2">
                {data.archivedSeasons.map((s, i) => (
                  <div
                    key={s.weekKey}
                    className="rounded-2xl bg-surface px-4 py-3 ring-1 ring-h-border card-depth-sm"
                    style={{ animationDelay: `${280 + i * 40}ms` }}
                  >
                    <p className="flex items-center gap-2 font-display font-bold text-h-foreground">
                      <CalendarDays className="size-4 text-prosperity" />
                      {formatRange(s.startDate, s.endDate, locale)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {s.topEntries.map((e) => (
                        <span
                          key={e.rank}
                          className="inline-flex items-center gap-1 rounded-full bg-h-background px-2.5 py-1 text-xs font-bold text-h-foreground ring-1 ring-h-border"
                        >
                          {MEDALS[e.rank - 1]} {e.username}{" "}
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
  const order = [entries[1], entries[0], entries[2]].filter(Boolean);
  const heights = ["h-24", "h-32", "h-20"];

  return (
    <section
      className="animate-card-pop mb-4 rounded-[1.75rem] bg-surface p-4 ring-1 ring-h-border card-depth"
      style={{ animationDelay: "120ms" }}
    >
      <div className="mb-3 flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-h-muted">
        <Crown className="size-3.5 text-lemon" />
        Top 3
      </div>
      <div className="flex items-end justify-center gap-3">
        {order.map((e, i) => (
          <div key={e.userId} className="flex flex-col items-center">
            <div
              className={`mb-2 grid size-12 place-items-center rounded-2xl text-2xl ring-2 ${
                e.rank === 1
                  ? "bg-lemon/20 ring-lemon/50"
                  : e.rank === 2
                    ? "bg-prosperity/15 ring-prosperity/40"
                    : "bg-h-background ring-h-border"
              } ${e.isMe ? "ring-lemon" : ""}`}
            >
              {e.avatar}
            </div>
            <p className="max-w-[4.5rem] truncate text-center text-[11px] font-bold text-h-foreground">
              {e.username}
              {e.isMe && (
                <span className="ml-0.5 text-[9px] text-lemon">({youLabel})</span>
              )}
            </p>
            <p className="mt-0.5 font-display text-xs font-bold text-prosperity">
              {e.xp} XP
            </p>
            {showDuration && (
              <p className="mt-0.5 flex items-center gap-0.5 text-[10px] font-semibold text-h-muted">
                <Clock className="size-2.5 shrink-0" />
                {formatDurationMs(e.durationMs ?? 0)}
              </p>
            )}
            <div
              className={`mt-2 flex w-16 flex-col items-center justify-end rounded-t-xl bg-gradient-to-t from-prosperity/30 to-prosperity/10 ${heights[i]}`}
            >
              <span className="mb-1 text-lg">{MEDALS[e.rank - 1]}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LeaderboardRow({
  entry,
  youLabel,
  levelLabel,
  highlight,
  showDuration,
  delay = "0ms",
}: {
  entry: Entry;
  youLabel: string;
  levelLabel?: string;
  highlight?: boolean;
  showDuration?: boolean;
  delay?: string;
}) {
  const isTop = entry.rank <= 3;

  return (
    <div
      className={`animate-card-pop flex items-center gap-3 rounded-2xl px-4 py-3 ring-1 transition-transform ${
        entry.isMe || highlight
          ? "bg-lemon/10 ring-2 ring-lemon/60 card-depth-sm"
          : isTop
            ? "bg-surface ring-prosperity/20 card-depth-sm"
            : "bg-surface ring-h-border card-depth-sm"
      }`}
      style={{ animationDelay: delay }}
    >
      <span
        className={`grid size-8 shrink-0 place-items-center rounded-xl text-sm font-black ${
          entry.rank === 1
            ? "bg-lemon/20 text-lemon"
            : entry.rank === 2
              ? "bg-prosperity/15 text-prosperity"
              : entry.rank === 3
                ? "bg-h-background text-h-muted"
                : "bg-h-background text-h-muted"
        }`}
      >
        {MEDALS[entry.rank - 1] ?? entry.rank}
      </span>
      <span className="text-2xl">{entry.avatar}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display font-bold text-h-foreground">
          {entry.username}
          {entry.isMe && (
            <span className="ml-2 rounded-full bg-lemon px-2 py-0.5 text-[10px] font-black text-h-background">
              {youLabel}
            </span>
          )}
        </p>
        {levelLabel && (
          <p className="text-xs font-semibold text-h-muted">{levelLabel}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <div className="flex items-center gap-1 font-display font-bold text-prosperity">
          <Star className="size-3.5 fill-prosperity/30 text-prosperity" />
          {entry.xp}
        </div>
        {showDuration && (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-h-muted">
            <Clock className="size-3 shrink-0" />
            {formatDurationMs(entry.durationMs ?? 0)}
          </span>
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
    <p className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-bold text-lemon">
      <Clock className="size-3.5 shrink-0" />
      {remaining ? (
        <>
          <span className="text-h-muted">{endsInLabel}</span>
          <span className="font-mono tabular-nums">{remaining}</span>
        </>
      ) : (
        <span>{endedLabel}</span>
      )}
    </p>
  );
}
