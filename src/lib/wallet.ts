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
import { getMiniPayFeeCurrency } from "@/lib/chain/fee-currency";
import {
  isCustomSepoliaTcopm,
  resolveMiniPaySendTokenAddress,
} from "@/lib/chain/minipay-tokens";
import {
  normalizeWalletTxError,
  sendMiniPayTransaction,
} from "@/lib/wallet/minipay-tx";

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

async function readTokenAllowance(
  providerClient: PublicClient,
  chainClient: PublicClient,
  tokenAddress: `0x${string}`,
  account: `0x${string}`,
  spender: `0x${string}`
): Promise<bigint> {
  const read = async (client: PublicClient) =>
    client.readContract({
      address: tokenAddress,
      abi: erc20ExtendedAbi,
      functionName: "allowance",
      args: [account, spender],
    });

  const [fromProvider, fromChain] = await Promise.all([
    read(providerClient).catch(() => BigInt(0)),
    read(chainClient).catch(() => BigInt(0)),
  ]);

  return fromProvider > fromChain ? fromProvider : fromChain;
}

async function waitForAllowanceAfterApprove(
  providerClient: PublicClient,
  chainClient: PublicClient,
  tokenAddress: `0x${string}`,
  account: `0x${string}`,
  spender: `0x${string}`,
  required: bigint,
  approveHash: Hash,
  providerId?: WalletProviderId
): Promise<void> {
  const receiptStatus = await waitForReceiptSoft(
    providerClient,
    approveHash,
    providerId
  );
  if (receiptStatus === "reverted") throw new Error("TX_FAILED");

  const miniPay = isMiniPayPayment(providerId);
  if (miniPay) {
    await new Promise((r) => setTimeout(r, 5000));
  }

  const allowancePolls = miniPay ? 30 : 15;
  const pollMs = miniPay ? 2000 : 1500;

  for (let i = 0; i < allowancePolls; i++) {
    const allowance = await readTokenAllowance(
      providerClient,
      chainClient,
      tokenAddress,
      account,
      spender
    );
    if (allowance >= required) return;
    await new Promise((r) => setTimeout(r, pollMs));
  }

  throw new Error("APPROVE_PENDING");
}

async function sendWalletTransaction(
  walletClient: ReturnType<typeof createWalletClient>,
  provider: EIP1193Provider,
  params: {
    account: `0x${string}`;
    to: `0x${string}`;
    data: `0x${string}`;
    chain: Chain;
  },
  providerId?: WalletProviderId
): Promise<Hash> {
  if (isMiniPayPayment(providerId)) {
    return sendMiniPayTransaction(provider, {
      from: params.account,
      to: params.to,
      data: params.data,
      chain: params.chain,
    });
  }

  try {
    return await walletClient.sendTransaction({
      chain: params.chain,
      account: params.account,
      to: params.to,
      data: params.data,
    });
  } catch (err) {
    throw normalizeWalletTxError(err);
  }
}

