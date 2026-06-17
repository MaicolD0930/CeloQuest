"use client";

import { useEffect, useRef, useState } from "react";
import { HelpCircle, Menu, Shield, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { invalidateChallengeCache } from "@/lib/client/challenge-cache";
import { invalidateMeCache } from "@/lib/client/me-cache";
import { AppVersionBadge } from "@/components/AppVersionBadge";

type Props = {
  username: string;
  walletAddress: string;
  isAdmin?: boolean;
  variant?: "default" | "perfil";
};

export function ProfileMenu({
  username,
  walletAddress,
  isAdmin = false,
  variant = "default",
}: Props) {
  const { t } = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  async function handleLogout() {
    setLoggingOut(true);
    invalidateMeCache();
    invalidateChallengeCache();
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
  }

  const shortWallet = `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`;

  const triggerClass =
    variant === "perfil"
      ? "grid size-9 place-items-center rounded-xl bg-surface text-h-foreground ring-1 ring-h-border transition-transform active:scale-90"
      : "flex h-10 w-10 items-center justify-center rounded-full bg-celo-black/10 text-lg font-black transition-transform active:scale-95";

  const dropdownClass =
    variant === "perfil"
      ? "animate-slide-up absolute right-0 top-12 z-[100] w-64 overflow-hidden rounded-2xl border border-prosperity/30 bg-surface shadow-[0_12px_40px_-8px_rgba(0,0,0,0.55)] ring-2 ring-prosperity/45"
      : "animate-slide-up absolute right-0 top-12 z-[100] w-64 overflow-hidden rounded-2xl border border-celo-green/30 bg-white shadow-xl ring-2 ring-celo-green/40";

  const itemClass =
    variant === "perfil"
      ? "flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-extrabold transition-colors"
      : "flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-extrabold transition-colors";

  return (
    <div className={`relative ${open ? "z-[60]" : ""}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={triggerClass}
        aria-label={t.profile.menu}
      >
        {variant === "perfil" ? (
          <Menu className="size-4" />
        ) : (
          "☰"
        )}
      </button>

      {open && (
        <div className={dropdownClass}>
          <div
            className={`border-b px-4 py-3 ${
              variant === "perfil" ? "border-h-border" : "border-celo-black/10"
            }`}
          >
            <p
              className={`truncate font-extrabold ${
                variant === "perfil" ? "text-h-foreground" : "text-celo-black"
              }`}
            >
              {username}
            </p>
            <p
              className={`mt-0.5 font-mono text-xs ${
                variant === "perfil" ? "text-h-muted" : "text-celo-black/50"
              }`}
            >
              {shortWallet}
            </p>
            {variant === "perfil" ? (
              <div className="mt-2">
                <AppVersionBadge label={t.common.versions} />
              </div>
            ) : null}
          </div>

          <Link
            href="/progress"
            onClick={() => setOpen(false)}
            className={`${itemClass} text-lemon hover:bg-lemon/10`}
          >
            <TrendingUp className="size-4" />
            {t.home.myProgress}
          </Link>

          <Link
            href="/help"
            onClick={() => setOpen(false)}
            className={`${itemClass} text-prosperity hover:bg-prosperity/10`}
          >
            <HelpCircle className="size-4" />
            {t.profile.faq}
          </Link>

          {isAdmin ? (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className={`${itemClass} text-prosperity hover:bg-prosperity/10`}
            >
              <Shield className="size-4" />
              {t.profile.admin}
            </Link>
          ) : null}

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className={`${itemClass} text-danger hover:bg-danger/10 disabled:opacity-50 ${
              variant === "perfil" ? "" : "hover:bg-danger-soft"
            }`}
          >
            🚪 {loggingOut ? t.profile.loggingOut : t.profile.logout}
          </button>
        </div>
      )}
    </div>
  );
}
