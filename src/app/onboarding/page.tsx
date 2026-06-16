"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronRight, ExternalLink } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { TutorialVideoScreen } from "@/components/video/TutorialVideoScreen";
import type { TutorialVideoId } from "@/lib/videos/catalog";
import { useIsMiniPay } from "@/hooks/useIsMiniPay";

function OnboardingContent() {
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const miniPay = useIsMiniPay();
  const [step, setStep] = useState(0);
  const [activeVideo, setActiveVideo] = useState<TutorialVideoId | null>(null);

  const slides = t.onboarding.slides;
  const onResources = step >= slides.length;
  const slide = onResources ? null : slides[step];
  const isLastSlide = step === slides.length - 1;
  const totalSteps = miniPay ? slides.length : slides.length + 1;

  useEffect(() => {
    if (miniPay && searchParams.get("resources") === "1") {
      router.replace("/connect?from=onboarding");
      return;
    }
    if (!miniPay && searchParams.get("resources") === "1") {
      setStep(slides.length);
    }
  }, [searchParams, slides.length, miniPay, router]);

  useEffect(() => {
    if (miniPay && step >= slides.length) {
      router.replace("/connect?from=onboarding");
    }
  }, [miniPay, step, slides.length, router]);

  if (miniPay && step >= slides.length) {
    return null;
  }

  function handleNextSlide() {
    if (isLastSlide) {
      if (miniPay) {
        router.push("/connect?from=onboarding");
      } else {
        setStep(slides.length);
      }
      return;
    }
    setStep(step + 1);
  }

  return (
    <>
      <main className="home-perfil flex flex-1 flex-col px-4 pb-8 safe-top">
        <div className="animate-card-pop mb-6 flex items-center justify-between">
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i <= step ? "w-8 bg-lemon" : "w-2 bg-h-border"
                }`}
              />
            ))}
          </div>
          <Link
            href="/"
            className="text-sm font-bold text-h-muted transition-colors hover:text-h-foreground"
          >
            {t.onboarding.back}
          </Link>
        </div>

        {onResources && !miniPay ? (
          <div className="animate-card-pop flex flex-1 flex-col">
            <h2 className="font-display text-3xl font-bold text-h-foreground">
              {t.onboarding.resourcesTitle}
            </h2>
            <p className="mt-2 font-semibold text-h-muted">
              {t.onboarding.resourcesSubtitle}
            </p>

            <div className="mt-6 flex flex-1 flex-col gap-2">
              <VideoResourceButton
                emoji="🎬"
                label={t.onboarding.videoLink}
                onClick={() => setActiveVideo("crear-wallet")}
              />
              <ResourceLink emoji="📱" label="MiniPay" href="https://www.opera.com/products/minipay" />
              <ResourceLink emoji="🦊" label="MetaMask" href="https://metamask.io/download/" />
              <ResourceLink emoji="🐰" label="Rabby" href="https://rabby.io/" />
            </div>

            <button
              type="button"
              onClick={() => router.push("/connect?from=onboarding")}
              className="btn-chunky mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-prosperity py-4 font-display text-lg font-bold text-h-background"
            >
              👛 {t.onboarding.connectAndEnter}
              <ArrowRight className="size-5" />
            </button>

            <button
              type="button"
              onClick={() => setStep(slides.length - 1)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-surface py-4 font-display text-base font-bold text-h-foreground ring-1 ring-h-border transition-transform active:scale-[0.98]"
            >
              <ArrowLeft className="size-5" />
              {t.onboarding.prev}
            </button>
          </div>
        ) : (
          <>
            <div
              key={step}
              className="flex flex-1 flex-col items-center justify-center text-center"
            >
              <div className="animate-card-pop grid size-36 place-items-center rounded-full bg-surface text-7xl ring-2 ring-lemon/40 card-depth-sm">
                {slide!.emoji}
              </div>
              <h2
                className="animate-card-pop mt-8 font-display text-3xl font-bold text-h-foreground"
                style={{ animationDelay: "80ms" }}
              >
                {slide!.title}
              </h2>
              <p
                className="animate-card-pop mt-4 max-w-sm text-base font-semibold leading-relaxed text-h-muted"
                style={{ animationDelay: "160ms" }}
              >
                {slide!.body}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-surface py-4 font-display text-base font-bold text-h-foreground ring-1 ring-h-border transition-transform active:scale-[0.98]"
                >
                  <ArrowLeft className="size-5" />
                  {t.onboarding.prev}
                </button>
              )}
              <button
                type="button"
                onClick={handleNextSlide}
                className="btn-chunky flex w-full items-center justify-center gap-2 rounded-2xl bg-lemon py-4 font-display text-lg font-bold text-h-background"
              >
                {isLastSlide
                  ? miniPay
                    ? t.landing.startNow
                    : t.onboarding.seeResources
                  : t.onboarding.next}
                <ArrowRight className="size-5" />
              </button>
            </div>
          </>
        )}
      </main>

      {activeVideo ? (
        <TutorialVideoScreen
          videoId={activeVideo}
          labels={{
            videos: t.onboarding.videos,
            videoReadyTitle: t.onboarding.videoReadyTitle,
            createWallet: t.onboarding.createWallet,
            alreadyHaveWallet: t.onboarding.alreadyHaveWallet,
            startNow: t.landing.startNow,
            close: t.onboarding.closeVideo,
            player: t.videoPlayer,
          }}
          miniPayMode={miniPay}
          onClose={() => setActiveVideo(null)}
          onCreateWallet={() => setActiveVideo(null)}
          onAlreadyHaveWallet={() => router.push("/connect?from=onboarding")}
        />
      ) : null}
    </>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingContent />
    </Suspense>
  );
}

function VideoResourceButton({
  emoji,
  label,
  onClick,
}: {
  emoji: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl bg-surface px-4 py-4 text-left ring-1 ring-h-border transition-transform card-depth-sm active:scale-[0.98] hover:ring-prosperity/30"
    >
      <span className="grid size-11 place-items-center rounded-xl bg-h-background text-2xl ring-1 ring-h-border">
        {emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display font-bold text-h-foreground">{label}</p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-prosperity" />
    </button>
  );
}

function ResourceLink({
  emoji,
  label,
  href,
}: {
  emoji: string;
  label: string;
  href: string;
}) {
  const external = href.startsWith("http");

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-4 ring-1 ring-h-border transition-transform card-depth-sm active:scale-[0.98] hover:ring-prosperity/30"
    >
      <span className="grid size-11 place-items-center rounded-xl bg-h-background text-2xl ring-1 ring-h-border">
        {emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display font-bold text-h-foreground">{label}</p>
      </div>
      <ExternalLink className="size-4 shrink-0 text-prosperity" />
    </a>
  );
}
