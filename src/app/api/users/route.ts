import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { USER_COOKIE } from "@/lib/session";
import { weekKey } from "@/lib/game";
import { ensureActiveSeason } from "@/lib/seasons";
import {
  normalizeUsername,
  validateUsernameFormat,
} from "@/lib/username";
import {
  findUserByWallet,
  normalizeWalletAddress,
  normalizeUserWalletIfNeeded,
} from "@/lib/users/wallet-lookup";

const AVATARS = ["🦊", "🐸", "🦁", "🐼", "🦄", "🐙", "🦉", "🐢"];

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const walletAddress =
    typeof body.walletAddress === "string" && body.walletAddress.length > 0
      ? normalizeWalletAddress(body.walletAddress)
      : null;

  if (!walletAddress) {
    return NextResponse.json({ error: "WALLET_REQUIRED" }, { status: 400 });
  }

  // Returning wallet user: log in directly.
  const existing = await findUserByWallet(walletAddress);
  if (existing) {
    try {
      await ensureActiveSeason();
    } catch (e) {
      console.error("ensureActiveSeason failed:", e);
    }
    await normalizeUserWalletIfNeeded(existing.id, existing.walletAddress);
    const res = NextResponse.json({ user: existing, returning: true });
    setUserCookie(res, existing.id);
    return res;
  }

  const username = normalizeUsername(
    typeof body.username === "string" ? body.username : ""
  );

  // Wallet connected but profile not created yet.
  if (!username) {
    return NextResponse.json({ needsProfile: true, walletAddress });
  }
  const formatError = validateUsernameFormat(username);
  if (formatError) {
    return NextResponse.json({ error: formatError }, { status: 400 });
  }

  const taken = await prisma.user.findUnique({ where: { username } });
  if (taken) {
    return NextResponse.json({ error: "TAKEN" }, { status: 409 });
  }

  const avatar =
    typeof body.avatar === "string" && AVATARS.includes(body.avatar)
      ? body.avatar
      : AVATARS[0];
  const locale = body.locale === "en" ? "en" : "es";

  await ensureActiveSeason();

  const user = await prisma.user.create({
    data: {
      username,
      walletAddress,
      avatar,
      locale,
      currentWeekKey: weekKey(),
    },
  });

  const { maybeAwardFirstWallet } = await import("@/lib/achievements");
  await maybeAwardFirstWallet(user.id, locale);

  const res = NextResponse.json({ user, returning: false }, { status: 201 });
  setUserCookie(res, user.id);
  return res;
}

function setUserCookie(res: NextResponse, userId: string) {
  res.cookies.set(USER_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
}
