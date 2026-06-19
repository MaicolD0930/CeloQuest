import { celo, celoSepolia } from "viem/chains";
import type { Chain } from "viem";

export type CeloNetwork = "sepolia" | "mainnet";

export function getCeloNetwork(): CeloNetwork {
  const network = (
    process.env.NEXT_PUBLIC_CELO_NETWORK ??
    process.env.CELO_NETWORK ??
    (process.env.NODE_ENV === "production" ? "mainnet" : "sepolia")
  ).toLowerCase();
  return network === "mainnet" ? "mainnet" : "sepolia";
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
