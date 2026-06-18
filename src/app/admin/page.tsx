"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { LoadingOctopus } from "@/components/LoadingOctopus";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { AdminTokenSendForm } from "@/components/admin/AdminTokenSendForm";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { AdminContractPanel } from "@/components/admin/AdminContractPanel";
import { AdminRecentPayments } from "@/components/admin/AdminRecentPayments";
import { AdminRewardsPanel } from "@/components/admin/AdminRewardsPanel";
import { AdminFutureSection } from "@/components/admin/AdminFutureSection";
import type { RecoveryTokenId } from "@/lib/tokens/recovery";

type AdminStats = {
  users: {
    total: number;
    active: number;
    newThisWeek: number;
    weekKey: string;
  };
  economy: {
    paymentCount: number;
    totalCopm: string;
    totalUsdc: string;
    copmSymbol: string;
    recentPayments: Array<{
      txHash: string;
      tokenSymbol: string;
      amount: string;
      userWallet: string;
      username: string | null;
      createdAt: string;
      explorerTxUrl: string;
    }>;
  };
  tokens: {
    copmId: RecoveryTokenId;
    copmSymbol: string;
    usdcSymbol: string;
  };
  contract: {
    network: string;
    addresses: Array<{
      key: "recoveryContract" | "rewardsContract" | "copmToken" | "usdcToken" | "treasury";
      address: string | null;
      symbol?: string;
      explorerUrl: string | null;
    }>;
    recentTxHashes: string[];
  };
  usersTable: Array<{
    wallet: string;
    username: string;
    xpTotal: number;
    rank: number;
    lastActivity: string;
  }>;
};

