import { celo, celoSepolia } from "viem/chains";
import type { Chain } from "viem";

export type CeloNetwork = "sepolia" | "mainnet";

let clientNetworkOverride: CeloNetwork | null = null;

/** Set after /api/app-config loads on the client. */
export function setClientNetworkOverride(network: CeloNetwork): void {
  clientNetworkOverride = network;
}

function resolveNetworkFromEnv(): CeloNetwork {
  const fallback =
    process.env.NODE_ENV === "production" ? "mainnet" : "sepolia";
  // Server (Vercel): CELO_NETWORK is runtime — must win over build-time NEXT_PUBLIC_*.
  const raw =
    typeof window === "undefined"
      ? (process.env.CELO_NETWORK ??
        process.env.NEXT_PUBLIC_CELO_NETWORK ??
        fallback)
      : (process.env.NEXT_PUBLIC_CELO_NETWORK ??
        process.env.CELO_NETWORK ??
        fallback);
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

function isSepoliaRpcUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.includes("sepolia") || lower.includes("celo-testnet");
}

function pickMainnetRpc(): string {
  const candidates = [
    process.env.CELO_RPC_URL,
    process.env.NEXT_PUBLIC_CELO_RPC_URL,
    celo.rpcUrls.default.http[0],
  ].filter((u): u is string => Boolean(u));
  return candidates.find((u) => !isSepoliaRpcUrl(u)) ?? celo.rpcUrls.default.http[0];
}

function pickSepoliaRpc(): string {
  const candidates = [
    process.env.CELO_SEPOLIA_RPC_URL,
    process.env.CELO_RPC_URL,
    process.env.NEXT_PUBLIC_CELO_RPC_URL,
    celoSepolia.rpcUrls.default.http[0],
    "https://forno.celo-sepolia.celo-testnet.org",
  ].filter((u): u is string => Boolean(u));
  return candidates.find((u) => isSepoliaRpcUrl(u)) ?? celoSepolia.rpcUrls.default.http[0];
}

export function getRpcUrl(): string {
  return getCeloNetwork() === "mainnet" ? pickMainnetRpc() : pickSepoliaRpc();
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
