"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";

type Props = {
  token: "tCOPM" | "USDC";
  title: string;
  walletLabel: string;
  amountLabel: string;
  sendLabel: string;
  confirmTemplate: (amount: string, wallet: string) => string;
  sendingLabel: string;
  successLabel: string;
  viewExplorerLabel: string;
};

function shortHash(hash: string) {
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`;
}

export function AdminTokenSendForm({
  token,
  title,
  walletLabel,
  amountLabel,
  sendLabel,
  confirmTemplate,
  sendingLabel,
  successLabel,
  viewExplorerLabel,
}: Props) {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [explorerTxUrl, setExplorerTxUrl] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setTxHash(null);
    setExplorerTxUrl(null);

    if (!to.trim() || !amount.trim()) {
      setError("Completa todos los campos");
      return;
    }

    const confirmed = window.confirm(confirmTemplate(amount.trim(), to.trim()));
    if (!confirmed) return;

    setPending(true);
    try {
      const res = await fetch("/api/admin/send-token", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, to: to.trim(), amount: amount.trim() }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        txHash?: string;
        explorerTxUrl?: string;
        error?: string;
      };

      if (!res.ok) {
        setError(data.error ?? "Error al enviar");
        return;
      }

      setTxHash(data.txHash ?? null);
      setExplorerTxUrl(data.explorerTxUrl ?? null);
      setTo("");
      setAmount("");
    } catch {
      setError("Error de red");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-2xl bg-surface p-4 ring-1 ring-h-border card-depth-sm">
      <h3 className="font-display text-base font-extrabold text-h-foreground">
        {title}
      </h3>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <label className="block">
          <span className="text-xs font-bold text-h-muted">{walletLabel}</span>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="0x..."
            className="mt-1 w-full rounded-xl border border-h-border bg-h-background px-3 py-2.5 font-mono text-sm text-h-foreground outline-none ring-prosperity/40 focus:ring-2"
            autoComplete="off"
            spellCheck={false}
          />
        </label>

        <label className="block">
          <span className="text-xs font-bold text-h-muted">{amountLabel}</span>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="mt-1 w-full rounded-xl border border-h-border bg-h-background px-3 py-2.5 text-sm text-h-foreground outline-none ring-prosperity/40 focus:ring-2"
          />
        </label>

        {error ? (
          <p className="text-sm font-bold text-danger">{error}</p>
        ) : null}

        {txHash ? (
          <div className="rounded-xl bg-h-background/60 p-3 ring-1 ring-h-border/60">
            <p className="text-xs font-bold text-h-muted">{successLabel}</p>
            <p className="mt-1 font-mono text-xs text-prosperity">
              {shortHash(txHash)}
            </p>
            {explorerTxUrl ? (
              <a
                href={explorerTxUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-prosperity/15 py-2.5 text-xs font-extrabold text-prosperity ring-1 ring-prosperity/30 transition-colors hover:bg-prosperity/25"
              >
                {viewExplorerLabel}
                <ExternalLink className="size-3.5" />
              </a>
            ) : null}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="btn-chunky w-full rounded-xl bg-prosperity px-4 py-3 text-sm font-extrabold text-h-background disabled:opacity-50"
        >
          {pending ? sendingLabel : sendLabel}
        </button>
      </form>
    </div>
  );
}
