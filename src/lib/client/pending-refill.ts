import type { RecoveryTokenId } from "@/lib/tokens/recovery";
import { apiFetch, apiFetchJson, isApiClientError } from "@/lib/client/api-fetch";

const STORAGE_KEY = "celoquest-pending-refill";

export type PendingRefill = {
  txHash: string;
  token: RecoveryTokenId;
  savedAt: number;
};

export function savePendingRefill(pending: Omit<PendingRefill, "savedAt">): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...pending, savedAt: Date.now() } satisfies PendingRefill)
    );
  } catch {
    /* quota / private mode */
  }
}

export function readPendingRefill(): PendingRefill | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingRefill;
    if (!parsed?.txHash || !parsed?.token) return null;
    if (Date.now() - (parsed.savedAt ?? 0) > 2 * 60 * 60 * 1000) {
      clearPendingRefill();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingRefill(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export type RefillApiSuccess = {
  livesLeft: number;
  startedAt?: string;
  activeDurationMs?: number;
};

export type RefillPollProgress = {
  attempt: number;
};

export type RefillPollOptions = {
  maxWallMs?: number;
  retryDelayMs?: number;
  fetchTimeoutMs?: number;
  payerWallet?: string;
  onProgress?: (progress: RefillPollProgress) => void;
};

type RefillApiBody = {
  status?: string;
  reason?: string;
  error?: string;
  livesLeft?: number;
  startedAt?: string;
  activeDurationMs?: number;
};

const DEFINITIVE_FAILURES = new Set([
  "TX_FAILED",
  "WALLET_MISMATCH",
  "TX_ALREADY_USED",
  "REFILL_ALREADY_USED",
  "PAYMENT_NOT_CONFIGURED",
  "Challenge not started",
  "Challenge already completed",
  "Refill not available",
]);

/** If life was restored server-side, sync without another payment. */
export async function tryRecoverRefillStateFromServer(): Promise<RefillApiSuccess | null> {
  try {
    const { data } = await apiFetchJson<{ progress?: {
      awaitingRefill?: boolean;
      livesLeft?: number;
      startedAt?: string;
      activeDurationMs?: number;
    } }>("/api/challenge/today", {
      credentials: "include",
      label: "GET /api/challenge/today (recover)",
      timeoutMs: 20_000,
    });
    const progress = data?.progress;
    if (
      progress &&
      !progress.awaitingRefill &&
      typeof progress.livesLeft === "number" &&
      progress.livesLeft > 0
    ) {
      clearPendingRefill();
      return {
        livesLeft: progress.livesLeft,
        startedAt: progress.startedAt,
        activeDurationMs: progress.activeDurationMs,
      };
    }
  } catch (err) {
    if (isApiClientError(err)) {
      console.warn("[CeloQuest refill] recover:", err.kind, err.status);
    }
  }
  return null;
}

async function requestRefillOnce(
  txHash: string,
  token: RecoveryTokenId,
  fetchTimeoutMs: number,
  method: "POST" | "GET" = "POST",
  payerWallet?: string,
  optimistic = false
): Promise<RefillApiBody & { httpStatus: number }> {
  const url =
    method === "GET"
      ? `/api/challenge/refill/status?txHash=${encodeURIComponent(txHash)}&token=${encodeURIComponent(token)}${payerWallet ? `&payerWallet=${encodeURIComponent(payerWallet)}` : ""}`
      : "/api/challenge/refill";

  try {
    const { response, data } = await apiFetch(url, {
      method,
      credentials: "include",
      headers: method === "POST" ? { "Content-Type": "application/json" } : undefined,
      body:
        method === "POST"
          ? JSON.stringify({
              txHash,
              token,
              payerWallet,
              ...(optimistic ? { optimistic: true } : {}),
            })
          : undefined,
      label: `${method} ${url}`,
      timeoutMs: fetchTimeoutMs,
      throwOnHttpError: false,
    });
    return { ...(data as RefillApiBody), httpStatus: response.status };
  } catch (err) {
    if (isApiClientError(err)) {
      if (err.kind === "TIMEOUT") {
        return { status: "pending", reason: "REQUEST_TIMEOUT", httpStatus: 202 };
      }
      console.warn("[CeloQuest refill] request:", err.kind, err.url, err.status);
      return {
        status: "pending",
        reason: err.kind === "DATABASE" ? "SERVER_ERROR" : "NETWORK_ERROR",
        httpStatus: 202,
      };
    }
    return { status: "pending", reason: "NETWORK_ERROR", httpStatus: 202 };
  }
}

function parseRefillResponse(
  body: RefillApiBody & { httpStatus?: number }
): { outcome: "confirmed"; data: RefillApiSuccess } | { outcome: "pending"; reason: string } | { outcome: "failed"; error: string } {
  if (
    body.status === "confirmed" ||
    (body.httpStatus === 200 && typeof body.livesLeft === "number")
  ) {
    clearPendingRefill();
    return {
      outcome: "confirmed",
      data: {
        livesLeft: body.livesLeft ?? 1,
        startedAt:
          typeof body.startedAt === "string"
            ? body.startedAt
            : body.startedAt != null
              ? String(body.startedAt)
              : undefined,
        activeDurationMs: body.activeDurationMs,
      },
    };
  }

  const reason = body.reason ?? body.error ?? "TX_NOT_FOUND";

  if (body.status === "pending" || body.httpStatus === 202) {
    return { outcome: "pending", reason };
  }

  if (DEFINITIVE_FAILURES.has(reason)) {
    return { outcome: "failed", error: reason };
  }

  if (body.status === "failed") {
    return { outcome: "failed", error: reason };
  }

  return { outcome: "pending", reason };
}

/**
 * Poll backend until payment is confirmed on-chain and life is granted.
 * Never treats slow indexing as a hard error — returns pending instead.
 */
export async function pollRefillUntilConfirmed(
  txHash: string,
  token: RecoveryTokenId,
  options?: RefillPollOptions
): Promise<
  | { outcome: "confirmed"; data: RefillApiSuccess }
  | { outcome: "pending"; reason: string }
  | { outcome: "failed"; error: string }
> {
  const maxWallMs = options?.maxWallMs ?? 180_000;
  const retryDelayMs = options?.retryDelayMs ?? 5_000;
  const fetchTimeoutMs = options?.fetchTimeoutMs ?? 20_000;
  const deadline = Date.now() + maxWallMs;

  let attempt = 0;
  let lastReason = "TX_NOT_FOUND";

  while (Date.now() < deadline) {
    attempt += 1;
    options?.onProgress?.({ attempt });

    const recovered = await tryRecoverRefillStateFromServer();
    if (recovered) {
      return { outcome: "confirmed", data: recovered };
    }

    const useGet = attempt > 1;
    const body = await requestRefillOnce(
      txHash,
      token,
      fetchTimeoutMs,
      useGet ? "GET" : "POST",
      options?.payerWallet
    );
    const parsed = parseRefillResponse(body);

    if (parsed.outcome === "confirmed") return parsed;
    if (parsed.outcome === "failed") return parsed;

    lastReason = parsed.reason;

    if (Date.now() + retryDelayMs >= deadline) break;
    await new Promise((r) => setTimeout(r, retryDelayMs));
  }

  const recovered = await tryRecoverRefillStateFromServer();
  if (recovered) {
    return { outcome: "confirmed", data: recovered };
  }

  return { outcome: "pending", reason: lastReason };
}

/** MiniPay: one fast POST — grant life immediately (server records pending tx). */
export async function requestOptimisticRefill(
  txHash: string,
  token: RecoveryTokenId,
  payerWallet?: string
): Promise<
  | { outcome: "confirmed"; data: RefillApiSuccess }
  | { outcome: "failed"; error: string }
> {
  const body = await requestRefillOnce(
    txHash,
    token,
    12_000,
    "POST",
    payerWallet,
    true
  );
  const parsed = parseRefillResponse(body);
  if (parsed.outcome === "confirmed") return parsed;
  if (parsed.outcome === "failed") return parsed;
  return { outcome: "failed", error: parsed.reason };
}

/** Verify optimistic refill on-chain without blocking the UI. */
export function startBackgroundRefillVerification(
  txHash: string,
  token: RecoveryTokenId,
  options?: {
    payerWallet?: string;
    onFailed?: (reason: string) => void;
    onConfirmed?: () => void;
  }
): void {
  void (async () => {
    const result = await pollRefillUntilConfirmed(txHash, token, {
      payerWallet: options?.payerWallet,
      maxWallMs: 240_000,
      retryDelayMs: 8_000,
      fetchTimeoutMs: 15_000,
    });
    if (result.outcome === "confirmed") {
      clearPendingRefill();
      options?.onConfirmed?.();
      return;
    }
    if (result.outcome === "failed") {
      options?.onFailed?.(result.error);
    }
  })();
}

/** @deprecated Use pollRefillUntilConfirmed */
export async function postRefillUntilConfirmed(
  txHash: string,
  token: RecoveryTokenId,
  options?: RefillPollOptions & { lightMode?: boolean }
): Promise<{ ok: true; data: RefillApiSuccess } | { ok: false; error?: string }> {
  const result = await pollRefillUntilConfirmed(txHash, token, {
    maxWallMs: options?.lightMode ? 120_000 : options?.maxWallMs,
    retryDelayMs: options?.retryDelayMs,
    fetchTimeoutMs: options?.fetchTimeoutMs,
    onProgress: options?.onProgress
      ? (p) => options.onProgress?.({ attempt: p.attempt })
      : undefined,
  });

  if (result.outcome === "confirmed") {
    return { ok: true, data: result.data };
  }
  if (result.outcome === "failed") {
    return { ok: false, error: result.error };
  }
  return { ok: false, error: "PAYMENT_PENDING" };
}
