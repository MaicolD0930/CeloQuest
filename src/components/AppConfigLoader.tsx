"use client";

import { useEffect, useState } from "react";
import { loadClientChainConfig } from "@/lib/chain/app-config-client";

/** Hydrates client-side chain config from server runtime env (fixes MiniPay vs stale NEXT_PUBLIC build). */
export function AppConfigLoader({ children }: { children: React.ReactNode }) {
  const [, setReady] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void loadClientChainConfig()
      .catch((err) => console.warn("[CeloQuest] app-config load failed:", err))
      .finally(() => {
        if (!cancelled) setReady((n) => n + 1);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return children;
}
