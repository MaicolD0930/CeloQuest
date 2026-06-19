import {
  createPublicClient,
  custom,
  fallback,
  http,
  type EIP1193Provider,
  type Hash,
  type PublicClient,
} from "viem";
import { celo, celoSepolia } from "viem/chains";
import { getActiveChain, getCeloNetwork } from "@/lib/chain/config";

/** RPC endpoints for reads / receipt polling (fallback when one node lags). */
export function getRpcUrls(): string[] {
  const network = getCeloNetwork();
  const urls: string[] = [];

  if (network === "mainnet") {
    for (const url of [
      process.env.CELO_RPC_URL,
      process.env.NEXT_PUBLIC_CELO_RPC_URL,
      celo.rpcUrls.default.http[0],
    ]) {
      if (url && !url.toLowerCase().includes("sepolia")) urls.push(url);
    }
  } else {
    if (process.env.CELO_SEPOLIA_RPC_URL) {
      urls.push(process.env.CELO_SEPOLIA_RPC_URL);
    }
    for (const url of [
      process.env.CELO_RPC_URL,
      process.env.NEXT_PUBLIC_CELO_RPC_URL,
    ]) {
      if (url && url.toLowerCase().includes("sepolia")) urls.push(url);
    }
    urls.push(celoSepolia.rpcUrls.default.http[0]);
    urls.push("https://forno.celo-sepolia.celo-testnet.org");
  }

  return [...new Set(urls.filter((u) => u.length > 0))];
}

/** Server / desktop reads with RPC fallbacks. */
export function createChainPublicClient(): PublicClient {
  const chain = getActiveChain();
  const urls = getRpcUrls();
  if (urls.length <= 1) {
    return createPublicClient({
      chain,
      transport: http(urls[0] ?? chain.rpcUrls.default.http[0]),
    });
  }
  return createPublicClient({
    chain,
    transport: fallback(urls.map((url) => http(url))),
  });
}

/**
 * MiniPay: read chain state through the in-app wallet provider so network,
 * balances and receipts match what the user sees in the wallet.
 */
export function createProviderPublicClient(
  provider: EIP1193Provider
): PublicClient {
  return createPublicClient({
    chain: getActiveChain(),
    transport: custom(provider),
  });
}

export function normalizeTxHash(hash: string): Hash {
  const trimmed = hash.trim();
  const hex = trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;
  return hex.toLowerCase() as Hash;
}
