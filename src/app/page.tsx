"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { DraggableOctopus } from "@/components/landing/DraggableOctopus";
import { LandingBackground } from "@/components/landing/LandingBackground";
import { useIsMiniPay } from "@/hooks/useIsMiniPay";

export default function LandingPage() {
  const { t } = useLocale();
  const router = useRouter();
  const miniPay = useIsMiniPay();

  useEffect(() => {
    fetch("/api/users/me", { credentials: "include" })
      .then((r) => (r.ok ? router.replace("/home") : null))
      .catch(() => null);
  }, [router]);

  return (
    <main className="home-perfil landing-page relative flex min-h-dvh w-full min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto safe-top">
      <LandingBackground />

      <header className="relative z-10 flex justify-end px-4 pb-2">
        <LanguageToggle variant="perfil" />
      </header>

      <section className="relative z-10 mx-auto flex w-full min-w-0 max-w-full flex-1 flex-col items-center px-4 pb-10 pt-4 text-center">
        <div className="animate-card-pop">
          <DraggableOctopus imageSrc="/images/octopus.png" />
        </div>

        <h1
          className="animate-card-pop mt-6 max-w-full font-display text-4xl font-black tracking-tight sm:text-5xl"
          style={{ animationDelay: "120ms" }}
        >
          <span className="landing-brand-celo">Celo</span>
          <span className="landing-brand-quest">Quest</span>
        </h1>

        <p
          className="animate-card-pop mt-4 max-w-xs text-pretty text-base font-semibold leading-snug text-h-muted"
          style={{ animationDelay: "200ms" }}
        >
          {t.landing.tagline}
        </p>

        <div
          className="animate-card-pop mt-8 grid w-full min-w-0 max-w-full grid-cols-3 gap-2 sm:gap-3"
          style={{ animationDelay: "280ms" }}
        >
          {t.landing.stats.map((s, i) => (
            <div
              key={s.label}
              className="min-w-0 rounded-2xl bg-surface px-1.5 py-3 ring-1 ring-h-border card-depth-sm sm:px-2"
            >
              <div
                className={`font-display text-lg font-extrabold ${
                  i === 0 ? "text-lemon" : i === 1 ? "text-h-foreground" : "text-prosperity"
                }`}
              >
                {s.value}
              </div>
              <div className="mt-0.5 text-[10px] font-semibold leading-tight text-h-muted">
                <span className="line-clamp-2 break-words">{s.label}</span>
              </div>
            </div>
          ))}
        </div>

        <div
          className="animate-card-pop mt-10 flex w-full min-w-0 max-w-full flex-col gap-3.5"
          style={{ animationDelay: "360ms" }}
        >
          {miniPay ? (
            <LandingCTA
              href="/connect"
              variant="primary"
              icon="📱"
              title={t.landing.startNow}
              subtitle={t.landing.minipayStartHint}
            />
          ) : (
            <>
              <LandingCTA
                href="/onboarding"
                variant="primary"
                icon="🚀"
                title={t.landing.firstStep}
                subtitle={t.landing.firstStepHint}
              />
              <p className="text-pretty text-center text-xs font-bold text-h-muted">
                {t.landing.chooseWallet}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <LandingWalletCTA
                  href="/connect?wallet=metamask"
                  icon="🦊"
                  name="MetaMask"
                  actionLabel={t.landing.connectWith}
                />
                <LandingWalletCTA
                  href="/connect?wallet=rabby"
                  icon="🐰"
                  name="Rabby"
                  actionLabel={t.landing.connectWith}
                />
              </div>
            </>
          )}
        </div>

        <p
          className="animate-card-pop mt-10 text-xs font-semibold text-h-muted"
          style={{ animationDelay: "440ms" }}
        >
          {t.landing.poweredBy}{" "}
          <span className="text-prosperity">💚</span>
        </p>
      </section>
    </main>
  );
}

function LandingWalletCTA({
  href,
  icon,
  name,
  actionLabel,
}: {
  href: string;
  icon: string;
  name: string;
  actionLabel: string;
}) {
  return (
    <Link
      href={href}
      className="landing-cta-secondary landing-cta group relative block w-full overflow-hidden rounded-[1.25rem]"
    >
      <div className="relative flex flex-col items-center gap-2 px-4 py-5">
        <span className="text-3xl">{icon}</span>
        <span className="font-display text-base font-bold text-h-foreground">{name}</span>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-prosperity">
          {actionLabel}
          <ArrowRight className="size-3.5" />
        </span>
      </div>
    </Link>
  );
}

function LandingCTA({
  href,
  variant,
  icon,
  title,
  subtitle,
}: {
  href: string;
  variant: "primary" | "ghost";
  icon: string;
  title: string;
  subtitle: string;
}) {
  const isPrimary = variant === "primary";

  return (
    <Link
      href={href}
      className={`landing-cta group relative block w-full overflow-hidden rounded-[1.25rem] ${
        isPrimary ? "landing-cta-primary" : "landing-cta-secondary"
      }`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-[transform,opacity] duration-700 group-hover:translate-x-full group-hover:opacity-100"
      />
      <div className="relative flex min-w-0 items-center gap-3 px-4 py-4 sm:gap-3.5 sm:px-5">
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-xl text-xl transition-transform duration-200 group-hover:scale-110 sm:size-11 ${
            isPrimary
              ? "bg-h-background/15 ring-1 ring-h-background/20"
              : "bg-prosperity/15 ring-1 ring-prosperity/25"
          }`}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1 text-left">
          <div
            className={`font-display text-[15px] font-bold leading-tight sm:text-base ${
              isPrimary ? "text-h-background" : "text-h-foreground"
            }`}
          >
            {title}
          </div>
          <div
            className={`mt-0.5 line-clamp-2 text-pretty text-[11px] font-semibold leading-snug sm:text-xs ${
              isPrimary ? "text-h-background/75" : "text-prosperity"
            }`}
          >
            {subtitle}
          </div>
        </div>
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-xl transition-all duration-200 group-hover:translate-x-0.5 ${
            isPrimary
              ? "bg-h-background/10 text-h-background group-hover:bg-h-background/20"
              : "bg-h-background/50 text-h-muted ring-1 ring-h-border group-hover:bg-prosperity/20 group-hover:text-prosperity group-hover:ring-prosperity/40"
          }`}
        >
          <ArrowRight className="size-4" />
        </span>
      </div>
    </Link>
  );
}
