import type { EIP1193Provider } from "viem";
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

async function readProviderChainId(provider: EIP1193Provider): Promise<number> {
  const hex = (await provider.request({ method: "eth_chainId" })) as string;
  return Number.parseInt(hex, 16);
}

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

/**
 * MiniPay connect: never block on wallet chain — UI/tokens follow server mainnet config.
 */
export async function initMiniPayConnect(_provider: EIP1193Provider): Promise<void> {
  try {
    await loadClientChainConfig();
  } catch {
    /* build-time / production default applies */
  }
}

/** MiniPay payment: wallet chain must match server (mainnet on Vercel). */
export async function assertMiniPayServerNetwork(
  provider: EIP1193Provider
): Promise<void> {
  const cfg = await loadClientChainConfig();
  let walletChain: number;
  try {
    walletChain = await readProviderChainId(provider);
  } catch {
    throw new Error("WRONG_NETWORK");
  }
  if (walletChain !== cfg.chainId) {
    throw new Error("WRONG_NETWORK");
  }
}

export async function getExpectedChainId(): Promise<number> {
  if (typeof window === "undefined") {
    const { getChainId } = await import("@/lib/chain/config");
    return getChainId();
  }
  const cfg = cached ?? (await loadClientChainConfig());
  return cfg.chainId;
}
