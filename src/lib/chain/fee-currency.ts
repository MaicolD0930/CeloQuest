import type { RecoveryTokenId } from "@/lib/tokens/recovery";

/** Let MiniPay choose gas token — feeCurrency adapters break some USDC transfers. */
export function getMiniPayFeeCurrency(
  _tokenId: RecoveryTokenId
): `0x${string}` | undefined {
  return undefined;
}
