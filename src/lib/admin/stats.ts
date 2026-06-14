import { formatUnits } from "viem";
import { prisma } from "@/lib/prisma";
import { weekKey, weekStart } from "@/lib/game";
import {
  getAddressExplorerUrl,
  getCeloNetwork,
  getTxExplorerUrl,
} from "@/lib/chain/config";
import {
  getRecoveryContractAddress,
  getRecoveryPaymentPublicClient,
} from "@/lib/contracts/recovery-payment";
import { getRewardsContractAddress } from "@/lib/contracts/rewards-abi";
import { recoveryPaymentAbi } from "@/lib/contracts/recovery-payment-abi";
import {
  getCopmTokenConfig,
  getUsdcTokenConfig,
  getRecoveryTreasury,
} from "@/lib/tokens/recovery";
import { symbolForTokenAddress } from "@/lib/payments/record-payment";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function buildEconomyFromLogs(
  logs: Array<{
    args: {
      user?: `0x${string}`;
      token?: `0x${string}`;
      amount?: bigint;
      timestamp?: bigint;
    };
    transactionHash: `0x${string}`;
  }>,
  tcopm: `0x${string}` | null,
  usdc: `0x${string}` | null
) {
  let tcopmAtomic = BigInt(0);
  let usdcAtomic = BigInt(0);

  for (const log of logs) {
    const token = log.args.token?.toLowerCase() ?? "";
    const amount = log.args.amount ?? BigInt(0);
    if (tcopm && token === tcopm.toLowerCase()) tcopmAtomic += amount;
    else if (usdc && token === usdc.toLowerCase()) usdcAtomic += amount;
  }

  const onChainPayments = [...logs]
    .reverse()
    .slice(0, 15)
    .map((log) => {
      const token = log.args.token?.toLowerCase() ?? "";
      const amount = log.args.amount ?? BigInt(0);
      return {
        txHash: log.transactionHash,
        tokenSymbol:
          tcopm && token === tcopm.toLowerCase()
            ? "tCOPM"
            : usdc && token === usdc.toLowerCase()
              ? "USDC"
              : symbolForTokenAddress(log.args.token ?? ""),
        tokenAddress: log.args.token ?? "",
        amount: formatUnits(amount, 6),
        userWallet: log.args.user ?? "",
        createdAt: new Date(
          Number(log.args.timestamp ?? BigInt(0)) * 1000
        ).toISOString(),
        explorerTxUrl: getTxExplorerUrl(log.transactionHash),
      };
    });

  return {
    paymentCount: logs.length,
    totalTcopm: formatUnits(tcopmAtomic, 6),
    totalUsdc: formatUnits(usdcAtomic, 6),
    onChainPayments,
  };
}

async function fetchRecoveryEconomyStats() {
  const contract = getRecoveryContractAddress();
  const tcopm = getCopmTokenConfig().address;
  const usdc = getUsdcTokenConfig().address;

  if (!contract) {
    return {
      paymentCount: 0,
      totalTcopm: "0",
      totalUsdc: "0",
      onChainPayments: [] as Array<{
        txHash: string;
        tokenSymbol: string;
        tokenAddress: string;
        amount: string;
        userWallet: string;
        createdAt: string;
        explorerTxUrl: string;
      }>,
    };
  }

  try {
    const client = getRecoveryPaymentPublicClient();
    const logs = await client.getContractEvents({
      address: contract,
      abi: recoveryPaymentAbi,
      eventName: "RecoveryPurchased",
      fromBlock: BigInt(0),
      toBlock: "latest",
    });

    return buildEconomyFromLogs(logs, tcopm, usdc);
  } catch (error) {
    console.error("fetchRecoveryEconomyStats error:", error);
    return {
      paymentCount: 0,
      totalTcopm: "0",
      totalUsdc: "0",
      onChainPayments: [],
    };
  }
}

function mergeRecentPayments(
  dbPayments: Array<{
    txHash: string;
    tokenSymbol: string;
    amount: string;
    userWallet: string;
    createdAt: Date;
  }>,
  onChainPayments: Array<{
    txHash: string;
    tokenSymbol: string;
    amount: string;
    userWallet: string;
    createdAt: string;
    explorerTxUrl: string;
  }>
) {
  const seen = new Set<string>();
  const merged: Array<{
    txHash: string;
    tokenSymbol: string;
    amount: string;
    userWallet: string;
    createdAt: string;
    explorerTxUrl: string;
  }> = [];

  for (const row of dbPayments) {
    const hash = row.txHash.toLowerCase();
    if (seen.has(hash)) continue;
    seen.add(hash);
    merged.push({
      txHash: row.txHash,
      tokenSymbol: row.tokenSymbol,
      amount: row.amount,
      userWallet: row.userWallet,
      createdAt: row.createdAt.toISOString(),
      explorerTxUrl: getTxExplorerUrl(row.txHash),
    });
  }

  for (const row of onChainPayments) {
    const hash = row.txHash.toLowerCase();
    if (seen.has(hash)) continue;
    seen.add(hash);
    merged.push(row);
  }

  return merged
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 15);
}

