"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Zap, Trophy, Medal } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

type Props = {
  variant?: "default" | "perfil";
};

export function BottomNav({ variant = "default" }: Props) {
  const pathname = usePathname();
  const { t } = useLocale();

  const items = [
    { href: "/home", icon: User, label: t.home.profile },
    { href: "/challenge", icon: Zap, label: t.home.playTab },
    { href: "/leaderboard", icon: Trophy, label: t.home.ranking },
    { href: "/medals", icon: Medal, label: t.medals.tab },
  ];

  if (variant === "perfil") {
    return (
      <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 border-t border-h-border bg-surface/85 backdrop-blur-xl safe-bottom">
        <div className="flex w-full items-center justify-around px-4 py-3 safe-bottom">
          {items.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-1 transition-transform active:scale-90"
              >
                <span
                  className={`grid size-10 place-items-center rounded-2xl transition-colors ${
                    active
                      ? "bg-lemon text-h-background"
                      : "text-h-muted"
                  }`}
                >
                  <Icon className="size-5" />
                </span>
                <span
                  className={`text-[10px] font-semibold ${
                    active ? "text-lemon" : "text-h-muted"
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky bottom-0 mt-auto border-t border-celo-black/10 bg-celo-cream/95 backdrop-blur">
      <div className="flex">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-3 transition-colors ${
                active ? "text-celo-green" : "text-celo-black/40"
              }`}
            >
              <Icon className={`size-5 ${active ? "scale-110" : ""}`} />
              <span className="text-[10px] font-extrabold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
