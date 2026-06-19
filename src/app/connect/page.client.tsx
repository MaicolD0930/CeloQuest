"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { WalletPicker } from "@/components/WalletPicker";
import { connectWallet, hasInjectedWallet } from "@/lib/wallet";
import {
  getPreferredWalletProvider,
  getWalletProvider,
  savePreferredWalletProvider,
  type WalletProviderId,
} from "@/lib/wallet-providers";
import { USERNAME_MAX } from "@/lib/username";
import { apiFetchJson, isApiClientError } from "@/lib/client/api-fetch";
import { formatApiErrorMessage } from "@/lib/client/format-api-error";
import { useIsMiniPay } from "@/hooks/useIsMiniPay";
import { connectWrongNetworkMessage } from "@/lib/i18n/network-ui";

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
  const miniPay = useIsMiniPay();
  const autoConnectStarted = useRef(false);
  const [connecting, setConnecting] = useState(false);
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<WalletProviderId | null>(null);

  useEffect(() => {
    setWalletAvailable(hasInjectedWallet());
    const preferred = getPreferredWalletProvider();
    if (miniPay) {
      setSelectedWallet("minipay");
      savePreferredWalletProvider("minipay");
    } else if (
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
  }, [walletParam, miniPay]);

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
      case "SERVER_ERROR":
        return t.connect.serverError;
      case "DATABASE_ERROR":
        return t.apiErrors.database;
      default:
        return t.connect.errorGeneric;
    }
  }

  async function loginWithWallet(
    address: string,
    attempt = 0
  ): Promise<"returning" | "needsProfile" | "error"> {
    try {
      const { data } = await apiFetchJson<Record<string, unknown>>("/api/users", {
        ...FETCH_OPTS,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address }),
        label: "POST /api/users",
        timeoutMs: 28_000,
      });

      if (data.returning) {
        goHome();
        return "returning" as const;
      }
      if (data.needsProfile) {
        setNeedsProfile(true);
        return "needsProfile" as const;
      }

      setNeedsProfile(true);
      return "needsProfile" as const;
    } catch (err) {
      if (
        isApiClientError(err) &&
        attempt < 2 &&
        (err.kind === "API_DOWN" ||
          err.kind === "TIMEOUT" ||
          err.kind === "NETWORK" ||
          err.code === "SERVER_ERROR" ||
          err.code === "DATABASE_ERROR")
      ) {
        await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
        return loginWithWallet(address, attempt + 1);
      }

      if (isApiClientError(err)) {
        if (
          err.code &&
          err.code !== "SERVER_ERROR" &&
          err.code !== "DATABASE_ERROR"
        ) {
          setError(usernameErrorMessage(err.code));
          return "error" as const;
        }
        setError(
          formatApiErrorMessage(err, t.apiErrors, { showDebug: miniPay })
        );
        return "error" as const;
      }
      setError(t.connect.serverError);
      return "error" as const;
    }
  }

  function walletErrorMessage(err: unknown): string {
    if (err instanceof Error) {
      switch (err.message) {
        case "USER_REJECTED":
          return t.connect.walletRejected;
        case "WRONG_NETWORK":
          return connectWrongNetworkMessage(t);
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

  async function handleConnect(walletId?: WalletProviderId) {
    setError(null);
    const providerId = walletId ?? selectedWallet;
    if (!providerId) {
      setError(t.connect.chooseWalletFirst);
      return;
    }
    if (!getWalletProvider(providerId)) {
      setError(t.connect.walletNotInstalled);
      return;
    }
    setConnecting(true);
    let connectedAddress: string | null = null;
    try {
      savePreferredWalletProvider(providerId);
      const address = await connectWallet(providerId);
      connectedAddress = address;
      setWalletAddress(address);

      try {
        const result = await loginWithWallet(address);
        if (result === "error") return;
      } catch (err) {
        setNeedsProfile(true);
        setError(
          formatApiErrorMessage(err, t.apiErrors, { showDebug: miniPay })
        );
      }
    } catch (err) {
      if (connectedAddress) {
        setNeedsProfile(true);
        setError(
          formatApiErrorMessage(err, t.apiErrors, { showDebug: miniPay })
        );
      } else {
        setError(walletErrorMessage(err));
      }
      console.error("Wallet connect error:", err);
    } finally {
      setConnecting(false);
    }
  }

  useEffect(() => {
    if (!miniPay || walletAddress || autoConnectStarted.current) return;

    let cancelled = false;
    const attempt = (delayMs: number) => {
      window.setTimeout(() => {
        if (cancelled || autoConnectStarted.current) return;
        if (!getWalletProvider("minipay")) return;
        autoConnectStarted.current = true;
        void handleConnect("minipay");
      }, delayMs);
    };

    attempt(400);
    attempt(1200);

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- auto-connect when MiniPay is detected
  }, [miniPay, walletAddress]);

  async function handleContinue() {
    if (!walletAddress) return;
    setError(null);
    setConnecting(true);
    try {
      const result = await loginWithWallet(walletAddress);
      if (result === "error") return;
    } catch (err) {
      setError(formatApiErrorMessage(err, t.apiErrors, { showDebug: miniPay }));
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
      await apiFetchJson("/api/users", {
        ...FETCH_OPTS,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          avatar,
          locale,
          walletAddress,
        }),
        label: "POST /api/users (create profile)",
        timeoutMs: 28_000,
      });
      goHome();
    } catch (err) {
      if (isApiClientError(err) && err.code) {
        setError(usernameErrorMessage(err.code));
      } else {
        setError(
          formatApiErrorMessage(err, t.apiErrors, { showDebug: miniPay })
        );
      }
      setCreating(false);
    }
  }

  function handleUsernameChange(value: string) {
    const cleaned = value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, USERNAME_MAX);
    setUsername(cleaned);
  }

  const showProfileForm = needsProfile && walletAddress;
  const connectSubtitle = miniPay
    ? t.connect.minipaySubtitle
    : fromOnboarding
      ? t.connect.subtitleNew
      : t.connect.subtitleExisting;

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
        {connectSubtitle}
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
        ) : miniPay ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="grid size-16 place-items-center rounded-2xl bg-prosperity/15 text-3xl ring-1 ring-prosperity/30">
              📱
            </div>
            <p className="text-center text-sm font-semibold text-h-muted">
              {connecting ? t.connect.minipayConnecting : t.connect.minipayDetected}
            </p>
            {connecting && (
              <Loader2 className="size-8 animate-spin text-prosperity" aria-hidden />
            )}
            {error && !connecting && (
              <button
                type="button"
                onClick={() => {
                  autoConnectStarted.current = false;
                  void handleConnect("minipay");
                }}
                className="btn-chunky flex w-full items-center justify-center gap-2 rounded-2xl bg-lemon py-4 font-display text-base font-bold text-h-background"
              >
                {t.connect.minipayRetry}
              </button>
            )}
          </div>
        ) : (
          <>
            <WalletPicker
              selected={selectedWallet}
              onSelect={handleSelectWallet}
              disabled={connecting}
              hideMiniPay
              labels={{
                chooseWallet: t.connect.chooseWallet,
                notInstalled: t.connect.notInstalled,
                install: t.connect.installWallet,
              }}
            />
            <button
              type="button"
              onClick={() => void handleConnect()}
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

      {!showProfileForm && error && !(miniPay && !walletAddress) && (
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
