import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const ADMIN_ROLE = "ADMIN";

export function normalizeWalletAddress(wallet: string): string {
  return wallet.trim().toLowerCase();
}

/** Check if a wallet has ADMIN role in the database. */
export async function isWalletAdmin(walletAddress: string): Promise<boolean> {
  try {
    const normalized = normalizeWalletAddress(walletAddress);
    const admin = await prisma.admin.findUnique({
      where: { walletAddress: normalized },
    });
    return admin?.role === ADMIN_ROLE;
  } catch (error) {
    console.error("[admin] isWalletAdmin failed:", error);
    return false;
  }
}

/** Check if the current session user is an admin. */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return isWalletAdmin(user.walletAddress);
}

export type AdminAuthResult =
  | { ok: true; user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>> }
  | { ok: false; response: NextResponse };

/** Require authenticated session with ADMIN role (server-side only). */
export async function requireAdmin(): Promise<AdminAuthResult> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    };
  }

  const allowed = await isWalletAdmin(user.walletAddress);
  if (!allowed) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, user };
}
