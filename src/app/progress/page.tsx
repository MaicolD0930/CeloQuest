"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  Flame,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { BottomNav } from "@/components/BottomNav";
import { CategoryBadge } from "@/components/CategoryBadge";
import { ProgressPageSkeleton } from "@/components/skeletons/PageSkeletons";
import { ProfileMenu } from "@/components/ProfileMenu";
import { useMe } from "@/hooks/useMe";
import { resolveAchievementDisplay } from "@/lib/achievements/catalog";
import { AchievementImageButton } from "@/components/AchievementImageButton";
import type { QuestionCategory } from "@/lib/questions/categories";

type ProgressResponse = {
  user: {
    username: string;
    avatar: string;
    xpTotal: number;
    streak: number;
    walletAddress: string;
  };
  level: {
    level: number;
    emoji: string;
    name: string;
    minXp: number;
    nextLevelXp: number | null;
    progress: number;
    xpInTier: number;
    xpNeededForNext: number | null;
    nextTierName: string | null;
  };
  stats: {
    completedChallenges: number;
    masteredCategories: QuestionCategory[];
    categoryMastery: {
      category: QuestionCategory;
      answered: number;
      correct: number;
      mastery: number;
    }[];
  };
  achievements: {
    id: string;
    type: string;
    title: string;
    description: string;
    emoji: string;
    claimable: boolean;
    createdAt: string;
  }[];
};

