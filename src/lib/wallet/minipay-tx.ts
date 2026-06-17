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
  if (msg.includes("allowance") || msg.includes("insufficient allowance")) {
    return new Error("APPROVE_PENDING");
  }
  if (msg.includes("revert") || msg.includes("execution reverted")) {
    return new Error("TX_FAILED");
  }

  return new Error("WALLET_TX_FAILED");
}

/**
 * MiniPay expects a plain eth_sendTransaction without EIP-1559 fields.
 * Viem may attach extra properties that MiniPay rejects.
 */
export async function sendMiniPayTransaction(
  provider: EIP1193Provider,
  params: {
    from: `0x${string}`;
    to: `0x${string}`;
    data: `0x${string}`;
  }
): Promise<Hash> {
  try {
    const hash = await provider.request({
      method: "eth_sendTransaction",
      params: [
        {
          from: params.from,
          to: params.to,
          data: params.data,
        },
      ],
    });

    if (typeof hash !== "string" || !hash.startsWith("0x")) {
      throw new Error("WALLET_TX_FAILED");
    }

    return hash as Hash;
  } catch (err) {
    throw normalizeWalletTxError(err);
  }
}
