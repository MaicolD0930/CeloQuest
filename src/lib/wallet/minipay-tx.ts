import {
  createWalletClient,
  custom,
  type Chain,
  type EIP1193Provider,
  type Hash,
} from "viem";

function readErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const o = err as Record<string, unknown>;
    if (typeof o.message === "string" && o.message.trim()) return o.message;
    if (o.error && typeof o.error === "object") {
      const inner = o.error as Record<string, unknown>;
      if (typeof inner.message === "string" && inner.message.trim()) {
        return inner.message;
      }
    }
    if (typeof o.reason === "string" && o.reason.trim()) return o.reason;
    try {
      return JSON.stringify(err).slice(0, 200);
    } catch {
      /* fall through */
    }
  }
  return "Unknown wallet error";
}

/** Map viem / provider errors to stable codes for the UI. */
export function normalizeWalletTxError(err: unknown): Error {
  const raw = readErrorMessage(err);
  const msg = raw.toLowerCase();
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

  const detail = raw.replace(/\s+/g, " ").slice(0, 160);
  return new Error(`WALLET_TX_FAILED:${detail}`);
}

type MiniPayTxParams = {
  from: `0x${string}`;
  to: `0x${string}`;
  data: `0x${string}`;
  chain: Chain;
  /** USDC adapter on Sepolia/mainnet; omit for Mento 18-decimal tokens. */
  feeCurrency?: `0x${string}`;
};

/**
 * MiniPay: viem sendTransaction (recommended by Celo / MiniPay docs).
 * Single popup — no viem + raw fallback chain.
 */
export async function sendMiniPayTransaction(
  provider: EIP1193Provider,
  params: MiniPayTxParams
): Promise<Hash> {
  const walletClient = createWalletClient({
    account: params.from,
    chain: params.chain,
    transport: custom(provider),
  });

  try {
    return await walletClient.sendTransaction({
      account: params.from,
      chain: params.chain,
      to: params.to,
      data: params.data,
      ...(params.feeCurrency ? { feeCurrency: params.feeCurrency } : {}),
    });
  } catch (err) {
    throw normalizeWalletTxError(err);
  }
}
