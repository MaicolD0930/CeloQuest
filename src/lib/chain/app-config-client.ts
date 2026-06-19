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

const CELO_MAINNET_CHAIN_ID = 42220;
const CELO_SEPOLIA_CHAIN_ID = 11142220;

let cached: AppChainConfig | null = null;
let inflight: Promise<AppChainConfig> | null = null;

async function readProviderChainId(provider: EIP1193Provider): Promise<number> {
  const hex = (await provider.request({ method: "eth_chainId" })) as string;
  return Number.parseInt(hex, 16);
}

export function applyChainIdToClient(chainId: number): CeloNetwork | null {
  if (chainId === CELO_MAINNET_CHAIN_ID) {
    setClientNetworkOverride("mainnet");
    return "mainnet";
  }
  if (chainId === CELO_SEPOLIA_CHAIN_ID) {
    setClientNetworkOverride("sepolia");
    return "sepolia";
  }
  return null;
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
        return data;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/**
 * MiniPay connect: trust the wallet's active chain (cannot switch programmatically).
 * Never blocks connection — server config loads in background for tokens/prices.
 */
export async function initMiniPayConnect(provider: EIP1193Provider): Promise<void> {
  try {
    const chainId = await readProviderChainId(provider);
    applyChainIdToClient(chainId);
  } catch {
    try {
      const cfg = await loadClientChainConfig();
      setClientNetworkOverride(cfg.network);
    } catch {
      /* build-time / production default applies */
    }
  }

  void loadClientChainConfig()
    .then(async (cfg) => {
      try {
        const walletChain = await readProviderChainId(provider);
        if (walletChain === cfg.chainId) {
          setClientNetworkOverride(cfg.network);
        }
      } catch {
        setClientNetworkOverride(cfg.network);
      }
    })
    .catch(() => {});
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
  setClientNetworkOverride(cfg.network);
}

export async function getExpectedChainId(): Promise<number> {
  if (typeof window === "undefined") {
    const { getChainId } = await import("@/lib/chain/config");
    return getChainId();
  }
  const cfg = cached ?? (await loadClientChainConfig());
  return cfg.chainId;
}
