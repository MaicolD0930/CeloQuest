"use client";

import { ExternalLink } from "lucide-react";

export type AdminContractAddress = {
  label: string;
  address: string | null;
  explorerUrl: string | null;
};

type Props = {
  title: string;
  network: string;
  addresses: AdminContractAddress[];
  labels: {
    network: string;
    none: string;
    viewExplorer: string;
  };
};

function shortAddress(address: string) {
  return `${address.slice(0, 8)}…${address.slice(-6)}`;
}

export function AdminContractPanel({
  title,
  network,
  addresses,
  labels,
}: Props) {
  return (
    <div className="rounded-2xl bg-surface p-4 ring-1 ring-h-border card-depth-sm">
      <h3 className="font-display text-base font-extrabold text-h-foreground">
        {title}
      </h3>

      <div className="mt-3">
        <p className="text-xs font-bold uppercase text-h-muted">
          {labels.network}
        </p>
        <p className="mt-0.5 font-bold capitalize text-h-foreground">{network}</p>
      </div>

      <dl className="mt-4 space-y-4">
        {addresses.map(({ label, address, explorerUrl }) => (
          <div key={label}>
            <dt className="text-xs font-bold uppercase text-h-muted">{label}</dt>
            <dd className="mt-1">
              {address ? (
                <div className="space-y-2">
                  <p
                    className="break-all font-mono text-xs text-h-foreground"
                    title={address}
                  >
                    {shortAddress(address)}
                  </p>
                  {explorerUrl ? (
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-h-background/80 px-3 py-2 text-xs font-extrabold text-prosperity ring-1 ring-prosperity/25 transition-colors hover:bg-prosperity/10"
                    >
                      {labels.viewExplorer}
                      <ExternalLink className="size-3.5" />
                    </a>
                  ) : null}
                </div>
              ) : (
                <span className="text-sm text-h-muted">{labels.none}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
