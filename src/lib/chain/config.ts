import { celo, celoSepolia } from "viem/chains";
import type { Chain } from "viem";

export type CeloNetwork = "sepolia" | "mainnet";

let clientNetworkOverride: CeloNetwork | null = null;

/** Set after /api/app-config loads on the client. */
export function setClientNetworkOverride(network: CeloNetwork): void {
  clientNetworkOverride = network;
}

function resolveNetworkFromEnv(): CeloNetwork {
  const isServer = typeof window === "undefined";
  // Server: only CELO_NETWORK (runtime). Ignore NEXT_PUBLIC baked at build time.
  const raw = isServer
    ? (process.env.CELO_NETWORK ??
        (process.env.NODE_ENV === "production" ? "mainnet" : "sepolia"))
    : (process.env.NEXT_PUBLIC_CELO_NETWORK ??
        process.env.CELO_NETWORK ??
        (process.env.NODE_ENV === "production" ? "mainnet" : "sepolia"));
  return raw.toLowerCase() === "mainnet" ? "mainnet" : "sepolia";
}

export function getCeloNetwork(): CeloNetwork {
  if (typeof window !== "undefined" && clientNetworkOverride) {
    return clientNetworkOverride;
  }
  return resolveNetworkFromEnv();
}

export function getActiveChain(): Chain {
  return getCeloNetwork() === "mainnet" ? celo : celoSepolia;
}

export function getRpcUrl(): string {
  const network = getCeloNetwork();
  if (network === "mainnet") {
    return (
      process.env.CELO_RPC_URL ??
      process.env.NEXT_PUBLIC_CELO_RPC_URL ??
      celo.rpcUrls.default.http[0]
    );
  }
  return (
    process.env.CELO_SEPOLIA_RPC_URL ??
    process.env.CELO_RPC_URL ??
    process.env.NEXT_PUBLIC_CELO_RPC_URL ??
    celoSepolia.rpcUrls.default.http[0]
  );
}

export function getChainId(): number {
  return getActiveChain().id;
}

export function getExplorerBaseUrl(): string {
  return getActiveChain().blockExplorers?.default.url ?? "";
}

export function getTxExplorerUrl(hash: string): string {
  const base = getExplorerBaseUrl().replace(/\/$/, "");
  return `${base}/tx/${hash}`;
}

export function getAddressExplorerUrl(address: string): string {
  const base = getExplorerBaseUrl().replace(/\/$/, "");
  return `${base}/address/${address}`;
}
