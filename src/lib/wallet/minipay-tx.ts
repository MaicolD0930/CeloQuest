import {
  createWalletClient,
  custom,
  type Chain,
  type EIP1193Provider,
  type Hash,
} from "viem";

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

  const detail = err.message.replace(/\s+/g, " ").slice(0, 72);
  return new Error(`WALLET_TX_FAILED:${detail}`);
}

/**
 * MiniPay: legacy Celo tx via viem (fee abstraction + correct encoding).
 * Falls back to plain eth_sendTransaction when viem is rejected.
 */
export async function sendMiniPayTransaction(
  provider: EIP1193Provider,
  params: {
    from: `0x${string}`;
    to: `0x${string}`;
    data: `0x${string}`;
    chain: Chain;
  }
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
      type: "legacy",
    });
  } catch (viemErr) {
    try {
      const hash = await provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: params.from,
            to: params.to,
            data: params.data,
            value: "0x0",
          },
        ],
      });

      if (typeof hash === "string" && hash.startsWith("0x")) {
        return hash as Hash;
      }
    } catch (rawErr) {
      throw normalizeWalletTxError(rawErr);
    }

    throw normalizeWalletTxError(viemErr);
  }
}
