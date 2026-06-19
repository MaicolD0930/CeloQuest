import type { CeloNetwork } from "@/lib/chain/config";
import { setClientNetworkOverride } from "@/lib/chain/config";

export type AppChainConfig = {
  network: CeloNetwork;
  chainId: number;
  tokens: {
    copm: {
      id: string;
      symbol: string;
      address: string | null;
      decimals: number;
    };
    usdc: {
      id: string;
      symbol: string;
      address: string | null;
      readAddress: string | null;
      decimals: number;
    };
  };
};

let cached: AppChainConfig | null = null;
let inflight: Promise<AppChainConfig> | null = null;

export function getClientChainConfig(): AppChainConfig | null {
  return cached;
}

export function clearClientChainConfigCache(): void {
  cached = null;
  inflight = null;
}

/** Load network + tokens from server (uses CELO_NETWORK at runtime on Vercel). */
export async function loadClientChainConfig(): Promise<AppChainConfig> {
  if (cached) return cached;
  if (!inflight) {
    inflight = fetch("/api/app-config", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("APP_CONFIG_FAILED");
        return res.json() as Promise<AppChainConfig>;
      })
      .then((data) => {
        cached = data;
        setClientNetworkOverride(data.network);
        return data;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export async function getExpectedChainId(): Promise<number> {
  if (typeof window === "undefined") {
    const { getChainId } = await import("@/lib/chain/config");
    return getChainId();
  }
  const cfg = cached ?? (await loadClientChainConfig());
  return cfg.chainId;
}
