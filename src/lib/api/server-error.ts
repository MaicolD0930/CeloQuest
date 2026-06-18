import { NextResponse } from "next/server";

function isPrismaError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: string }).code;
  return typeof code === "string" && code.startsWith("P");
}

/** Consistent JSON error body for client-side classification. */
export function apiServerErrorResponse(context: string, error: unknown) {
  const database = isPrismaError(error);
  console.error(`${context}:`, error);
  return NextResponse.json(
    {
      error: database ? "DATABASE_ERROR" : "SERVER_ERROR",
      kind: database ? "DATABASE" : "API_DOWN",
    },
    { status: 500 }
  );
}
