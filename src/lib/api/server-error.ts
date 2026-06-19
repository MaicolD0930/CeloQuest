import { NextResponse } from "next/server";

function isPrismaError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: string }).code;
  return typeof code === "string" && code.startsWith("P");
}

function isDatabaseError(error: unknown): boolean {
  if (isPrismaError(error)) return true;
  const msg =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();
  return (
    msg.includes("prisma") ||
    msg.includes("postgres") ||
    msg.includes("database") ||
    msg.includes("connection pool") ||
    msg.includes("p1001") ||
    msg.includes("p1017") ||
    msg.includes("can't reach database")
  );
}

/** Consistent JSON error body for client-side classification. */
export function apiServerErrorResponse(context: string, error: unknown) {
  const database = isDatabaseError(error);
  console.error(`${context}:`, error);
  return NextResponse.json(
    {
      error: database ? "DATABASE_ERROR" : "SERVER_ERROR",
      kind: database ? "DATABASE" : "API_DOWN",
    },
    { status: 500 }
  );
}
