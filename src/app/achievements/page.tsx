"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Award,
  CheckCircle2,
  Clock,
  ExternalLink,
  Gift,
  HelpCircle,
  Sparkles,
  X,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ProfileMenu } from "@/components/ProfileMenu";
import { BottomNav } from "@/components/BottomNav";
import { useMe } from "@/hooks/useMe";
import { AchievementSeasonLabel } from "@/components/AchievementSeasonLabel";
import { AchievementImageButton } from "@/components/AchievementImageButton";

type AchievementItem = {
  id: string;
  type: string;
  title: string;
  description: string;
  emoji: string;
  status: string;
  claimMode: string;
  image: string | null;
  nftTokenId: string | null;
  txHash: string | null;
  explorerUrl: string | null;
  mintedAt: string | null;
  createdAt: string;
  claimable: boolean;
  season: { weekKey: string; startDate: string; endDate: string } | null;
  seasonLabel: string | null;
};

type AchievementsResponse = {
  pendingCount: number;
  achievements: AchievementItem[];
};

export default function AchievementsPage() {
  const { t, locale } = useLocale();
  const { data: meData } = useMe();
  const isAdmin = !!meData?.isAdmin;
  const [data, setData] = useState<AchievementsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nftHelpOpen, setNftHelpOpen] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const r = await fetch(`/api/achievements?locale=${locale}`, {
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
      setData(await r.json());
    } catch {
      setError(t.common.error);
    } finally {
      setLoading(false);
    }
  }, [locale, t.common.error]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!nftHelpOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNftHelpOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nftHelpOpen]);

  async function handleClaim(type: string) {
    setClaiming(type);
    setError(null);
    try {
      const r = await fetch("/api/achievements/claim", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(body.error ?? t.common.error);
        return;
      }
      await load();
    } catch {
      setError(t.common.error);
    } finally {
      setClaiming(null);
    }
  }

  const pending = data?.achievements.filter((a) => a.claimable) ?? [];
  const claimed = data?.achievements.filter(
    (a) => a.status === "claimed" && a.claimMode !== "badge"
  ) ?? [];
  const badges = data?.achievements.filter((a) => a.claimMode === "badge") ?? [];
  const failed = data?.achievements.filter((a) => a.status === "failed") ?? [];

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
            username={meData?.user.username ?? "..."}
            walletAddress={meData?.user.walletAddress ?? ""}
          />
        </div>
      </header>

      <main className="flex-1 px-4 pb-28">
        {loading ? (
          <p className="py-12 text-center text-sm text-h-muted">{t.common.loading}</p>
        ) : error ? (
          <div className="rounded-2xl bg-danger/10 p-4 text-center text-sm text-danger ring-1 ring-danger/20">
            {error}
            <button
              type="button"
              onClick={() => void load()}
              className="mt-3 block w-full font-semibold underline"
            >
              {t.common.retry}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {(data?.pendingCount ?? 0) > 0 && (
              <div className="animate-card-pop rounded-2xl bg-lemon/15 p-4 ring-1 ring-lemon/30">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-display font-bold text-h-foreground">
                      <Sparkles className="size-5 shrink-0 text-lemon" />
                      {t.achievements.newUnlocked}
                    </p>
                    <p className="mt-1 text-sm text-h-muted">
                      {t.achievements.newUnlockedBody}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNftHelpOpen((open) => !open)}
                    className={`grid size-9 shrink-0 place-items-center rounded-xl ring-1 transition-colors active:scale-95 ${
                      nftHelpOpen
                        ? "bg-surface text-h-foreground ring-h-border"
                        : "bg-surface/80 text-h-muted ring-h-border hover:text-h-foreground"
                    }`}
                    aria-label={t.achievements.nftHelpAria}
                    aria-expanded={nftHelpOpen}
                  >
                    <HelpCircle className="size-5" />
                  </button>
                </div>
                {nftHelpOpen && (
                  <article
                    role="dialog"
                    aria-label={t.achievements.nftHelpAria}
                    className="mt-3 overflow-hidden rounded-2xl bg-surface ring-1 ring-h-border"
                  >
                    <div className="relative p-4">
                      <button
                        type="button"
                        onClick={() => setNftHelpOpen(false)}
                        className="absolute right-3 top-3 grid size-8 place-items-center rounded-lg text-h-muted transition-colors hover:bg-h-background hover:text-h-foreground"
                        aria-label={t.achievements.modalClose}
                      >
                        <X className="size-4" />
                      </button>
                      <p className="pr-10 text-sm leading-relaxed text-h-muted">
                        {t.achievements.nftHelpBody}
                      </p>
                    </div>
                  </article>
                )}
              </div>
            )}

            <AchievementSection
              title={t.achievements.available}
              empty={t.achievements.noAvailable}
              items={pending}
              renderAction={(a) => (
                <button
                  type="button"
                  disabled={claiming === a.type}
                  onClick={() => void handleClaim(a.type)}
                  className="btn-chunky flex w-full items-center justify-center gap-2 rounded-xl bg-lemon py-3 font-display text-sm font-bold text-h-background disabled:opacity-60"
                >
                  <Gift className="size-4" />
                  {claiming === a.type
                    ? t.achievements.claiming
                    : t.achievements.claim}
                </button>
              )}
              statusLabel={t.achievements.statusAvailable}
            />

            <AchievementSection
              title={t.achievements.claimed}
              empty={t.achievements.noClaimed}
              items={claimed}
              statusLabel={t.achievements.statusClaimed}
              showExplorer
            />

            {badges.length > 0 && (
              <AchievementSection
                title={t.achievements.badges}
                empty=""
                items={badges}
                statusLabel={t.achievements.statusBadge}
              />
            )}

            {failed.length > 0 && (
              <AchievementSection
                title={t.achievements.failed}
                empty=""
                items={failed}
                statusLabel={t.achievements.statusFailed}
                renderAction={(a) => (
                  <button
                    type="button"
                    disabled={claiming === a.type}
                    onClick={() => void handleClaim(a.type)}
                    className="mt-2 w-full rounded-xl bg-prosperity/15 py-2 text-sm font-semibold text-prosperity ring-1 ring-prosperity/30"
                  >
                    {t.achievements.retryClaim}
                  </button>
                )}
              />
            )}

            <Link
              href="/medals"
              className="block rounded-2xl bg-surface py-3 text-center text-sm font-semibold text-h-muted ring-1 ring-h-border"
            >
              {t.achievements.viewHistory}
            </Link>
          </div>
        )}
      </main>

      <BottomNav variant="perfil" />
    </div>
  );
}

