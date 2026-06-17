import {
  createWalletClient,
  custom,
  encodeFunctionData,
  type Hash,
  type Chain,
  type EIP1193Provider,
  type PublicClient,
} from "viem";
import { getActiveChain } from "@/lib/chain/config";
import {
  createChainPublicClient,
  createProviderPublicClient,
} from "@/lib/chain/public-client";
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
  assertProviderOnActiveChain,
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

function isMiniPayPayment(providerId?: WalletProviderId): boolean {
  return providerId === "minipay" || isMiniPay();
}

/**
 * MiniPay: legacy txs only; the wallet sets gas / feeCurrency internally.
 * MetaMask / Rabby: default viem send (EIP-1559 when supported).
 */
function shouldUseLegacyTransactions(providerId?: WalletProviderId): boolean {
  return isMiniPayPayment(providerId);
}

function resolveReadClient(
  provider: EIP1193Provider,
  providerId?: WalletProviderId
): PublicClient {
  if (isMiniPayPayment(providerId)) {
    return createProviderPublicClient(provider);
  }
  return createChainPublicClient();
}

const MINIPAY_RECEIPT_POLL_MS = [0, 2000, 3000, 5000, 8000, 12000, 15000, 20000];
const DEFAULT_RECEIPT_POLL_MS = [0, 1500, 3000, 5000, 8000];

/** Poll for a receipt without failing when the RPC is slow (common in MiniPay). */
async function waitForReceiptSoft(
  publicClient: PublicClient,
  hash: Hash,
  providerId?: WalletProviderId
): Promise<"success" | "reverted" | "pending"> {
  const delays = isMiniPayPayment(providerId)
    ? MINIPAY_RECEIPT_POLL_MS
    : DEFAULT_RECEIPT_POLL_MS;

  for (const delayMs of delays) {
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    try {
      const receipt = await publicClient.getTransactionReceipt({ hash });
      if (receipt.status === "reverted") return "reverted";
      return "success";
    } catch {
      // receipt not indexed yet
    }
  }
  return "pending";
}

async function waitForAllowanceAfterApprove(
  publicClient: PublicClient,
  tokenAddress: `0x${string}`,
  account: `0x${string}`,
  spender: `0x${string}`,
  required: bigint,
  approveHash: Hash,
  providerId?: WalletProviderId
): Promise<void> {
  const receiptStatus = await waitForReceiptSoft(
    publicClient,
    approveHash,
    providerId
  );
  if (receiptStatus === "reverted") throw new Error("TX_FAILED");

  if (receiptStatus === "success") return;

  const allowancePolls = isMiniPayPayment(providerId) ? 12 : 8;
  for (let i = 0; i < allowancePolls; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const allowance = await publicClient.readContract({
      address: tokenAddress,
      abi: erc20ExtendedAbi,
      functionName: "allowance",
      args: [account, spender],
    });
    if (allowance >= required) return;
  }

  throw new Error("TX_NOT_FOUND");
}

async function sendWalletTransaction(
  walletClient: ReturnType<typeof createWalletClient>,
  params: {
    account: `0x${string}`;
    to: `0x${string}`;
    data: `0x${string}`;
    chain: Chain;
  },
  providerId?: WalletProviderId
): Promise<Hash> {
  const base = {
    chain: params.chain,
    account: params.account,
    to: params.to,
    data: params.data,
  };

  if (shouldUseLegacyTransactions(providerId)) {
    return walletClient.sendTransaction({
      ...base,
      type: "legacy",
    });
  }

  return walletClient.sendTransaction(base);
}

export async function connectWallet(providerId?: WalletProviderId): Promise<string> {
  const provider = resolveWalletProvider(providerId);
  const miniPayConnect = isMiniPayPayment(providerId);
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
  provider: EIP1193Provider,
  account: `0x${string}`,
  tokenAddress: `0x${string}`,
  spender: `0x${string}`,
  required: bigint,
  providerId?: WalletProviderId
): Promise<void> {
  const publicClient = resolveReadClient(provider, providerId);

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
    {
      chain,
      account,
      to: tokenAddress,
      data: approveData,
    },
    providerId
  );

  await waitForAllowanceAfterApprove(
    publicClient,
    tokenAddress,
    account,
    spender,
    required,
    approveHash,
    providerId
  );
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
  const miniPayPay = isMiniPayPayment(providerId);
  if (miniPayPay) {
    await assertProviderOnActiveChain(provider);
  } else {
    await ensureCorrectChain(provider);
  }

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
    provider,
    account,
    prepared.tokenAddress,
    prepared.contractAddress,
    required,
    providerId
  );

  const data = encodePurchaseRecovery(prepared.tokenAddress);
  const chain = getActiveChain();
  const publicClient = resolveReadClient(provider, providerId);
  const hash = await sendWalletTransaction(
    walletClient,
    {
      chain,
      account,
      to: prepared.contractAddress,
      data,
    },
    providerId
  );

  const receiptStatus = await waitForReceiptSoft(publicClient, hash, providerId);
  if (receiptStatus === "reverted") throw new Error("TX_FAILED");

  return { hash, token: prepared.token };
}

export function getAvailableRecoveryTokens(): RecoveryTokenId[] {
  return getConfiguredRecoveryTokens().map((t) => t.id);
}
