"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { formatPaymentTokenLabel } from "@/lib/payments/record-payment";

const PAGE_SIZE = 3;

export type AdminPaymentRow = {
  txHash: string;
  tokenSymbol: string;
  amount: string;
  userWallet: string;
  username: string | null;
  createdAt: string;
  explorerTxUrl: string;
};

type Props = {
  title: string;
  payments: AdminPaymentRow[];
  emptyLabel: string;
  labels: {
    wallet: string;
    date: string;
    viewExplorer: string;
    prevPage: string;
    nextPage: string;
    pageOf: string;
  };
};

function shortWallet(wallet: string) {
  return `${wallet.slice(0, 6)}…${wallet.slice(-4)}`;
}

function shortHash(hash: string) {
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function AdminRecentPayments({ title, payments, emptyLabel, labels }: Props) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(payments.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const visible = payments.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE
  );

  useEffect(() => {
    setPage(0);
  }, [payments.length]);

  useEffect(() => {
    if (page > totalPages - 1) {
      setPage(Math.max(0, totalPages - 1));
    }
  }, [page, totalPages]);

  return (
    <div className="rounded-2xl bg-surface p-4 ring-1 ring-h-border card-depth-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-sm font-extrabold text-h-foreground">
          {title}
        </h3>
        {payments.length > PAGE_SIZE ? (
          <p className="text-xs font-bold text-h-muted">
            {labels.pageOf
              .replace("{current}", String(safePage + 1))
              .replace("{total}", String(totalPages))}
          </p>
        ) : null}
      </div>

      <div className="mt-3 space-y-3">
        {payments.length === 0 ? (
          <p className="text-sm text-h-muted">{emptyLabel}</p>
        ) : (
          visible.map((payment) => (
            <PaymentCard key={payment.txHash} payment={payment} labels={labels} />
          ))
        )}
      </div>

      {payments.length > PAGE_SIZE ? (
        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-h-background/80 py-2.5 text-xs font-extrabold text-h-foreground ring-1 ring-h-border transition-colors hover:bg-h-background disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="size-4" />
            {labels.prevPage}
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage >= totalPages - 1}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-h-background/80 py-2.5 text-xs font-extrabold text-h-foreground ring-1 ring-h-border transition-colors hover:bg-h-background disabled:cursor-not-allowed disabled:opacity-40"
          >
            {labels.nextPage}
            <ChevronRight className="size-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function PaymentCard({
  payment,
  labels,
}: {
  payment: AdminPaymentRow;
  labels: Props["labels"];
}) {
  return (
    <div className="rounded-xl bg-h-background/60 p-3 ring-1 ring-h-border/60">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <p className="min-w-0 flex-1 truncate font-display text-base font-extrabold text-h-foreground">
          {payment.amount}{" "}
          <span className="text-prosperity">
            {formatPaymentTokenLabel(payment.tokenSymbol)}
          </span>
        </p>
        {payment.username ? (
          <p
            className="max-w-[42%] shrink-0 truncate text-right text-sm font-extrabold text-h-foreground"
            title={payment.username}
          >
            {payment.username}
          </p>
        ) : null}
      </div>

      <dl className="mt-2 space-y-1 text-xs">
        <div className="flex min-w-0 justify-between gap-2">
          <dt className="shrink-0 text-h-muted">{labels.wallet}</dt>
          <dd className="truncate font-mono font-semibold text-h-foreground">
            {shortWallet(payment.userWallet)}
          </dd>
        </div>
        <div className="flex min-w-0 justify-between gap-2">
          <dt className="shrink-0 text-h-muted">{labels.date}</dt>
          <dd className="truncate text-right text-h-foreground">
            {formatDate(payment.createdAt)}
          </dd>
        </div>
        <div className="flex min-w-0 justify-between gap-2">
          <dt className="shrink-0 text-h-muted">tx</dt>
          <dd className="truncate font-mono text-prosperity">
            {shortHash(payment.txHash)}
          </dd>
        </div>
      </dl>

      <a
        href={payment.explorerTxUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-prosperity/15 py-2.5 text-xs font-extrabold text-prosperity ring-1 ring-prosperity/30 transition-colors hover:bg-prosperity/25"
      >
        {labels.viewExplorer}
        <ExternalLink className="size-3.5" />
      </a>
    </div>
  );
}