export default function ProgressPage() {
  const { t, locale } = useLocale();
  const { data: meData } = useMe();
  const isAdmin = !!meData?.isAdmin;
  const [data, setData] = useState<ProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const progressRes = await fetch(`/api/users/progress?locale=${locale}`, {
        credentials: "include",
      });
      if (progressRes.status === 401) {
        window.location.assign("/connect");
        return;
      }
      if (!progressRes.ok) {
        setError(t.common.error);
        return;
      }
      setData(await progressRes.json());
    } catch {
      setError(t.common.error);
    } finally {
      setLoading(false);
    }
  }, [locale, t.common.error]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <>
        <ProgressPageSkeleton />
        <BottomNav variant="perfil" />
      </>
    );
  }

  if (error || !data) {
    return (
      <main className="home-perfil flex flex-1 flex-col items-center justify-center gap-4 px-4">
        <p className="text-center font-bold text-danger">{error ?? t.common.error}</p>
        <button
          type="button"
          onClick={load}
          className="rounded-2xl bg-lemon px-6 py-3 font-bold text-h-background"
        >
          {t.common.retry}
        </button>
      </main>
    );
  }

  const { user, level, stats, achievements } = data;
  const progressPct = Math.round(level.progress * 100);

  return (
    <>
      <main className="home-perfil flex min-h-dvh flex-1 flex-col px-4 pb-24 safe-top-sm">
        <header className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-h-muted">
              {t.progress.subtitle}
            </p>
            <h1 className="font-display text-2xl font-bold">{t.progress.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle variant="perfil" />
            <ProfileMenu
              username={user.username}
              walletAddress={user.walletAddress}
              isAdmin={isAdmin}
              variant="perfil"
            />
          </div>
        </header>

        <section className="animate-card-pop rounded-3xl bg-surface p-5 ring-1 ring-h-border card-depth">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{level.emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-h-muted">
                {t.home.level} {level.level}
              </p>
              <h2 className="font-display text-xl font-bold">{level.name}</h2>
            </div>
            <div className="text-right">
              <p className="text-xs text-h-muted">{t.home.xp}</p>
              <p className="font-display text-lg font-bold text-lemon">
                {user.xpTotal}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-h-background ring-1 ring-h-border">
              <div
                className="h-full rounded-full bg-gradient-to-r from-prosperity to-lemon"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-h-muted">
              {level.nextLevelXp ? (
                <>
                  <span className="font-semibold text-h-foreground">
                    {user.xpTotal}
                  </span>{" "}
                  / {level.nextLevelXp} {t.home.xpToNext}
                  {level.nextTierName && (
                    <>
                      {" "}
                      · {t.progress.nextTier}:{" "}
                      <span className="text-prosperity">{level.nextTierName}</span>
                    </>
                  )}
                </>
              ) : (
                t.home.maxLevel
              )}
            </p>
          </div>
        </section>

        <section className="mt-4 grid grid-cols-3 gap-2">
          <MiniStat
            icon={<Star className="size-4 fill-lemon text-lemon" />}
            value={`${user.xpTotal}`}
            label={t.home.xp}
          />
          <MiniStat
            icon={<Flame className="size-4 fill-flame text-flame" />}
            value={`${user.streak}`}
            label={t.home.streak}
          />
          <MiniStat
            icon={<BookOpen className="size-4 text-prosperity" />}
            value={`${stats.completedChallenges}`}
            label={t.progress.challengesDone}
          />
        </section>

        <section className="mt-6">
          <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
            <TrendingUp className="size-5 text-prosperity" />
            {t.progress.categoriesTitle}
          </h3>
          {stats.categoryMastery.length === 0 ? (
            <p className="rounded-2xl bg-surface p-4 text-sm text-h-muted ring-1 ring-h-border">
              {t.progress.categoriesEmpty}
            </p>
          ) : (
            <div className="space-y-2">
              {stats.categoryMastery.map((m) => {
                const pct = Math.round(m.mastery * 100);
                const mastered = stats.masteredCategories.includes(m.category);
                return (
                  <div
                    key={m.category}
                    className="rounded-2xl bg-surface p-3 ring-1 ring-h-border"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <CategoryBadge category={m.category} />
                      <span className="text-xs font-bold text-h-muted">
                        {pct}% · {m.correct}/{m.answered}
                        {mastered && (
                          <span className="ml-1 text-prosperity">
                            ✓ {t.progress.mastered}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-h-background">
                      <div
                        className={`h-full rounded-full ${
                          mastered ? "bg-prosperity" : "bg-lemon/70"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-6">
          <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
            <Award className="size-5 text-lemon" />
            {t.progress.achievementsTitle}
          </h3>
          {achievements.length === 0 ? (
            <p className="rounded-2xl bg-surface p-4 text-sm text-h-muted ring-1 ring-h-border">
              {t.progress.achievementsEmpty}
            </p>
          ) : (
            <div className="space-y-2">
              {achievements.map((a) => {
                const display = resolveAchievementDisplay(a.type, locale, {
                  title: a.title,
                  description: a.description,
                  emoji: a.emoji,
                });
                return (
                <div
                  key={a.id}
                  className="flex items-start gap-3 rounded-2xl bg-surface p-3 ring-1 ring-h-border"
                >
                  <AchievementImageButton
                    image={display.image}
                    emoji={display.emoji}
                    title={display.title}
                    description={display.description}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{display.title}</p>
                    <p className="text-xs text-h-muted">{display.description}</p>
                  </div>
                  {a.claimable && (
                    <Link
                      href="/achievements"
                      className="shrink-0 rounded-full bg-lemon/20 px-2 py-0.5 text-[10px] font-bold uppercase text-lemon"
                    >
                      {t.progress.claimNft}
                    </Link>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-2xl bg-prosperity/10 p-4 ring-1 ring-prosperity/20">
          <p className="flex items-center gap-2 text-sm font-semibold text-prosperity">
            <Sparkles className="size-4" />
            {t.progress.tipTitle}
          </p>
          <p className="mt-1 text-xs text-h-muted">{t.progress.tipBody}</p>
        </section>

        <div className="mt-6 text-center">
          <Link
            href="/challenge"
            className="inline-flex items-center gap-2 rounded-2xl bg-lemon px-6 py-3 font-bold text-h-background"
          >
            {t.home.playNow}
          </Link>
        </div>
      </main>
      <BottomNav variant="perfil" />
    </>
  );
}

function MiniStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl bg-surface p-3 text-center ring-1 ring-h-border">
      <div className="mb-1 flex justify-center">{icon}</div>
      <p className="font-display text-lg font-bold">{value}</p>
      <p className="text-[10px] font-medium text-h-muted">{label}</p>
    </div>
  );
}
