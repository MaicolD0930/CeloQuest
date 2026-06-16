import {
  createPublicClient,
  createWalletClient,
  custom,
  encodeFunctionData,
  http,
  type Hash,
  type Chain,
} from "viem";
import { getActiveChain, getRpcUrl } from "@/lib/chain/config";
import { erc20ExtendedAbi } from "@/lib/contracts/recovery-payment-abi";
import {
  getAvailableRecoveryTokens as getConfiguredRecoveryTokens,
  getRecoveryTreasury,
  RECOVERY_DEMO_MODE,
  type RecoveryTokenId,
} from "@/lib/tokens/recovery";
import {
  checkCopmRecoveryEligibility,
  getCopmBalance,
  hasSufficientCopmBalance,
} from "@/lib/tokens/tcopm";
import {
  discoverWalletProviders,
  ensureCorrectChain,
  hasAnyWalletInstalled,
  resolveWalletProvider,
  type WalletProviderId,
} from "@/lib/wallet-providers";
import {
  encodePurchaseRecovery,
  type PreparedRecoveryPayment,
} from "@/lib/payments/prepare-recovery";

export type RecoveryToken = RecoveryTokenId;
export type { WalletProviderId };

export {
  checkCopmRecoveryEligibility,
  getCopmBalance,
  hasSufficientCopmBalance,
  hasAnyWalletInstalled,
};

export function hasInjectedWallet(): boolean {
  return hasAnyWalletInstalled();
}

export function isMiniPay(): boolean {
  return discoverWalletProviders().some((w) => w.id === "minipay" && w.installed);
}

/** MiniPay requires legacy txs (no maxFeePerGas / maxPriorityFeePerGas). */
function shouldUseLegacyTransactions(providerId?: WalletProviderId): boolean {
  return providerId === "minipay" || isMiniPay();
}

async function sendWalletTransaction(
  walletClient: ReturnType<typeof createWalletClient>,
  publicClient: ReturnType<typeof createPublicClient>,
  params: {
    account: `0x${string}`;
    to: `0x${string}`;
    data: `0x${string}`;
    chain: Chain;
  },
  providerId?: WalletProviderId
): Promise<Hash> {
  if (shouldUseLegacyTransactions(providerId)) {
    const gasPrice = await publicClient.getGasPrice();
    return walletClient.sendTransaction({
      chain: params.chain,
      account: params.account,
      to: params.to,
      data: params.data,
      type: "legacy",
      gasPrice,
    });
  }

  return walletClient.sendTransaction({
    chain: params.chain,
    account: params.account,
    to: params.to,
    data: params.data,
  });
}

export async function connectWallet(providerId?: WalletProviderId): Promise<string> {
  const provider = resolveWalletProvider(providerId);
  const miniPayConnect = providerId === "minipay" || isMiniPay();
  try {
    await ensureCorrectChain(provider);
  } catch (err) {
    // MiniPay login uses wallet address only; chain switch may fail on mainnet.
    if (!miniPayConnect) throw err;
  }
  const client = createWalletClient({
    chain: getActiveChain(),
    transport: custom(provider),
  });
  const [address] = await client.requestAddresses();
  if (!address) throw new Error("NO_ACCOUNT");
  return address;
}

async function fetchPreparedPayment(
  token: RecoveryTokenId
): Promise<PreparedRecoveryPayment & { walletAddress: string }> {
  const res = await fetch(
    `/api/challenge/refill/prepare?token=${encodeURIComponent(token)}`,
    { credentials: "include" }
  );

  if (res.status === 503) throw new Error("PAYMENT_NOT_CONFIGURED");
  if (!res.ok) throw new Error("PREPARE_FAILED");

  const data = await res.json();
  if (!data.walletAddress) throw new Error("PREPARE_FAILED");
  return data;
}

async function ensureTokenAllowance(
  walletClient: ReturnType<typeof createWalletClient>,
  account: `0x${string}`,
  tokenAddress: `0x${string}`,
  spender: `0x${string}`,
  required: bigint,
  providerId?: WalletProviderId
): Promise<void> {
  const publicClient = createPublicClient({
    chain: getActiveChain(),
    transport: http(getRpcUrl()),
  });

  const balance = await publicClient.readContract({
    address: tokenAddress,
    abi: erc20ExtendedAbi,
    functionName: "balanceOf",
    args: [account],
  });
  if (balance < required) throw new Error("INSUFFICIENT_BALANCE");

  const allowance = await publicClient.readContract({
    address: tokenAddress,
    abi: erc20ExtendedAbi,
    functionName: "allowance",
    args: [account, spender],
  });

  if (allowance >= required) return;

  const approveData = encodeFunctionData({
    abi: erc20ExtendedAbi,
    functionName: "approve",
    args: [spender, required],
  });

  const chain = getActiveChain();

  const approveHash = await sendWalletTransaction(
    walletClient,
    publicClient,
    {
      chain,
      account,
      to: tokenAddress,
      data: approveData,
    },
    providerId
  );

  await publicClient.waitForTransactionReceipt({ hash: approveHash });
}

/**
 * Approve (if needed) and call RecoveryPaymentContract.purchaseRecovery.
 * Returns tx hash and normalized token id.
 */
export async function sendRecoveryPayment(
  token: RecoveryTokenId,
  providerId?: WalletProviderId,
  expectedWallet?: string
): Promise<{ hash: Hash; token: RecoveryTokenId }> {
  if (RECOVERY_DEMO_MODE && !getRecoveryTreasury()) {
    return {
      hash: ("0x" + "demo".repeat(21)) as Hash,
      token,
    };
  }

  const prepared = await fetchPreparedPayment(token);
  const payer = expectedWallet ?? prepared.walletAddress;
  const required = BigInt(prepared.recoveryPrice);

  const provider = resolveWalletProvider(providerId);
  await ensureCorrectChain(provider);

  const walletClient = createWalletClient({
    chain: getActiveChain(),
    transport: custom(provider),
  });
  const accounts = await walletClient.requestAddresses();
  if (accounts.length === 0) throw new Error("NO_ACCOUNT");

  const expected = payer.toLowerCase();
  const account = accounts.find((a) => a.toLowerCase() === expected);
  if (!account) throw new Error("WALLET_MISMATCH");

  await ensureTokenAllowance(
    walletClient,
    account,
    prepared.tokenAddress,
    prepared.contractAddress,
    required,
    providerId
  );

  const data = encodePurchaseRecovery(prepared.tokenAddress);
  const chain = getActiveChain();
  const publicClient = createPublicClient({
    chain,
    transport: http(getRpcUrl()),
  });
  const hash = await sendWalletTransaction(
    walletClient,
    publicClient,
    {
      chain,
      account,
      to: prepared.contractAddress,
      data,
    },
    providerId
  );

  await publicClient.waitForTransactionReceipt({ hash });

  return { hash, token: prepared.token };
}

export function getAvailableRecoveryTokens(): RecoveryTokenId[] {
  return getConfiguredRecoveryTokens().map((t) => t.id);
}
