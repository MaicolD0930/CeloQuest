import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getAvailableRecoveryTokens } from "@/lib/tokens/recovery";
import {
  getRecoveryPricingMetaAsync,
  formatRecoveryPriceFromAtomic,
  getRecoveryPriceAtomicAsync,
} from "@/lib/pricing/recovery-price";
import { readRecoveryPriceForTokenId } from "@/lib/contracts/recovery-payment";

/** Recovery pricing — loaded lazily when the user needs a life refill. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const pricing = await getRecoveryPricingMetaAsync();
  const recoveryTokens = getAvailableRecoveryTokens();
  const tokens = await Promise.all(
    recoveryTokens.map(async (t) => {
      const atomic =
        t.address != null
          ? await readRecoveryPriceForTokenId(t.id, t.address)
          : await getRecoveryPriceAtomicAsync(t.id);
      return {
        id: t.id,
        symbol: t.symbol,
        priceDisplay: formatRecoveryPriceFromAtomic(t.id, atomic),
      };
    })
  );

  return NextResponse.json({
    ...pricing,
    maxRefillsPerDay: 1,
    tokens,
  });
}
