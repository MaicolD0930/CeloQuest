"use client";

import { useEffect, useState } from "react";
import {
  getClientChainConfig,
  loadClientChainConfig,
  type AppChainConfig,
} from "@/lib/chain/app-config-client";

/** Client chain config from server runtime env (mainnet on Vercel even if build had sepolia). */
export function useAppChainConfig(): AppChainConfig | null {
  const [config, setConfig] = useState<AppChainConfig | null>(
    getClientChainConfig()
  );

  useEffect(() => {
    let cancelled = false;
    void loadClientChainConfig()
      .then((data) => {
        if (!cancelled) setConfig(data);
      })
      .catch(() => {
        /* fallback to build-time env via getCopmTokenConfig */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return config;
}
