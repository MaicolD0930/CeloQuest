import type { EIP1193Provider } from "viem";
import { getActiveChain } from "@/lib/chain/config";

export type WalletProviderId = "metamask" | "rabby" | "minipay";

type InjectedProvider = EIP1193Provider & {
  isMetaMask?: boolean;
  isRabby?: boolean;
  isMiniPay?: boolean;
  providers?: InjectedProvider[];
};

type EIP6963ProviderInfo = {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
};

type EIP6963ProviderDetail = {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
};

declare global {
  interface Window {
    ethereum?: InjectedProvider;
    rabby?: InjectedProvider;
  }
}

const STORAGE_KEY = "celoquest-wallet-provider";

const RDNS: Record<WalletProviderId, string> = {
  metamask: "io.metamask",
  rabby: "io.rabby",
  minipay: "com.minipay",
};

const eip6963Providers: Partial<Record<WalletProviderId, EIP1193Provider>> = {};
let eip6963Initialized = false;

function initEip6963Discovery() {
  if (typeof window === "undefined" || eip6963Initialized) return;
  eip6963Initialized = true;

  const onAnnounce = (event: Event) => {
    const detail = (event as CustomEvent<EIP6963ProviderDetail>).detail;
    const rdns = detail.info.rdns.toLowerCase();
    if (rdns.includes("metamask")) eip6963Providers.metamask = detail.provider;
    if (rdns.includes("rabby")) eip6963Providers.rabby = detail.provider;
    if (rdns.includes("minipay")) eip6963Providers.minipay = detail.provider;
  };

  window.addEventListener("eip6963:announceProvider", onAnnounce);
  window.dispatchEvent(new Event("eip6963:requestProvider"));
}

function getInjectedProviders(): InjectedProvider[] {
  if (typeof window === "undefined") return [];
  const eth = window.ethereum;
  if (!eth) return [];
  if (Array.isArray(eth.providers) && eth.providers.length > 0) {
    return eth.providers;
  }
  return [eth];
}

function findMetaMaskProvider(): InjectedProvider | null {
  initEip6963Discovery();
  if (eip6963Providers.metamask) return eip6963Providers.metamask as InjectedProvider;

  for (const p of getInjectedProviders()) {
    if (p.isMetaMask && !p.isRabby) return p;
  }
  return null;
}

function findRabbyProvider(): InjectedProvider | null {
  initEip6963Discovery();
  if (eip6963Providers.rabby) return eip6963Providers.rabby as InjectedProvider;
  if (window.rabby) return window.rabby;

  for (const p of getInjectedProviders()) {
    if (p.isRabby) return p;
  }
  return null;
}

function findMiniPayProvider(): InjectedProvider | null {
  initEip6963Discovery();
  if (eip6963Providers.minipay) return eip6963Providers.minipay as InjectedProvider;

  for (const p of getInjectedProviders()) {
    if (p.isMiniPay) return p;
  }
  return null;
}

export type WalletOption = {
  id: WalletProviderId;
  name: string;
  installed: boolean;
  provider: EIP1193Provider | null;
};

const RESOLVERS: Record<WalletProviderId, () => InjectedProvider | null> = {
  metamask: findMetaMaskProvider,
  rabby: findRabbyProvider,
  minipay: findMiniPayProvider,
};

/** Discover MetaMask, Rabby and MiniPay availability in the browser. */
export function discoverWalletProviders(): WalletOption[] {
  if (typeof window === "undefined") {
    return [
      { id: "metamask", name: "MetaMask", installed: false, provider: null },
      { id: "rabby", name: "Rabby", installed: false, provider: null },
    ];
  }

  initEip6963Discovery();

  const metamask = findMetaMaskProvider();
  const rabby = findRabbyProvider();
  const minipay = findMiniPayProvider();

  const options: WalletOption[] = [
    { id: "metamask", name: "MetaMask", installed: !!metamask, provider: metamask },
    { id: "rabby", name: "Rabby", installed: !!rabby, provider: rabby },
  ];

  if (minipay) {
    options.unshift({
      id: "minipay",
      name: "MiniPay",
      installed: true,
      provider: minipay,
    });
  }

  return options;
}

export function getWalletProvider(id: WalletProviderId): EIP1193Provider | null {
  return RESOLVERS[id]() ?? null;
}

export function resolveWalletProvider(id?: WalletProviderId | null): EIP1193Provider {
  const preferred = id ?? getPreferredWalletProvider();
  if (preferred) {
    const provider = getWalletProvider(preferred);
    if (provider) return provider;
    throw new Error("WALLET_NOT_INSTALLED");
  }

  const metamask = findMetaMaskProvider();
  if (metamask) return metamask;
  const rabby = findRabbyProvider();
  if (rabby) return rabby;
  const minipay = findMiniPayProvider();
  if (minipay) return minipay;

  throw new Error("NO_WALLET");
}

export function savePreferredWalletProvider(id: WalletProviderId) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, id);
}

export function getPreferredWalletProvider(): WalletProviderId | null {
  if (typeof window === "undefined") return null;
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (stored === "metamask" || stored === "rabby" || stored === "minipay") {
    return stored;
  }
  return null;
}

export function hasAnyWalletInstalled(): boolean {
  return discoverWalletProviders().some((w) => w.installed);
}

export async function getProviderChainId(
  provider: EIP1193Provider
): Promise<number> {
  const hex = (await provider.request({ method: "eth_chainId" })) as string;
  return Number.parseInt(hex, 16);
}

/**
 * MiniPay cannot switch chains programmatically — only verify the wallet is
 * already on the network the app expects.
 */
export async function assertProviderOnActiveChain(
  provider: EIP1193Provider
): Promise<void> {
  const expected = getActiveChain().id;
  let current: number;
  try {
    current = await getProviderChainId(provider);
  } catch {
    throw new Error("WRONG_NETWORK");
  }
  if (current !== expected) throw new Error("WRONG_NETWORK");
}

/** Switch (or add) the active Celo network on the chosen wallet. */
export async function ensureCorrectChain(provider: EIP1193Provider): Promise<void> {
  const chain = getActiveChain();
  const chainId = `0x${chain.id.toString(16)}`;

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId }],
    });
  } catch (err: unknown) {
    const code =
      err && typeof err === "object" && "code" in err
        ? (err as { code: number }).code
        : null;

    if (code === 4001) throw new Error("USER_REJECTED");

    if (code === 4902) {
      try {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId,
              chainName: chain.name,
              nativeCurrency: chain.nativeCurrency,
              rpcUrls: chain.rpcUrls.default.http,
              blockExplorerUrls: chain.blockExplorers
                ? [chain.blockExplorers.default.url]
                : [],
            },
          ],
        });
        return;
      } catch (addErr: unknown) {
        const addCode =
          addErr && typeof addErr === "object" && "code" in addErr
            ? (addErr as { code: number }).code
            : null;
        if (addCode === 4001) throw new Error("USER_REJECTED");
        throw new Error("WRONG_NETWORK");
      }
    }

    throw new Error("WRONG_NETWORK");
  }
}

export function getWalletInstallUrl(id: WalletProviderId): string {
  if (id === "metamask") return "https://metamask.io/download/";
  if (id === "rabby") return "https://rabby.io/";
  return "https://minipay.xyz/";
}

export { RDNS };
