"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { WalletPicker } from "@/components/WalletPicker";
import { connectWallet, hasInjectedWallet, isMiniPay } from "@/lib/wallet";
import {
  getPreferredWalletProvider,
  getWalletProvider,
  savePreferredWalletProvider,
  type WalletProviderId,
} from "@/lib/wallet-providers";
import { USERNAME_MAX } from "@/lib/username";

const AVATARS = ["🦊", "🐸", "🦁", "🐼", "🦄", "🐙", "🦉", "🐢"];
const FETCH_OPTS: RequestInit = { credentials: "include" };

function goHome() {
  window.location.assign("/home");
}

export default function ConnectPage() {
  const { t, locale } = useLocale();
  const searchParams = useSearchParams();
  const fromOnboarding = searchParams.get("from") === "onboarding";
  const walletParam = searchParams.get("wallet");

  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletAvailable, setWalletAvailable] = useState(false);
  const [miniPay, setMiniPay] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<WalletProviderId | null>(null);

  useEffect(() => {
    setWalletAvailable(hasInjectedWallet());
    setMiniPay(isMiniPay());
    const preferred = getPreferredWalletProvider();
    if (
      walletParam === "metamask" ||
      walletParam === "rabby" ||
      walletParam === "minipay"
    ) {
      setSelectedWallet(walletParam);
      savePreferredWalletProvider(walletParam);
    } else {
      setSelectedWallet(preferred);
    }
    fetch("/api/users/me", FETCH_OPTS)
      .then((r) => {
        if (r.ok) goHome();
      })
      .catch(() => null);
  }, [walletParam]);

  function usernameErrorMessage(code: string): string {
    switch (code) {
      case "TAKEN":
        return t.connect.usernameTaken;
      case "TOO_SHORT":
        return t.connect.usernameRequired;
      case "TOO_LONG":
        return t.connect.usernameTooLong;
      case "INVALID_CHARS":
        return t.connect.usernameInvalid;
      case "WALLET_REQUIRED":
        return t.connect.walletRequired;
      default:
        return t.connect.errorGeneric;
    }
  }

  async function loginWithWallet(address: string) {
    const res = await fetch("/api/users", {
      ...FETCH_OPTS,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress: address }),
    });

    let data: Record<string, unknown> = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (res.ok && data.returning) {
      goHome();
      return "returning" as const;
    }
    if (res.ok && data.needsProfile) {
      setNeedsProfile(true);
      return "needsProfile" as const;
    }

    if (!res.ok) {
      const code = typeof data.error === "string" ? data.error : "UNKNOWN";
      setError(usernameErrorMessage(code));
      if (res.status >= 500) setNeedsProfile(true);
      return "error" as const;
    }

    setNeedsProfile(true);
    return "needsProfile" as const;
  }

  function walletErrorMessage(err: unknown): string {
    if (err instanceof Error) {
      switch (err.message) {
        case "USER_REJECTED":
          return t.connect.walletRejected;
        case "WRONG_NETWORK":
          return t.connect.wrongNetwork;
        case "WALLET_NOT_INSTALLED":
          return t.connect.walletNotInstalled;
        case "NO_WALLET":
          return t.connect.noWallet;
        default:
          break;
      }
    }
    return t.connect.errorGeneric;
  }

  function handleSelectWallet(id: WalletProviderId) {
    setSelectedWallet(id);
    savePreferredWalletProvider(id);
    setError(null);
  }

  async function handleConnect() {
    setError(null);
    if (!selectedWallet) {
      setError(t.connect.chooseWalletFirst);
      return;
    }
    if (!getWalletProvider(selectedWallet)) {
      setError(t.connect.walletNotInstalled);
      return;
    }
    setConnecting(true);
    let connectedAddress: string | null = null;
    try {
      const address = await connectWallet(selectedWallet);
      connectedAddress = address;
      setWalletAddress(address);

      try {
        await loginWithWallet(address);
      } catch {
        setNeedsProfile(true);
        setError(t.connect.errorGeneric);
      }
    } catch (err) {
      if (connectedAddress) {
        setNeedsProfile(true);
        setError(t.connect.errorGeneric);
      } else {
        setError(walletErrorMessage(err));
      }
      console.error("Wallet connect error:", err);
    } finally {
      setConnecting(false);
    }
  }

  async function handleContinue() {
    if (!walletAddress) return;
    setError(null);
    setConnecting(true);
    try {
      await loginWithWallet(walletAddress);
    } catch {
      setError(t.connect.errorGeneric);
    } finally {
      setConnecting(false);
    }
  }

  async function handleCreate() {
    setError(null);
    if (!walletAddress) {
      setError(t.connect.walletRequired);
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/users", {
        ...FETCH_OPTS,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          avatar,
          locale,
          walletAddress,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(usernameErrorMessage(data.error ?? "UNKNOWN"));
        setCreating(false);
        return;
      }
      goHome();
    } catch {
      setError(t.connect.errorGeneric);
      setCreating(false);
    }
  }

  function handleUsernameChange(value: string) {
    const cleaned = value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, USERNAME_MAX);
    setUsername(cleaned);
  }

  const showProfileForm = needsProfile && walletAddress;

  return (
    <main className="home-perfil flex flex-1 flex-col px-4 pb-8 safe-top">
      <header className="relative z-30 mb-6 flex animate-card-pop items-start justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-surface ring-2 ring-lemon/30 card-depth-sm">
            <Wallet className="size-7 text-lemon" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-h-muted">
              {t.common.appName}
            </p>
            <h1 className="font-display text-2xl font-bold leading-tight text-h-foreground">
              {showProfileForm ? t.connect.title : t.connect.connectTitle}
            </h1>
          </div>
        </div>
        <LanguageToggle variant="perfil" />
      </header>

      <p
        className="animate-card-pop mb-6 text-sm font-semibold text-h-muted"
        style={{ animationDelay: "60ms" }}
      >
        {fromOnboarding ? t.connect.subtitleNew : t.connect.subtitleExisting}
      </p>

      <section
        className="animate-card-pop rounded-3xl bg-surface p-5 ring-1 ring-h-border card-depth"
        style={{ animationDelay: "100ms" }}
      >
        {walletAddress ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-2xl bg-prosperity/10 p-3 ring-1 ring-prosperity/25">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-prosperity/20 text-prosperity">
                <CheckCircle2 className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-prosperity">
                  {t.connect.connectedAs}
                </p>
                <p className="truncate font-mono text-[11px] text-h-muted">
                  {walletAddress}
                </p>
              </div>
              <ShieldCheck className="size-5 shrink-0 text-prosperity/70" />
            </div>
            {!showProfileForm && (
              <button
                type="button"
                onClick={handleContinue}
                disabled={connecting}
                className="btn-chunky flex w-full items-center justify-center gap-2 rounded-2xl bg-prosperity py-4 font-display text-base font-bold text-h-background disabled:opacity-50"
              >
                {connecting ? t.connect.continuing : t.connect.continueToApp}
                <ArrowRight className="size-4" />
              </button>
            )}
          </div>
        ) : (
          <>
            {miniPay && (
              <p className="mb-3 text-center text-xs font-bold text-prosperity">
                📱 {t.connect.minipayDetected}
              </p>
            )}
            <WalletPicker
              selected={selectedWallet}
              onSelect={handleSelectWallet}
              disabled={connecting}
              labels={{
                chooseWallet: t.connect.chooseWallet,
                notInstalled: t.connect.notInstalled,
                install: t.connect.installWallet,
              }}
            />
            <button
              type="button"
              onClick={handleConnect}
              disabled={connecting || !walletAvailable || !selectedWallet}
              className="btn-chunky mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-lemon py-4 font-display text-base font-bold text-h-background disabled:opacity-40"
            >
              <Wallet className="size-5" />
              {connecting ? t.connect.connecting : t.connect.connectMiniPay}
            </button>
            {!walletAvailable && (
              <p className="mt-3 text-center text-xs font-semibold text-h-muted">
                {t.connect.noWallet}
              </p>
            )}
          </>
        )}
      </section>

      {showProfileForm && (
        <section
          className="animate-card-pop mt-4 flex flex-col gap-5 rounded-3xl bg-surface p-5 ring-1 ring-h-border card-depth"
          style={{ animationDelay: "160ms" }}
        >
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-h-muted">
              {t.connect.usernamePlaceholder}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder={t.connect.usernamePlaceholder}
              maxLength={USERNAME_MAX}
              className="w-full rounded-2xl bg-h-background px-5 py-4 font-display text-lg font-bold text-h-foreground outline-none ring-1 ring-h-border transition-[ring-color] placeholder:text-h-muted/40 focus:ring-prosperity/50"
            />
            <p className="mt-1.5 text-xs font-semibold text-h-muted">
              {t.connect.usernameHint}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-h-muted">
              {t.connect.pickAvatar}
            </p>
            <div className="grid grid-cols-4 gap-2">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAvatar(a)}
                  className={`flex aspect-square items-center justify-center rounded-2xl text-3xl transition-all active:scale-90 ${
                    avatar === a
                      ? "scale-105 bg-lemon/20 ring-2 ring-lemon card-depth-sm"
                      : "bg-h-background ring-1 ring-h-border"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="animate-shake rounded-xl bg-danger/10 px-4 py-2.5 text-center text-sm font-bold text-danger ring-1 ring-danger/25">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleCreate}
            disabled={creating || username.length < 3}
            className="btn-chunky rounded-2xl bg-prosperity py-4 font-display text-base font-bold text-h-background disabled:opacity-50"
          >
            {creating ? t.connect.creating : t.connect.createProfile}
          </button>
        </section>
      )}

      {!showProfileForm && error && (
        <p className="animate-shake mt-4 rounded-xl bg-danger/10 px-4 py-2.5 text-center text-sm font-bold text-danger ring-1 ring-danger/25">
          {error}
        </p>
      )}

      <div className="mt-auto pt-8 text-center">
        <Link
          href={fromOnboarding ? "/onboarding" : "/"}
          className="text-sm font-semibold text-h-muted transition-colors hover:text-prosperity"
        >
          ← {fromOnboarding ? t.onboarding.back : t.onboarding.back}
        </Link>
      </div>
    </main>
  );
}
