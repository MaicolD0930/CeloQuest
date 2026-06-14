import { cookies } from "next/headers";
import { prisma } from "./prisma";

export const USER_COOKIE = "cq_uid";

export async function getCurrentUserId(): Promise<string | null> {
  const store = await cookies();
  return store.get(USER_COOKIE)?.value ?? null;
}

export async function getCurrentUser() {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}
