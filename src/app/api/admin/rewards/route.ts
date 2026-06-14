import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { getSeasonRewardStatus } from "@/lib/rewards/execute-season-reward";
import { getArchivedSeasons } from "@/lib/seasons";
import { getTxExplorerUrl } from "@/lib/chain/config";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const seasonId = searchParams.get("seasonId") ?? undefined;
    const status = await getSeasonRewardStatus(seasonId);

    if (!status) {
      return NextResponse.json({ error: "SEASON_NOT_FOUND" }, { status: 404 });
    }

    const archived = await getArchivedSeasons(10);
    const wallets = [
      ...new Set(
        archived
          .flatMap((s) => [
            s.rewardWinnerWallet?.toLowerCase(),
            s.entries.find((e) => e.rank === 1)?.walletAddress.toLowerCase(),
          ])
          .filter((w): w is string => Boolean(w))
      ),
    ];

    const usersByWallet = new Map(
      (
        await prisma.user.findMany({
          where: {
            OR: wallets.map((wallet) => ({
              walletAddress: { equals: wallet, mode: "insensitive" as const },
            })),
          },
          select: { walletAddress: true, username: true },
        })
      ).map((u) => [u.walletAddress.toLowerCase(), u.username])
    );

    const history = archived.map((s) => {
      const entryWinner = s.entries.find((e) => e.rank === 1);
      const rewardWinnerWallet =
        s.rewardWinnerWallet ?? entryWinner?.walletAddress ?? null;
      const winnerUsername =
        entryWinner?.username ??
        (rewardWinnerWallet
          ? usersByWallet.get(rewardWinnerWallet.toLowerCase()) ?? null
          : null);

      return {
        seasonId: s.id,
        weekKey: s.weekKey,
        status: s.status,
        finalizedAt: s.finalizedAt?.toISOString() ?? null,
        rewardPaid: s.rewardPaid,
        rewardWinnerWallet,
        rewardAmount: s.rewardAmount,
        rewardTxHash: s.rewardTxHash,
        rewardPaidAt: s.rewardPaidAt?.toISOString() ?? null,
        winnerUsername,
        explorerTxUrl: s.rewardTxHash
          ? getTxExplorerUrl(s.rewardTxHash)
          : null,
      };
    });

    return NextResponse.json({ ...status, history });
  } catch (error) {
    console.error("GET /api/admin/rewards error:", error);
    return NextResponse.json({ error: "REWARDS_STATUS_ERROR" }, { status: 500 });
  }
}
