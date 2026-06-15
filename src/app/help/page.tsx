"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, HelpCircle } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ProfileMenu } from "@/components/ProfileMenu";
import { BottomNav } from "@/components/BottomNav";
import { useMe } from "@/hooks/useMe";

function FaqAnswer({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      }`}
      aria-hidden={!open}
    >
      <div className="overflow-hidden">
        <div className="border-t border-h-border/80 px-4 pb-4 pt-3">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function HelpPage() {
  const { t } = useLocale();
  const { data: meData } = useMe();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="home-perfil flex min-h-dvh flex-col">
      <main className="flex flex-1 flex-col px-4 pb-28 safe-top">
        <header className="animate-card-pop mb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/home"
                className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface text-h-foreground ring-1 ring-h-border transition-transform active:scale-90"
                aria-label={t.admin.backHome}
              >
                <ArrowLeft className="size-4" />
              </Link>
              <span className="font-display text-base font-extrabold leading-none tracking-tight sm:text-lg">
                <span className="text-lemon drop-shadow-[0_0_14px_oklch(0.9_0.18_100/0.4)]">
                  Celo
                </span>
                <span className="text-h-foreground">Quest</span>
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <LanguageToggle variant="perfil" />
              {meData ? (
                <ProfileMenu
                  isAdmin={!!meData.isAdmin}
                  username={meData.user.username}
                  walletAddress={meData.user.walletAddress}
                  variant="perfil"
                />
              ) : null}
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-surface p-4 ring-1 ring-h-border card-depth-sm">
            <div className="flex items-start gap-3">
              <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-prosperity/15 ring-1 ring-prosperity/30">
                <HelpCircle className="size-6 text-prosperity" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="font-display text-xl font-bold leading-tight text-h-foreground sm:text-2xl">
                  {t.faq.title}
                </h1>
                <p className="mt-1.5 text-sm font-semibold leading-snug text-h-foreground/85">
                  {t.faq.subtitle}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-2">
          {t.faq.items.map((item, index) => {
            const open = openIndex === index;
            return (
              <article
                key={item.question}
                className={`overflow-hidden rounded-2xl bg-surface ring-1 transition-[ring-color,box-shadow] duration-300 ${
                  open
                    ? "ring-prosperity/35 shadow-[0_8px_24px_-12px_oklch(0.74_0.18_150/0.35)]"
                    : "ring-h-border"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : index)}
                  className={`flex w-full items-start gap-3 p-4 text-left transition-colors duration-200 ${
                    open ? "bg-prosperity/5" : "hover:bg-h-background/40"
                  }`}
                  aria-expanded={open}
                >
                  <span
                    className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors duration-200 ${
                      open
                        ? "bg-prosperity text-h-background"
                        : "bg-prosperity/15 text-prosperity"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 font-display text-sm font-bold leading-snug text-h-foreground">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`mt-0.5 size-5 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      open ? "rotate-180 text-prosperity" : "text-h-muted"
                    }`}
                  />
                </button>
                <FaqAnswer open={open}>
                  <p className="pl-9 text-sm font-medium leading-relaxed text-h-foreground/80">
                    {item.answer}
                  </p>
                </FaqAnswer>
              </article>
            );
          })}
        </div>
      </main>

      <BottomNav variant="perfil" />
    </div>
  );
}
