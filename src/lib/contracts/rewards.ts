import { prisma } from "@/lib/prisma";
import { WEEKLY_REWARD_TCOPM } from "@/lib/contracts/rewards-abi";

type Winner = { walletAddress: `0x${string}`; rank: number };

/** Record pending reward distributions for top 3 (NFT + token for #1). */
export async function prepareWeeklyRewardDistribution(
  seasonId: string,
  winners: Winner[]
) {
  for (const w of winners) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { walletAddress: w.walletAddress.toLowerCase() },
          {
            walletAddress: {
              equals: w.walletAddress,
              mode: "insensitive",
            },
          },
        ],
      },
    });
    if (!user) continue;

    if (w.rank === 1) {
      await prisma.rewardDistribution.create({
        data: {
          seasonId,
          userId: user.id,
          walletAddress: user.walletAddress,
          rank: w.rank,
          rewardType: "token",
          amount: WEEKLY_REWARD_TCOPM,
          status: "pending",
        },
      });
    }

    await prisma.rewardDistribution.create({
      data: {
        seasonId,
        userId: user.id,
        walletAddress: user.walletAddress,
        rank: w.rank,
        rewardType: "nft",
        status: "pending",
      },
    });
  }
}
