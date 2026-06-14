import { prisma } from "@/lib/prisma";

export function normalizeWalletAddress(wallet: string): string {
  return wallet.trim().toLowerCase();
}

/** Find user by wallet (case-insensitive). */
export async function findUserByWallet(walletAddress: string) {
  const normalized = normalizeWalletAddress(walletAddress);

  return prisma.user.findFirst({
    where: {
      OR: [
        { walletAddress: normalized },
        { walletAddress: { equals: walletAddress, mode: "insensitive" } },
      ],
    },
  });
}

/** Ensure wallet is stored lowercase for consistent lookups. */
export async function normalizeUserWalletIfNeeded(
  userId: string,
  currentWallet: string
) {
  const normalized = normalizeWalletAddress(currentWallet);
  if (currentWallet === normalized) return normalized;

  await prisma.user.update({
    where: { id: userId },
    data: { walletAddress: normalized },
  });

  return normalized;
}