async function attachUsernamesToPayments(
  payments: Array<{
    txHash: string;
    tokenSymbol: string;
    amount: string;
    userWallet: string;
    createdAt: string;
    explorerTxUrl: string;
  }>
) {
  const wallets = [
    ...new Set(
      payments.map((p) => p.userWallet.toLowerCase()).filter(Boolean)
    ),
  ];

  if (wallets.length === 0) {
    return payments.map((p) => ({ ...p, username: null as string | null }));
  }

  const users = await prisma.user.findMany({
    where: {
      OR: wallets.map((wallet) => ({
        walletAddress: { equals: wallet, mode: "insensitive" as const },
      })),
    },
    select: { walletAddress: true, username: true },
  });

  const usernameByWallet = new Map(
    users.map((user) => [user.walletAddress.toLowerCase(), user.username])
  );

  return payments.map((payment) => ({
    ...payment,
    username: usernameByWallet.get(payment.userWallet.toLowerCase()) ?? null,
  }));
}

export async function getAdminStats() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - SEVEN_DAYS_MS);
  const weekStartDate = weekStart(now);

  const tcopmConfig = getCopmTokenConfig();
  const usdcConfig = getUsdcTokenConfig();
  const recoveryContract = getRecoveryContractAddress();
  const rewardsContract = getRewardsContractAddress();
  const treasury = getRecoveryTreasury();

  const [
    totalUsers,
    activeUsers,
    newUsersThisWeek,
    dbPayments,
    usersByXp,
    economy,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: { lastPlayedAt: { gte: sevenDaysAgo } },
    }),
    prisma.user.count({
      where: { createdAt: { gte: weekStartDate } },
    }),
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.user.findMany({
      orderBy: { xpTotal: "desc" },
      take: 100,
      select: {
        id: true,
        walletAddress: true,
        username: true,
        xpTotal: true,
        lastPlayedAt: true,
        createdAt: true,
      },
    }),
    fetchRecoveryEconomyStats(),
  ]);

  const recentPayments = await attachUsernamesToPayments(
    mergeRecentPayments(dbPayments, economy.onChainPayments)
  );

  const users = usersByXp.map((user, index) => ({
    wallet: user.walletAddress,
    username: user.username,
    xpTotal: user.xpTotal,
    rank: index + 1,
    lastActivity:
      user.lastPlayedAt?.toISOString() ?? user.createdAt.toISOString(),
  }));

  const contractAddresses = [
    {
      key: "recoveryContract" as const,
      address: recoveryContract,
      explorerUrl: recoveryContract
        ? getAddressExplorerUrl(recoveryContract)
        : null,
    },
    {
      key: "rewardsContract" as const,
      address: rewardsContract,
      explorerUrl: rewardsContract
        ? getAddressExplorerUrl(rewardsContract)
        : null,
    },
    {
      key: "tcopmToken" as const,
      address: tcopmConfig.address,
      explorerUrl: tcopmConfig.address
        ? getAddressExplorerUrl(tcopmConfig.address)
        : null,
    },
    {
      key: "usdcToken" as const,
      address: usdcConfig.address,
      explorerUrl: usdcConfig.address
        ? getAddressExplorerUrl(usdcConfig.address)
        : null,
    },
    {
      key: "treasury" as const,
      address: treasury,
      explorerUrl: treasury ? getAddressExplorerUrl(treasury) : null,
    },
  ];

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
      newThisWeek: newUsersThisWeek,
      weekKey: weekKey(now),
    },
    economy: {
      paymentCount: economy.paymentCount,
      totalTcopm: economy.totalTcopm,
      totalUsdc: economy.totalUsdc,
      recentPayments,
    },
    contract: {
      network: getCeloNetwork(),
      addresses: contractAddresses,
      recentTxHashes: recentPayments.map((p) => p.txHash).slice(0, 10),
    },
    usersTable: users,
  };
}

export async function getAdminUsers(limit = 100) {
  const users = await prisma.user.findMany({
    orderBy: { xpTotal: "desc" },
    take: limit,
    select: {
      walletAddress: true,
      username: true,
      xpTotal: true,
      lastPlayedAt: true,
      createdAt: true,
    },
  });

  return users.map((user, index) => ({
    wallet: user.walletAddress,
    username: user.username,
    xpTotal: user.xpTotal,
    rank: index + 1,
    lastActivity:
      user.lastPlayedAt?.toISOString() ?? user.createdAt.toISOString(),
  }));
}
