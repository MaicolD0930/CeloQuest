"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { Locale } from "@/lib/i18n/dictionaries";

const labels: Record<Locale, string> = { es: "ES", en: "EN" };

type Props = {
  variant?: "default" | "perfil";
};

export function LanguageToggle({ variant = "default" }: Props) {
  const { locale, setLocale } = useLocale();

  if (variant === "perfil") {
    return (
      <div className="flex overflow-hidden rounded-xl bg-surface p-1 ring-1 ring-h-border">
        {(Object.keys(labels) as Locale[]).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold uppercase transition-colors ${
              locale === l
                ? "bg-lemon text-h-background"
                : "text-h-muted hover:text-h-foreground"
            }`}
          >
            {labels[l]}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 rounded-full bg-black/10 p-1 backdrop-blur">
      {(Object.keys(labels) as Locale[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
            locale === l
              ? "bg-celo-black text-celo-yellow shadow"
              : "text-celo-black/60 hover:text-celo-black"
          }`}
        >
          {labels[l]}
        </button>
      ))}
    </div>
  );
}