export default function AdminPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const contractLabelByKey = {
    recoveryContract: t.admin.recoveryContract,
    rewardsContract: t.admin.rewardsContract,
    copmToken: (symbol: string) => `${symbol} Token`,
    usdcToken: `${t.admin.usdcToken} Token`,
    treasury: t.admin.treasury,
  };

  const loadStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError(null);

    try {
      const meRes = await fetch("/api/users/me", { credentials: "include" });
      if (!meRes.ok) {
        router.replace("/connect");
        return;
      }

      const me = (await meRes.json()) as { isAdmin?: boolean };
      if (!me.isAdmin) {
        router.replace("/home");
        return;
      }

      const statsRes = await fetch("/api/admin/stats", {
        credentials: "include",
      });

      if (statsRes.status === 403) {
        router.replace("/home");
        return;
      }

      if (!statsRes.ok) {
        setError(t.admin.loadError);
        return;
      }

      setStats((await statsRes.json()) as AdminStats);
    } catch {
      setError(t.admin.loadError);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router, t.admin.loadError]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  if (loading) {
    return (
      <div className="home-perfil flex min-h-dvh items-center justify-center safe-top safe-bottom">
        <LoadingOctopus />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="home-perfil flex min-h-dvh flex-col items-center justify-center gap-4 px-4 safe-top safe-bottom">
        <p className="text-center font-bold text-danger">{error ?? t.admin.loadError}</p>
        <Link href="/home" className="text-sm font-extrabold text-prosperity">
          {t.admin.backHome}
        </Link>
      </div>
    );
  }

  return (
    <div className="home-perfil min-h-dvh safe-top safe-bottom">
      <main className="mx-auto flex max-w-md flex-col gap-5 px-4 pb-10 pt-4">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link
              href="/home"
              className="grid size-9 place-items-center rounded-xl bg-surface text-h-foreground ring-1 ring-h-border"
              aria-label={t.admin.backHome}
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <h1 className="font-display text-xl font-extrabold text-h-foreground">
                {t.admin.title}
              </h1>
              <p className="text-xs text-h-muted">{t.admin.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => loadStats(true)}
            disabled={refreshing}
            className="grid size-9 place-items-center rounded-xl bg-surface text-h-foreground ring-1 ring-h-border disabled:opacity-50"
            aria-label={t.admin.refresh}
          >
            <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </header>

        <section>
          <h2 className="mb-3 font-display text-sm font-extrabold uppercase tracking-wide text-h-muted">
            {t.admin.usersSection}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <AdminStatCard
              label={t.admin.totalUsers}
              value={stats.users.total}
              icon="👥"
            />
            <AdminStatCard
              label={t.admin.activeUsers}
              value={stats.users.active}
              hint={t.admin.activeHint}
              icon="⚡"
            />
            <AdminStatCard
              label={t.admin.newThisWeek}
              value={stats.users.newThisWeek}
              hint={stats.users.weekKey}
              icon="🆕"
            />
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-display text-sm font-extrabold uppercase tracking-wide text-h-muted">
            {t.admin.economySection}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <AdminStatCard
              label={t.admin.paymentCount}
              value={stats.economy.paymentCount}
              hint={t.admin.paymentCountHint}
              icon="💳"
            />
            <AdminStatCard
              label={stats.economy.copmSymbol}
              value={Number(stats.economy.totalCopm).toLocaleString(undefined, {
                maximumFractionDigits: 4,
              })}
              hint={t.admin.totalCopmHint}
              icon="🇨🇴"
            />
            <AdminStatCard
              label={t.admin.totalUsdc}
              value={Number(stats.economy.totalUsdc).toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
              hint={t.admin.totalUsdcHint}
              icon="💵"
            />
          </div>

          <div className="mt-3">
            <AdminRecentPayments
              title={t.admin.recentTx}
              payments={stats.economy.recentPayments}
              emptyLabel={t.admin.noTransactions}
              labels={{
                wallet: t.admin.paymentWallet,
                date: t.admin.paymentDate,
                viewExplorer: `${t.admin.viewOnCeloScan} ↗`,
                prevPage: t.admin.paymentsPrev,
                nextPage: t.admin.paymentsNext,
                pageOf: t.admin.paymentsPage,
              }}
            />
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-display text-sm font-extrabold uppercase tracking-wide text-h-muted">
            {t.admin.rewardsSection}
          </h2>
          <AdminRewardsPanel
            labels={{
              title: t.admin.rewardsTitle,
              currentSeason: t.admin.rewardsCurrentSeason,
              winner: t.admin.rewardsWinner,
              wallet: t.admin.rewardsWallet,
              prize: t.admin.rewardsPrize,
              noWinner: t.admin.rewardsNoWinner,
              paid: t.admin.rewardsPaid,
              pending: t.admin.rewardsPending,
              forcePay: t.admin.rewardsForcePay,
              paying: t.admin.rewardsPaying,
              paidSuccess: t.admin.rewardsPaidSuccess,
              viewTx: t.admin.rewardsViewTx,
              historyTitle: t.admin.rewardsHistoryTitle,
              historyEmpty: t.admin.rewardsHistoryEmpty,
              errorGeneric: t.admin.rewardsErrorGeneric,
              errors: t.admin.rewardsErrors,
            }}
          />
        </section>

        <section>
          <h2 className="mb-3 font-display text-sm font-extrabold uppercase tracking-wide text-h-muted">
            {t.admin.tokensSection}
          </h2>
          <div className="grid grid-cols-1 gap-3">
            <AdminTokenSendForm
              token={stats.tokens.copmId}
              title={t.admin.sendCopm.replace(
                "{symbol}",
                stats.tokens.copmSymbol
              )}
              walletLabel={t.admin.recipientWallet}
              amountLabel={t.admin.amount}
              sendLabel={t.admin.send}
              sendingLabel={t.admin.sending}
              successLabel={t.admin.sent}
              viewExplorerLabel={`${t.admin.viewOnCeloScan} ↗`}
              confirmTemplate={t.admin.confirmSend}
            />
            <AdminTokenSendForm
              token="USDC"
              title={t.admin.sendUsdc}
              walletLabel={t.admin.recipientWallet}
              amountLabel={t.admin.amount}
              sendLabel={t.admin.send}
              sendingLabel={t.admin.sending}
              successLabel={t.admin.sent}
              viewExplorerLabel={`${t.admin.viewOnCeloScan} ↗`}
              confirmTemplate={t.admin.confirmSend}
            />
          </div>
        </section>

        <AdminContractPanel
          title={t.admin.contractSection}
          network={stats.contract.network}
          addresses={stats.contract.addresses.map((entry) => ({
            label:
              entry.key === "copmToken"
                ? contractLabelByKey.copmToken(
                    entry.symbol ?? stats.tokens.copmSymbol
                  )
                : contractLabelByKey[entry.key],
            address: entry.address,
            explorerUrl: entry.explorerUrl,
          }))}
          labels={{
            network: t.admin.network,
            none: t.admin.none,
            viewExplorer: `${t.admin.viewOnCeloScan} ↗`,
          }}
        />

        <AdminUsersTable
          users={stats.usersTable}
          title={t.admin.usersTable}
          columns={{
            wallet: t.admin.colWallet,
            username: t.admin.colUsername,
            xp: t.admin.colXp,
            rank: t.admin.colRank,
            activity: t.admin.colActivity,
          }}
        />

        <AdminFutureSection
          title={t.admin.futureTitle}
          hint={t.admin.futureHint}
          items={t.admin.futureItems}
        />
      </main>
    </div>
  );
}