function AchievementSection({
  title,
  empty,
  items,
  statusLabel,
  showExplorer,
  renderAction,
}: {
  title: string;
  empty: string;
  items: AchievementItem[];
  statusLabel: string;
  showExplorer?: boolean;
  renderAction?: (item: AchievementItem) => ReactNode;
}) {
  if (items.length === 0) {
    if (!empty) return null;
    return (
      <section>
        <h2 className="mb-3 font-display text-lg font-bold">{title}</h2>
        <p className="rounded-2xl bg-surface p-4 text-sm text-h-muted ring-1 ring-h-border">
          {empty}
        </p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="mb-3 font-display text-lg font-bold">{title}</h2>
      <div className="space-y-3">
        {items.map((a) => (
          <article
            key={a.id}
            className="overflow-hidden rounded-2xl bg-surface ring-1 ring-h-border"
          >
            <div className="flex gap-3 p-4">
              <AchievementImageButton
                image={a.image}
                emoji={a.emoji}
                title={a.title}
                description={a.description}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold">{a.title}</p>
                <p className="mt-0.5 text-xs text-h-muted">{a.description}</p>
                {a.seasonLabel && <AchievementSeasonLabel label={a.seasonLabel} />}
                <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-prosperity">
                  {statusLabel}
                </p>
                {a.mintedAt && (
                  <p className="mt-1 flex items-center gap-1 text-[10px] text-h-muted">
                    <Clock className="size-3" />
                    {new Date(a.mintedAt).toLocaleDateString()}
                  </p>
                )}
                {showExplorer && a.explorerUrl && (
                  <a
                    href={a.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-prosperity"
                  >
                    <ExternalLink className="size-3" />
                    CeloScan
                  </a>
                )}
                {a.status === "claimed" && a.nftTokenId && (
                  <p className="mt-1 flex items-center gap-1 text-[10px] text-h-muted">
                    <CheckCircle2 className="size-3 text-prosperity" />
                    NFT #{a.nftTokenId}
                  </p>
                )}
              </div>
            </div>
            {renderAction && (
              <div className="border-t border-h-border px-4 py-3">
                {renderAction(a)}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
