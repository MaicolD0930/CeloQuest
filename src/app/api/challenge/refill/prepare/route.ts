import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prepareRecoveryPayment } from "@/lib/payments/prepare-recovery";
import { getCopmTokenConfig } from "@/lib/tokens/recovery";
import { getRecoveryContractAddress } from "@/lib/contracts/recovery-payment";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const token = req.nextUrl.searchParams.get("token");

  try {
    const prepared = await prepareRecoveryPayment(token, user.walletAddress);
    return NextResponse.json({
      ...prepared,
      walletAddress: user.walletAddress,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "PAYMENT_NOT_CONFIGURED"
    ) {
      const copm = getCopmTokenConfig();
      console.error("refill prepare PAYMENT_NOT_CONFIGURED", {
        tokenParam: token,
        copmAddress: copm.address,
        contract: getRecoveryContractAddress(),
        network: copm.id,
      });
      return NextResponse.json(
        { error: "PAYMENT_NOT_CONFIGURED" },
        { status: 503 }
      );
    }
    console.error("refill prepare error:", error);
    return NextResponse.json({ error: "PREPARE_FAILED" }, { status: 500 });
  }
}
