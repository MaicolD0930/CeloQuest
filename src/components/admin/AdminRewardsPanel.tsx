"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Loader2, Trophy } from "lucide-react";

export type AdminSeasonHistory = {
  seasonId: string;
  weekKey: string;
  status: string;
  finalizedAt: string | null;
  rewardPaid: boolean;
  rewardWinnerWallet: string | null;
  rewardAmount: string | null;
  rewardTxHash: string | null;
  rewardPaidAt: string | null;
  winnerUsername: string | null;
  explorerTxUrl: string | null;
};

export type AdminRewardStatus = {
  seasonId: string;
  weekKey: string;
  status: string;
  rewardPaid: boolean;
  rewardTxHash: string | null;
  rewardPaidAt: string | null;
  winner: {
    userId: string;
    username: string;
    walletAddress: string;
  } | null;
  prizeAmount: string;
  prizeSymbol: string;
  contractAddress: string | null;
  contractPaid: boolean | null;
  explorerTxUrl: string | null;
  history?: AdminSeasonHistory[];
};

type Labels = {
  title: string;
  currentSeason: string;
  winner: string;
  wallet: string;
  prize: string;
  noWinner: string;
  paid: string;
  pending: string;
  forcePay: string;
  paying: string;
  paidSuccess: string;
  viewTx: string;
  historyTitle: string;
  historyEmpty: string;
  errorGeneric: string;
  errors: Record<string, string>;
};

type Props = {
  labels: Labels;
};

function shortWallet(wallet: string) {
  return `${wallet.slice(0, 6)}…${wallet.slice(-4)}`;
}

export function AdminRewardsPanel({ labels }: Props) {
  const [data, setData] = useState<AdminRewardStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/rewards", { credentials: "include" });
      if (!res.ok) {
        setError(labels.errorGeneric);
        setData(null);
        return;
      }
      setData((await res.json()) as AdminRewardStatus);
    } catch {
      setError(labels.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, [labels.errorGeneric]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleForcePay() {
    if (!data || paying) return;
    setPaying(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/rewards/finalize", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seasonId: data.seasonId }),
      });

      const body = (await res.json()) as {
        ok?: boolean;
        error?: string;
        txHash?: string;
        explorerTxUrl?: string;
      };

      if (!res.ok) {
        setError(
          labels.errors[body.error ?? ""] ?? labels.errorGeneric
        );
        return;
      }

      setSuccess(body.txHash ?? labels.paidSuccess);
      await load();
    } catch {
      setError(labels.errorGeneric);
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="rounded-2xl bg-surface p-4 ring-1 ring-h-border card-depth-sm">
      <div className="flex items-center gap-2">
        <Trophy className="size-5 text-lemon" />
        <h3 className="font-display text-base font-extrabold text-h-foreground">
          {labels.title}
        </h3>
      </div>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-h-muted">
          <Loader2 className="size-4 animate-spin" />
        </div>
      ) : data ? (
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-xs font-bold uppercase text-h-muted">
              {labels.currentSeason}
            </dt>
            <dd className="mt-0.5 font-extrabold text-h-foreground">
              {data.weekKey}
              <span className="ml-2 text-xs font-semibold text-h-muted">
                ({data.status})
              </span>
            </dd>
          </div>

          <div>
            <dt className="text-xs font-bold uppercase text-h-muted">
              {labels.winner}
            </dt>
            <dd className="mt-0.5 font-extrabold text-h-foreground">
              {data.winner?.username ?? labels.noWinner}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-bold uppercase text-h-muted">
              {labels.wallet}
            </dt>
            <dd className="mt-0.5 font-mono text-xs text-prosperity">
              {data.winner
                ? shortWallet(data.winner.walletAddress)
                : labels.noWinner}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-bold uppercase text-h-muted">
              {labels.prize}
            </dt>
            <dd className="mt-0.5 font-display text-lg font-extrabold text-lemon">
              {Number(data.prizeAmount).toLocaleString()} {data.prizeSymbol}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-bold uppercase text-h-muted">Status</dt>
            <dd className="mt-0.5 font-extrabold text-h-foreground">
              {data.rewardPaid || data.contractPaid
                ? labels.paid
                : labels.pending}
            </dd>
          </div>

          {data.explorerTxUrl ? (
            <a
              href={data.explorerTxUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-prosperity"
            >
              {labels.viewTx}
              <ExternalLink className="size-3.5" />
            </a>
          ) : null}
        </dl>
      ) : null}

      {error ? (
        <p className="mt-3 text-xs font-bold text-danger">{error}</p>
      ) : null}
      {success ? (
        <p className="mt-3 break-all text-xs font-bold text-prosperity">
          {labels.paidSuccess}: {success.slice(0, 18)}…
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => void handleForcePay()}
        disabled={
          paying ||
          loading ||
          !data ||
          data.rewardPaid === true ||
          data.contractPaid === true ||
          !data.winner
        }
        className="btn-chunky mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-lemon py-3.5 font-display text-sm font-bold text-h-background disabled:cursor-not-allowed disabled:opacity-50"
      >
        {paying ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {labels.paying}
          </>
        ) : (
          labels.forcePay
        )}
      </button>

      {data?.history && data.history.length > 0 ? (
        <div className="mt-6 border-t border-h-border pt-4">
          <h4 className="text-xs font-bold uppercase text-h-muted">
            {labels.historyTitle}
          </h4>
          <ul className="mt-3 space-y-3">
            {data.history.map((s) => (
              <li
                key={s.seasonId}
                className="rounded-xl bg-h-background/50 p-3 text-xs ring-1 ring-h-border"
              >
                <div className="font-extrabold text-h-foreground">
                  {s.weekKey}
                  <span className="ml-2 font-semibold text-h-muted">
                    ({s.status})
                  </span>
                </div>
                <div className="mt-1 flex min-w-0 items-center justify-between gap-2">
                  <span className="shrink-0 text-h-muted">{labels.winner}:</span>
                  {s.rewardWinnerWallet ? (
                    <div className="flex min-w-0 items-center justify-end gap-2">
                      <span
                        className="truncate font-mono font-bold text-prosperity"
                        title={s.rewardWinnerWallet}
                      >
                        {shortWallet(s.rewardWinnerWallet)}
                      </span>
                      {s.winnerUsername ? (
                        <span
                          className="shrink-0 font-bold text-h-foreground"
                          title={s.winnerUsername}
                        >
                          {s.winnerUsername}
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <span className="font-bold text-h-foreground">
                      {labels.noWinner}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-h-muted">
                  {labels.prize}:{" "}
                  <span className="font-bold text-lemon">
                    {s.rewardAmount
                      ? `${Number(s.rewardAmount).toLocaleString()} USDC`
                      : "—"}
                  </span>
                  {" · "}
                  {s.rewardPaid ? labels.paid : labels.pending}
                </div>
                {s.explorerTxUrl ? (
                  <a
                    href={s.explorerTxUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-prosperity/15 py-2 text-xs font-extrabold text-prosperity ring-1 ring-prosperity/30 transition-colors hover:bg-prosperity/25"
                  >
                    {labels.viewTx}
                    <ExternalLink className="size-3.5" />
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : data && !loading ? (
        <p className="mt-4 text-xs text-h-muted">{labels.historyEmpty}</p>
      ) : null}
    </div>
  );
}
