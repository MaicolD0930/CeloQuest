import { formatUnits, type Hash } from "viem";
import { prisma } from "@/lib/prisma";
import { MINIPAY_SEPOLIA, MINIPAY_MAINNET } from "@/lib/chain/minipay-tokens";
import {
  getCopmTokenConfig,
  getRecoveryTokenAddress,
  getRecoveryTokenConfig,
  getUsdcTokenConfig,
  normalizeRecoveryTokenParam,
  type RecoveryTokenId,
} from "@/lib/tokens/recovery";
import { formatRecoveryPriceFromAtomic, getRecoveryPriceAtomicAsync } from "@/lib/pricing/recovery-price";

export type PaymentStatus = "pending" | "confirmed" | "failed";

export type RecoveryPaymentRecord = {
  userWallet: string;
  tokenAddress: string;
  tokenSymbol: string;
  amount: string;
  txHash: string;
};

export function symbolForTokenAddress(tokenAddress: string): string {
  const normalized = tokenAddress.toLowerCase();
  const tcopm = getCopmTokenConfig().address?.toLowerCase();
  const usdc = getUsdcTokenConfig().address?.toLowerCase();
  const minipayUsdc = [
    MINIPAY_SEPOLIA.USDC,
    MINIPAY_MAINNET.USDC,
  ].map((a) => a.toLowerCase());
  if (tcopm && normalized === tcopm) return getCopmTokenConfig().symbol;
  if (usdc && normalized === usdc) return "USDC";
  if (minipayUsdc.includes(normalized)) return "USDC";
  return "TOKEN";
}

/** Short label for admin lists when symbol is missing or is a raw address. */
export function formatPaymentTokenLabel(symbolOrAddress: string): string {
  const s = symbolOrAddress.trim();
  if (!s) return "TOKEN";
  if (s === "tCOPM" || s === "cCOPM" || s === "USDC" || s === "TOKEN") return s;
  if (s.startsWith("0x") && s.length >= 42) {
    return `${s.slice(0, 6)}…${s.slice(-4)}`;
  }
  return s.length > 14 ? `${s.slice(0, 10)}…` : s;
}

export async function recordRecoveryPayment(
  input: RecoveryPaymentRecord,
  status: PaymentStatus = "confirmed"
): Promise<void> {
  const txHash = input.txHash.toLowerCase();

  const existing = await prisma.payment.findUnique({ where: { txHash } });
  if (existing) {
    if (existing.status === "pending" && status === "confirmed") {
      await prisma.payment.update({
        where: { txHash },
        data: {
          status: "confirmed",
          userWallet: input.userWallet.toLowerCase(),
          tokenAddress: input.tokenAddress.toLowerCase(),
          tokenSymbol: input.tokenSymbol,
          amount: input.amount,
        },
      });
    }
    return;
  }

  await prisma.payment.create({
    data: {
      userWallet: input.userWallet.toLowerCase(),
      tokenAddress: input.tokenAddress.toLowerCase(),
      tokenSymbol: input.tokenSymbol,
      amount: input.amount,
      txHash,
      status,
    },
  });
}

/** Optimistic MiniPay: register tx before receipt is indexed. */
export async function recordPendingRecoveryPayment(params: {
  txHash: string;
  userWallet: string;
  token: string;
}): Promise<void> {
  const txHash = params.txHash.toLowerCase();
  const existing = await prisma.payment.findUnique({ where: { txHash } });
  if (existing) return;

  const tokenId = normalizeRecoveryTokenParam(params.token) as RecoveryTokenId;
  const tokenAddress = getRecoveryTokenAddress(tokenId);
  const amountAtomic = await getRecoveryPriceAtomicAsync(tokenId);
  const symbol =
    tokenId === "USDC" ? "USDC" : getCopmTokenConfig().symbol;

  await prisma.payment.create({
    data: {
      userWallet: params.userWallet.toLowerCase(),
      tokenAddress: (tokenAddress ?? "0x0").toLowerCase(),
      tokenSymbol: symbol,
      amount: formatRecoveryPriceFromAtomic(tokenId, amountAtomic),
      txHash,
      status: "pending",
    },
  });
}

export async function markRecoveryPaymentFailed(txHash: string): Promise<void> {
  const normalized = txHash.toLowerCase();
  await prisma.payment.updateMany({
    where: { txHash: normalized, status: "pending" },
    data: { status: "failed" },
  });
}

export function buildPaymentRecordFromEvent(params: {
  txHash: Hash;
  userWallet: string;
  tokenAddress: `0x${string}`;
  amountAtomic: bigint;
  tokenParam?: string;
}): RecoveryPaymentRecord {
  const tokenId = params.tokenParam
    ? normalizeRecoveryTokenParam(params.tokenParam)
    : null;
  const symbol =
    tokenId === "USDC"
      ? "USDC"
      : tokenId === "tCOPM" || tokenId === "cCOPM"
        ? getCopmTokenConfig().symbol
        : symbolForTokenAddress(params.tokenAddress);

  const decimals =
    (tokenId && getRecoveryTokenConfig(tokenId)?.decimals) ??
    getCopmTokenConfig().decimals;

  return {
    userWallet: params.userWallet.toLowerCase(),
    tokenAddress: params.tokenAddress.toLowerCase(),
    tokenSymbol: symbol,
    amount: formatUnits(params.amountAtomic, decimals),
    txHash: params.txHash.toLowerCase(),
  };
}
