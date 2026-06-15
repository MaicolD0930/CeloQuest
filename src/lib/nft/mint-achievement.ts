import {
  createPublicClient,
  createWalletClient,
  http,
  isAddress,
  type Hash,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { prisma } from "@/lib/prisma";
import { getActiveChain, getRpcUrl } from "@/lib/chain/config";
import {
  achievementsContractAbi,
  getAchievementsContractAddress,
} from "@/lib/contracts/achievements-abi";
import {
  getAchievementDef,
  type AchievementType,
} from "@/lib/achievements/catalog";

function getMinterAccount() {
  const raw = process.env.DEPLOYER_PRIVATE_KEY;
  if (!raw) throw new Error("MINTER_KEY_NOT_CONFIGURED");
  const privateKey = (
    raw.startsWith("0x") ? raw : `0x${raw}`
  ) as `0x${string}`;
  return privateKeyToAccount(privateKey);
}

export type MintResult =
  | { ok: true; txHash: Hash; tokenId: number }
  | { ok: false; reason: string };

export async function mintAchievementNft(params: {
  walletAddress: string;
  type: AchievementType;
  competitive?: boolean;
}): Promise<MintResult> {
  const contract = getAchievementsContractAddress();
  if (!contract) {
    return { ok: false, reason: "ACHIEVEMENTS_NOT_CONFIGURED" };
  }

  const def = getAchievementDef(params.type);
  if (!def?.tokenId) {
    return { ok: false, reason: "NO_TOKEN_FOR_TYPE" };
  }

  if (!isAddress(params.walletAddress)) {
    return { ok: false, reason: "INVALID_WALLET" };
  }

  const wallet = params.walletAddress as `0x${string}`;
  const tokenId = def.tokenId;
  const account = getMinterAccount();

  const walletClient = createWalletClient({
    account,
    chain: getActiveChain(),
    transport: http(getRpcUrl()),
  });

  const publicClient = createPublicClient({
    chain: getActiveChain(),
    transport: http(getRpcUrl()),
  });

  try {
    if (!params.competitive) {
      const already = await publicClient.readContract({
        address: contract,
        abi: achievementsContractAbi,
        functionName: "personalClaimed",
        args: [wallet, BigInt(tokenId)],
      });
      if (already) {
        return { ok: false, reason: "ALREADY_MINTED_ON_CHAIN" };
      }
    }

    const txHash = await walletClient.writeContract({
      address: contract,
      abi: achievementsContractAbi,
      functionName: params.competitive ? "mintCompetitive" : "mintPersonal",
      args: [wallet, BigInt(tokenId)],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    if (receipt.status !== "success") {
      return { ok: false, reason: "TX_FAILED" };
    }

    return { ok: true, txHash, tokenId };
  } catch (error) {
    console.error("mintAchievementNft error:", error);
    return { ok: false, reason: "MINT_FAILED" };
  }
}

export async function markAchievementClaimed(
  achievementId: string,
  txHash: Hash,
  tokenId: number
) {
  await prisma.achievement.update({
    where: { id: achievementId },
    data: {
      status: "claimed",
      nftTokenId: String(tokenId),
      txHash: txHash.toLowerCase(),
      mintedAt: new Date(),
    },
  });
}

export async function markAchievementFailed(achievementId: string) {
  await prisma.achievement.update({
    where: { id: achievementId },
    data: { status: "failed" },
  });
}