export async function connectWallet(providerId?: WalletProviderId): Promise<string> {
  const provider = resolveWalletProvider(providerId);
  const miniPayConnect = isMiniPayPayment(providerId);
  try {
    await ensureCorrectChain(provider);
  } catch (err) {
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
  const providerClient = resolveReadClient(provider, providerId);
  const chainClient = createChainPublicClient();

  const balance = await providerClient.readContract({
    address: tokenAddress,
    abi: erc20ExtendedAbi,
    functionName: "balanceOf",
    args: [account],
  });
  if (balance < required) throw new Error("INSUFFICIENT_BALANCE");

  const allowance = await readTokenAllowance(
    providerClient,
    chainClient,
    tokenAddress,
    account,
    spender
  );

  if (allowance >= required) return;

  const approveData = encodeFunctionData({
    abi: erc20ExtendedAbi,
    functionName: "approve",
    args: [spender, required],
  });

  const chain = getActiveChain();

  const approveHash = await sendWalletTransaction(
    walletClient,
    provider,
    {
      chain,
      account,
      to: tokenAddress,
      data: approveData,
    },
    providerId
  );

  await waitForAllowanceAfterApprove(
    providerClient,
    chainClient,
    tokenAddress,
    account,
    spender,
    required,
    approveHash,
    providerId
  );
}

async function sendPurchaseWithRetries(
  walletClient: ReturnType<typeof createWalletClient>,
  provider: EIP1193Provider,
  providerClient: PublicClient,
  chainClient: PublicClient,
  params: {
    account: `0x${string}`;
    contractAddress: `0x${string}`;
    tokenAddress: `0x${string}`;
    required: bigint;
    chain: Chain;
  },
  providerId?: WalletProviderId
): Promise<Hash> {
  const data = encodePurchaseRecovery(params.tokenAddress);
  const miniPay = isMiniPayPayment(providerId);
  const attempts = miniPay ? 6 : 1;
  const retryMs = miniPay ? 4000 : 0;
  let lastError: unknown = new Error("WALLET_TX_FAILED");

  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, retryMs));
    }

    const allowance = await readTokenAllowance(
      providerClient,
      chainClient,
      params.tokenAddress,
      params.account,
      params.contractAddress
    );
    if (allowance < params.required) {
      lastError = new Error("APPROVE_PENDING");
      continue;
    }

    try {
      const hash = await sendWalletTransaction(
        walletClient,
        provider,
        {
          chain: params.chain,
          account: params.account,
          to: params.contractAddress,
          data,
        },
        providerId
      );

      const receiptStatus = await waitForReceiptSoft(
        providerClient,
        hash,
        providerId
      );
      if (receiptStatus === "reverted") {
        lastError = new Error("TX_FAILED");
        continue;
      }

      return hash;
    } catch (err) {
      lastError = err;
      const normalized = normalizeWalletTxError(err);
      if (normalized.message === "USER_REJECTED") throw normalized;
    }
  }

  throw normalizeWalletTxError(lastError);
}

/** MiniPay: single ERC-20 transfer to treasury (no approve + contract call). */
async function sendMiniPayDirectTransfer(
  provider: EIP1193Provider,
  account: `0x${string}`,
  prepared: PreparedRecoveryPayment & { walletAddress: string },
  providerId?: WalletProviderId
): Promise<Hash> {
  const required = BigInt(prepared.recoveryPrice);
  const tokenAddress = resolveMiniPaySendTokenAddress(
    prepared.token,
    prepared.tokenAddress
  );

  if (isCustomSepoliaTcopm(prepared.tokenAddress)) {
    throw new Error("MINIPAY_CUSTOM_TCOPM");
  }

  const data = encodeFunctionData({
    abi: erc20ExtendedAbi,
    functionName: "transfer",
    args: [prepared.treasuryAddress, required],
  });

  const feeCurrency = getMiniPayFeeCurrency(prepared.token);

  return sendMiniPayTransaction(provider, {
    from: account,
    to: tokenAddress,
    data,
    chain: getActiveChain(),
    ...(feeCurrency ? { feeCurrency } : {}),
  });
}

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
  if (!miniPayPay) {
    await ensureCorrectChain(provider);
  }

  const walletClient = createWalletClient({
    chain: getActiveChain(),
    transport: custom(provider),
  });
  const accounts = await walletClient.requestAddresses();
  if (accounts.length === 0) throw new Error("NO_ACCOUNT");

  let account: `0x${string}`;
  if (miniPayPay) {
    // MiniPay: always use the active in-app account (session wallet can lag).
    account = accounts[0];
  } else {
    const expected = payer.toLowerCase();
    const matched = accounts.find((a) => a.toLowerCase() === expected);
    if (!matched) throw new Error("WALLET_MISMATCH");
    account = matched;
  }

  if (miniPayPay) {
    const hash = await sendMiniPayDirectTransfer(
      provider,
      account,
      prepared,
      providerId
    );
    // Do not poll receipt via MiniPay provider — eth_getTransactionReceipt can hang.
    return { hash, token: prepared.token };
  }

  await ensureTokenAllowance(
    walletClient,
    provider,
    account,
    prepared.tokenAddress,
    prepared.contractAddress,
    required,
    providerId
  );

  const chain = getActiveChain();
  const providerClient = resolveReadClient(provider, providerId);
  const chainClient = createChainPublicClient();

  const hash = await sendPurchaseWithRetries(
    walletClient,
    provider,
    providerClient,
    chainClient,
    {
      account,
      contractAddress: prepared.contractAddress,
      tokenAddress: prepared.tokenAddress,
      required,
      chain,
    },
    providerId
  );

  return { hash, token: prepared.token };
}

export function getAvailableRecoveryTokens(): RecoveryTokenId[] {
  return getConfiguredRecoveryTokens().map((t) => t.id);
}
