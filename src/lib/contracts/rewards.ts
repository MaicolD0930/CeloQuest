import { prisma } from "@/lib/prisma";
import { WEEKLY_REWARD_USDC } from "@/lib/contracts/rewards-abi";

type Winner = { walletAddress: `0x${string}`; rank: number };

/** Record pending token reward for weekly champion (#1). */
export async function prepareWeeklyRewardDistribution(
  seasonId: string,
  winners: Winner[]
) {
  const champion = winners.find((w) => w.rank === 1);
  if (!champion) return;

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { walletAddress: champion.walletAddress.toLowerCase() },
        {
          walletAddress: {
            equals: champion.walletAddress,
            mode: "insensitive",
          },
        },
      ],
    },
  });
  if (!user) return;

  await prisma.rewardDistribution.create({
    data: {
      seasonId,
      userId: user.id,
      walletAddress: user.walletAddress,
      rank: 1,
      rewardType: "token",
      amount: WEEKLY_REWARD_USDC,
      status: "pending",
    },
  });
}
