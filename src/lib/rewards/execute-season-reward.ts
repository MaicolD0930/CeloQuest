import {
  createPublicClient,
  createWalletClient,
  decodeEventLog,
  http,
  isAddress,
  type Hash,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { prisma } from "@/lib/prisma";
import { getActiveChain, getRpcUrl, getTxExplorerUrl } from "@/lib/chain/config";
import {
  getRewardsContractAddress,
  rewardsContractAbi,
  WEEKLY_REWARD_USDC,
  weekKeyToSeasonId,
} from "@/lib/contracts/rewards-abi";

export { WEEKLY_REWARD_USDC, weekKeyToSeasonId };

export type SeasonWinner = {
  userId: string;
  username: string;
  walletAddress: string;
};

export type SeasonRewardStatus = {
  seasonId: string;
  weekKey: string;
  status: string;
  rewardPaid: boolean;
  rewardTxHash: string | null;
  rewardPaidAt: string | null;
  winner: SeasonWinner | null;
  prizeAmount: string;
  prizeSymbol: string;
  onChainSeasonId: `0x${string}`;
  contractAddress: string | null;
  contractPaid: boolean | null;
  explorerTxUrl: string | null;
};

function getTreasuryAccount() {
  const raw = process.env.DEPLOYER_PRIVATE_KEY;
  if (!raw) throw new Error("TREASURY_KEY_NOT_CONFIGURED");

  const privateKey = (
    raw.startsWith("0x") ? raw : `0x${raw}`
  ) as `0x${string}`;

  return privateKeyToAccount(privateKey);
}

export async function resolveSeasonWinner(
  season: { id: string; weekKey: string; status: string }
): Promise<SeasonWinner | null> {
  if (season.status === "archived") {
    const entry = await prisma.weeklySeasonEntry.findFirst({
      where: { seasonId: season.id, rank: 1 },
    });
    if (!entry) return null;
    return {
      userId: entry.userId,
      username: entry.username,
      walletAddress: entry.walletAddress,
    };
  }

  const leader = await prisma.user.findFirst({
    where: { weeklyXp: { gt: 0 }, currentWeekKey: season.weekKey },
    orderBy: [{ weeklyXp: "desc" }, { weeklyDurationMs: "asc" }],
  });

  if (!leader) return null;

  return {
    userId: leader.id,
    username: leader.username,
    walletAddress: leader.walletAddress,
  };
}

async function isSeasonPaidOnChain(onChainSeasonId: `0x${string}`): Promise<boolean | null> {
  const contract = getRewardsContractAddress();
  if (!contract) return null;

  const client = createPublicClient({
    chain: getActiveChain(),
    transport: http(getRpcUrl()),
  });

  try {
    return await client.readContract({
      address: contract,
      abi: rewardsContractAbi,
      functionName: "isSeasonPaid",
      args: [onChainSeasonId],
    });
  } catch (error) {
    console.error("isSeasonPaidOnChain error:", error);
    return null;
  }
}

export async function getSeasonRewardStatus(
  seasonId?: string
): Promise<SeasonRewardStatus | null> {
  const season = seasonId
    ? await prisma.weeklySeason.findUnique({ where: { id: seasonId } })
    : await prisma.weeklySeason.findFirst({
        where: { status: "active" },
        orderBy: { startDate: "desc" },
      });

  if (!season) return null;

  const winner = await resolveSeasonWinner(season);
  const onChainSeasonId = weekKeyToSeasonId(season.weekKey);
  const contractAddress = getRewardsContractAddress();
  const contractPaid = await isSeasonPaidOnChain(onChainSeasonId);

  return {
    seasonId: season.id,
    weekKey: season.weekKey,
    status: season.status,
    rewardPaid: season.rewardPaid,
    rewardTxHash: season.rewardTxHash,
    rewardPaidAt: season.rewardPaidAt?.toISOString() ?? null,
    winner,
    prizeAmount: WEEKLY_REWARD_USDC,
    prizeSymbol: "USDC",
    onChainSeasonId,
    contractAddress,
    contractPaid,
    explorerTxUrl: season.rewardTxHash
      ? getTxExplorerUrl(season.rewardTxHash)
      : null,
  };
}

export type ExecuteSeasonRewardResult =
  | {
      ok: true;
      txHash: Hash;
      seasonId: string;
      weekKey: string;
      newSeasonWeekKey?: string;
    }
  | { ok: false; reason: string };

/**
 * Calls CeloQuestRewards.finalizeSeasonReward on-chain and persists the result.
 * Used by weekly automation and admin "Forzar pago" (same code path).
 */
export async function executeSeasonReward(params: {
  seasonId?: string;
  force?: boolean;
}): Promise<ExecuteSeasonRewardResult> {
  const season = params.seasonId
    ? await prisma.weeklySeason.findUnique({ where: { id: params.seasonId } })
    : await prisma.weeklySeason.findFirst({
        where: { status: "active" },
        orderBy: { startDate: "desc" },
      });

  if (!season) {
    return { ok: false, reason: "SEASON_NOT_FOUND" };
  }

  if (season.rewardPaid) {
    return { ok: false, reason: "SEASON_ALREADY_PAID" };
  }

  const contract = getRewardsContractAddress();
  if (!contract) {
    return { ok: false, reason: "REWARDS_NOT_CONFIGURED" };
  }

  const onChainSeasonId = weekKeyToSeasonId(season.weekKey);
  const paidOnChain = await isSeasonPaidOnChain(onChainSeasonId);
  if (paidOnChain) {
    await syncSeasonPaidFromChain(season.id, season.weekKey);
    return { ok: false, reason: "SEASON_ALREADY_PAID_ON_CHAIN" };
  }

  const winner = await resolveSeasonWinner(season);
  if (!winner?.walletAddress || !isAddress(winner.walletAddress)) {
    return { ok: false, reason: "NO_WINNER" };
  }

  const account = getTreasuryAccount();
  const walletClient = createWalletClient({
    account,
    chain: getActiveChain(),
    transport: http(getRpcUrl()),
  });

  const fn = params.force
    ? "finalizeSeasonRewardForced"
    : "finalizeSeasonReward";

  let txHash: Hash;
  try {
    txHash = await walletClient.writeContract({
      address: contract,
      abi: rewardsContractAbi,
      functionName: fn,
      args: [onChainSeasonId, winner.walletAddress as `0x${string}`],
    });
  } catch (error) {
    console.error(`${fn} writeContract error:`, error);
    return { ok: false, reason: "CONTRACT_CALL_FAILED" };
  }

  const publicClient = createPublicClient({
    chain: getActiveChain(),
    transport: http(getRpcUrl()),
  });

  let receipt;
  try {
    receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  } catch (error) {
    console.error("waitForTransactionReceipt error:", error);
    return { ok: false, reason: "TX_NOT_CONFIRMED" };
  }

  if (receipt.status !== "success") {
    return { ok: false, reason: "TX_FAILED" };
  }

  await recordSeasonRewardPayment({
    seasonId: season.id,
    weekKey: season.weekKey,
    winner,
    txHash,
    receiptLogs: receipt.logs,
    contractAddress: contract,
    onChainSeasonId,
  });

  return { ok: true, txHash, seasonId: season.id, weekKey: season.weekKey };
}

/**
 * Full season cycle: finalize (if active) → pay winner → start next active season.
 * Used by admin "Forzar pago" and mirrors weekly automation after archive.
 */
export async function completeSeasonWithReward(params: {
  seasonId?: string;
}): Promise<ExecuteSeasonRewardResult> {
  let season = params.seasonId
    ? await prisma.weeklySeason.findUnique({ where: { id: params.seasonId } })
    : await prisma.weeklySeason.findFirst({
        where: { status: "active" },
        orderBy: { startDate: "desc" },
      });

  if (!season) {
    return { ok: false, reason: "SEASON_NOT_FOUND" };
  }

  if (season.rewardPaid) {
    return { ok: false, reason: "SEASON_ALREADY_PAID" };
  }

  if (season.status === "active") {
    const { finalizeSeasonRecord } = await import("@/lib/seasons");
    await finalizeSeasonRecord(season.id, season.weekKey);
    season = await prisma.weeklySeason.findUnique({ where: { id: season.id } });
    if (!season) {
      return { ok: false, reason: "SEASON_NOT_FOUND" };
    }
  }

  const payResult = await executeSeasonReward({
    seasonId: season.id,
    force: true,
  });
  if (!payResult.ok) {
    return payResult;
  }

  const { createNextActiveSeason } = await import("@/lib/seasons");
  const newSeason = await createNextActiveSeason();

  return {
    ...payResult,
    newSeasonWeekKey: newSeason.weekKey,
  };
}

async function recordSeasonRewardPayment(params: {
  seasonId: string;
  weekKey: string;
  winner: SeasonWinner;
  txHash: Hash;
  receiptLogs: Array<{
    address: `0x${string}`;
    data: `0x${string}`;
    topics: [] | [`0x${string}`, ...`0x${string}`[]];
  }>;
  contractAddress: `0x${string}`;
  onChainSeasonId: `0x${string}`;
}) {
  const paidAt = new Date();

  await prisma.weeklySeason.update({
    where: { id: params.seasonId },
    data: {
      rewardPaid: true,
      rewardWinnerWallet: params.winner.walletAddress.toLowerCase(),
      rewardAmount: WEEKLY_REWARD_USDC,
      rewardTxHash: params.txHash.toLowerCase(),
      rewardPaidAt: paidAt,
    },
  });

  await prisma.rewardDistribution.updateMany({
    where: {
      seasonId: params.seasonId,
      userId: params.winner.userId,
      rewardType: "token",
      rank: 1,
    },
    data: {
      status: "paid",
      amount: WEEKLY_REWARD_USDC,
      txHash: params.txHash.toLowerCase(),
    },
  });

  const tokenReward = await prisma.rewardDistribution.findFirst({
    where: {
      seasonId: params.seasonId,
      userId: params.winner.userId,
      rewardType: "token",
      rank: 1,
    },
  });

  if (!tokenReward) {
    await prisma.rewardDistribution.create({
      data: {
        seasonId: params.seasonId,
        userId: params.winner.userId,
        walletAddress: params.winner.walletAddress.toLowerCase(),
        rank: 1,
        rewardType: "token",
        amount: WEEKLY_REWARD_USDC,
        status: "paid",
        txHash: params.txHash.toLowerCase(),
      },
    });
  }

  for (const log of params.receiptLogs) {
    if (log.address.toLowerCase() !== params.contractAddress.toLowerCase()) {
      continue;
    }
    try {
      decodeEventLog({
        abi: rewardsContractAbi,
        eventName: "SeasonRewardPaid",
        data: log.data,
        topics: log.topics,
      });
    } catch {
      continue;
    }
  }
}

async function syncSeasonPaidFromChain(seasonId: string, weekKey: string) {
  const winner = await resolveSeasonWinner({
    id: seasonId,
    weekKey,
    status: "archived",
  });
  if (!winner) return;

  await prisma.weeklySeason.update({
    where: { id: seasonId },
    data: {
      rewardPaid: true,
      rewardWinnerWallet: winner.walletAddress.toLowerCase(),
      rewardAmount: WEEKLY_REWARD_USDC,
      rewardPaidAt: new Date(),
    },
  });
}

/** Pay archived seasons that were finalized but not yet rewarded. */
export async function payPendingSeasonRewards() {
  const pending = await prisma.weeklySeason.findMany({
    where: { status: "archived", rewardPaid: false },
    orderBy: { finalizedAt: "asc" },
    take: 5,
  });

  for (const season of pending) {
    const result = await executeSeasonReward({ seasonId: season.id });
    if (result.ok) {
      console.info(
        `[rewards] Paid season ${season.weekKey} tx=${result.txHash}`
      );
    } else if (
      result.reason !== "NO_WINNER" &&
      result.reason !== "REWARDS_NOT_CONFIGURED"
    ) {
      console.warn(
        `[rewards] Could not pay season ${season.weekKey}: ${result.reason}`
      );
    }
  }
}
