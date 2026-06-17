import type { EIP1193Provider, Hash } from "viem";

/** Map viem / provider errors to stable codes for the UI. */
export function normalizeWalletTxError(err: unknown): Error {
  if (!(err instanceof Error)) return new Error("WALLET_TX_FAILED");

  const msg = err.message.toLowerCase();
  const code =
    err && typeof err === "object" && "code" in err
      ? (err as { code: number }).code
      : null;

  if (code === 4001 || msg.includes("reject") || msg.includes("denied")) {
    return new Error("USER_REJECTED");
  }
  if (
    msg.includes("insufficient") ||
    msg.includes("exceeds balance") ||
    msg.includes("not enough") ||
    msg.includes("funds")
  ) {
    return new Error("INSUFFICIENT_BALANCE");
  }
  if (msg.includes("allowance")) {
    return new Error("APPROVE_PENDING");
  }
  if (msg.includes("revert") || msg.includes("execution reverted")) {
    return new Error("TX_FAILED");
  }

  const detail = err.message.replace(/\s+/g, " ").slice(0, 120);
  return new Error(`WALLET_TX_FAILED:${detail}`);
}

type MiniPayTxParams = {
  from: `0x${string}`;
  to: `0x${string}`;
  data: `0x${string}`;
  /** Pay network fee in this stablecoin adapter (USDC only). Omit for tCOPM — MiniPay auto-selects. */
  feeCurrency?: `0x${string}`;
};

/**
 * MiniPay: single eth_sendTransaction (one confirmation popup).
 * Do not chain viem + raw — that caused duplicate popups and confusing failures.
 */
export async function sendMiniPayTransaction(
  provider: EIP1193Provider,
  params: MiniPayTxParams
): Promise<Hash> {
  const rawParams: Record<string, string> = {
    from: params.from,
    to: params.to,
    data: params.data,
    value: "0x0",
  };
  if (params.feeCurrency) {
    rawParams.feeCurrency = params.feeCurrency;
  }

  try {
    const hash = await provider.request({
      method: "eth_sendTransaction",
      params: [rawParams],
    });

    if (typeof hash === "string" && hash.startsWith("0x")) {
      return hash as Hash;
    }

    throw new Error("MiniPay returned an invalid transaction hash");
  } catch (err) {
    throw normalizeWalletTxError(err);
  }
}
