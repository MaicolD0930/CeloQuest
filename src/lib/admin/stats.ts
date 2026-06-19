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
  copm: { address: `0x${string}` | null; symbol: string; decimals: number },
  usdc: { address: `0x${string}` | null; decimals: number }
) {
  let copmAtomic = BigInt(0);
  let usdcAtomic = BigInt(0);

  for (const log of logs) {
    const token = log.args.token?.toLowerCase() ?? "";
    const amount = log.args.amount ?? BigInt(0);
    if (copm.address && token === copm.address.toLowerCase()) {
      copmAtomic += amount;
    } else if (usdc.address && token === usdc.address.toLowerCase()) {
      usdcAtomic += amount;
    }
  }

  const onChainPayments = [...logs]
    .reverse()
    .slice(0, 15)
    .map((log) => {
      const token = log.args.token?.toLowerCase() ?? "";
      const amount = log.args.amount ?? BigInt(0);
      const copmMatch =
        copm.address && token === copm.address.toLowerCase();
      const usdcMatch =
        usdc.address && token === usdc.address.toLowerCase();
      const decimals = copmMatch
        ? copm.decimals
        : usdcMatch
          ? usdc.decimals
          : 6;
      return {
        txHash: log.transactionHash,
        tokenSymbol: copmMatch
          ? copm.symbol
          : usdcMatch
            ? "USDC"
            : symbolForTokenAddress(log.args.token ?? ""),
        tokenAddress: log.args.token ?? "",
        amount: formatUnits(amount, decimals),
        userWallet: log.args.user ?? "",
        createdAt: new Date(
          Number(log.args.timestamp ?? BigInt(0)) * 1000
        ).toISOString(),
        explorerTxUrl: getTxExplorerUrl(log.transactionHash),
      };
    });

  return {
    paymentCount: logs.length,
    totalCopm: formatUnits(copmAtomic, copm.decimals),
    totalUsdc: formatUnits(usdcAtomic, usdc.decimals),
    copmSymbol: copm.symbol,
    onChainPayments,
  };
}

function parsePaymentAmount(raw: string): number {
  const normalized = raw.trim().replace(/\s/g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

async function fetchPaymentEconomyFromDb() {
  const copm = getCopmTokenConfig();
  const payments = await prisma.payment.findMany({
    where: { status: { in: ["confirmed", "pending"] } },
    select: { tokenSymbol: true, amount: true },
  });

  let copmTotal = 0;
  let usdcTotal = 0;

  for (const row of payments) {
    const amount = parsePaymentAmount(row.amount);
    if (amount <= 0) continue;
    const sym = row.tokenSymbol.trim().toUpperCase();
    if (sym === "USDC") {
      usdcTotal += amount;
    } else {
      copmTotal += amount;
    }
  }

  return {
    paymentCount: payments.length,
    totalCopm: copmTotal.toFixed(2),
    totalUsdc: usdcTotal.toFixed(2),
    copmSymbol: copm.symbol,
  };
}

async function fetchRecoveryEconomyStats() {
  const contract = getRecoveryContractAddress();
  const copm = getCopmTokenConfig();
  const usdc = getUsdcTokenConfig();

  if (!contract) {
    return {
      paymentCount: 0,
      totalCopm: "0",
      totalUsdc: "0",
      copmSymbol: copm.symbol,
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

    return buildEconomyFromLogs(logs, copm, usdc);
  } catch (error) {
    console.error("fetchRecoveryEconomyStats error:", error);
    return {
      paymentCount: 0,
      totalCopm: "0",
      totalUsdc: "0",
      copmSymbol: copm.symbol,
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
    dbEconomy,
    economyOnChain,
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
    fetchPaymentEconomyFromDb(),
    fetchRecoveryEconomyStats(),
  ]);

  const recentPayments = await attachUsernamesToPayments(
    mergeRecentPayments(dbPayments, economyOnChain.onChainPayments)
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
      key: "copmToken" as const,
      address: tcopmConfig.address,
      symbol: tcopmConfig.symbol,
      explorerUrl: tcopmConfig.address
        ? getAddressExplorerUrl(tcopmConfig.address)
        : null,
    },
    {
      key: "usdcToken" as const,
      address: usdcConfig.address,
      symbol: usdcConfig.symbol,
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
      paymentCount: dbEconomy.paymentCount,
      totalCopm: dbEconomy.totalCopm,
      totalUsdc: dbEconomy.totalUsdc,
      copmSymbol: dbEconomy.copmSymbol,
      recentPayments,
    },
    tokens: {
      copmId: tcopmConfig.id,
      copmSymbol: tcopmConfig.symbol,
      usdcSymbol: usdcConfig.symbol,
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
