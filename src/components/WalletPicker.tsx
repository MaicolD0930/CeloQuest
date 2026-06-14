"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import {
  discoverWalletProviders,
  getWalletInstallUrl,
  type WalletOption,
  type WalletProviderId,
} from "@/lib/wallet-providers";

type Labels = {
  chooseWallet: string;
  notInstalled: string;
  install: string;
};

type Props = {
  selected: WalletProviderId | null;
  onSelect: (id: WalletProviderId) => void;
  labels: Labels;
  disabled?: boolean;
  /** Hide MiniPay when only MetaMask/Rabby are requested */
  hideMiniPay?: boolean;
};

const WALLET_ICONS: Record<WalletProviderId, string> = {
  metamask: "🦊",
  rabby: "🐰",
  minipay: "📱",
};

export function WalletPicker({
  selected,
  onSelect,
  labels,
  disabled = false,
  hideMiniPay = false,
}: Props) {
  const [options, setOptions] = useState<WalletOption[]>([]);

  useEffect(() => {
    const refresh = () => setOptions(discoverWalletProviders());
    refresh();
    const timer = window.setTimeout(refresh, 300);
    return () => window.clearTimeout(timer);
  }, []);

  const visible = hideMiniPay
    ? options.filter((o) => o.id !== "minipay")
    : options;

  if (visible.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <WalletButton
          id="metamask"
          name="MetaMask"
          icon={WALLET_ICONS.metamask}
          installed={false}
          selected={selected === "metamask"}
          disabled={disabled}
          installLabel={labels.install}
          onSelect={onSelect}
        />
        <WalletButton
          id="rabby"
          name="Rabby"
          icon={WALLET_ICONS.rabby}
          installed={false}
          selected={selected === "rabby"}
          disabled={disabled}
          installLabel={labels.install}
          onSelect={onSelect}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-center text-xs font-bold uppercase tracking-wide text-h-muted">
        {labels.chooseWallet}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {visible.map((opt) => (
          <WalletButton
            key={opt.id}
            id={opt.id}
            name={opt.name}
            icon={WALLET_ICONS[opt.id]}
            installed={opt.installed}
            selected={selected === opt.id}
            disabled={disabled}
            installLabel={labels.install}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

function WalletButton({
  id,
  name,
  icon,
  installed,
  selected,
  disabled,
  installLabel,
  onSelect,
}: {
  id: WalletProviderId;
  name: string;
  icon: string;
  installed: boolean;
  selected: boolean;
  disabled: boolean;
  installLabel: string;
  onSelect: (id: WalletProviderId) => void;
}) {
  if (!installed) {
    return (
      <a
        href={getWalletInstallUrl(id)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center gap-1.5 rounded-2xl bg-h-background px-3 py-4 ring-1 ring-h-border opacity-70 transition-opacity hover:opacity-100"
      >
        <span className="text-2xl">{icon}</span>
        <span className="font-display text-sm font-bold text-h-muted">{name}</span>
        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-prosperity">
          {installLabel}
          <ExternalLink className="size-2.5" />
        </span>
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(id)}
      className={`flex flex-col items-center gap-1.5 rounded-2xl px-3 py-4 transition-all active:scale-[0.98] disabled:opacity-50 ${
        selected
          ? "bg-lemon/20 ring-2 ring-lemon card-depth-sm"
          : "bg-h-background ring-1 ring-h-border hover:ring-prosperity/40"
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="font-display text-sm font-bold text-h-foreground">{name}</span>
      {selected && <span className="text-[10px] font-bold text-lemon">✓</span>}
    </button>
  );
}
