import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminUsers } from "@/lib/admin/stats";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const limitRaw = req.nextUrl.searchParams.get("limit");
  const limit = limitRaw ? parseInt(limitRaw, 10) : 100;
  const safeLimit =
    Number.isFinite(limit) && limit > 0 ? Math.min(limit, 500) : 100;

  try {
    const users = await getAdminUsers(safeLimit);
    return NextResponse.json({ users });
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json({ error: "USERS_ERROR" }, { status: 500 });
  }
}
