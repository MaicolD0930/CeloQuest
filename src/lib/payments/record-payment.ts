import { formatUnits, type Hash } from "viem";
import { prisma } from "@/lib/prisma";
import {
  getCopmTokenConfig,
  getUsdcTokenConfig,
  normalizeRecoveryTokenParam,
} from "@/lib/tokens/recovery";

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
  if (tcopm && normalized === tcopm) return getCopmTokenConfig().symbol;
  if (usdc && normalized === usdc) return "USDC";
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
  input: RecoveryPaymentRecord
): Promise<void> {
  const txHash = input.txHash.toLowerCase();

  const existing = await prisma.payment.findUnique({ where: { txHash } });
  if (existing) return;

  await prisma.payment.create({
    data: {
      userWallet: input.userWallet.toLowerCase(),
      tokenAddress: input.tokenAddress.toLowerCase(),
      tokenSymbol: input.tokenSymbol,
      amount: input.amount,
      txHash,
    },
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

  return {
    userWallet: params.userWallet.toLowerCase(),
    tokenAddress: params.tokenAddress.toLowerCase(),
    tokenSymbol: symbol,
    amount: formatUnits(params.amountAtomic, 6),
    txHash: params.txHash.toLowerCase(),
  };
}
