import type { RecoveryTokenId } from "@/lib/tokens/recovery";

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
    // Drop stale entries after 2 hours.
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

/** POST /api/challenge/refill with timeout; retries until receipt is indexed. */
export type RefillProgress = {
  attempt: number;
  maxAttempts: number;
};

/** If refill already applied server-side, sync client state without another payment. */
export async function tryRecoverRefillStateFromServer(): Promise<RefillApiSuccess | null> {
  try {
    const res = await fetch("/api/challenge/today", { credentials: "include" });
    if (!res.ok) return null;
    const data = await res.json();
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
  } catch {
    /* ignore */
  }
  return null;
}

export async function postRefillUntilConfirmed(
  txHash: string,
  token: RecoveryTokenId,
  options?: {
    maxWallMs?: number;
    retryDelayMs?: number;
    fetchTimeoutMs?: number;
    onProgress?: (progress: RefillProgress) => void;
  }
): Promise<{ ok: true; data: RefillApiSuccess } | { ok: false; error?: string }> {
  const maxWallMs = options?.maxWallMs ?? 90_000;
  const retryDelayMs = options?.retryDelayMs ?? 2000;
  const fetchTimeoutMs = options?.fetchTimeoutMs ?? 12_000;
  const deadline = Date.now() + maxWallMs;
  const maxAttempts = Math.max(1, Math.ceil(maxWallMs / retryDelayMs));

  let lastError: string | undefined;
  let attempt = 0;

  while (Date.now() < deadline) {
    attempt += 1;
    options?.onProgress?.({ attempt, maxAttempts });

    const recovered = await tryRecoverRefillStateFromServer();
    if (recovered) return { ok: true, data: recovered };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), fetchTimeoutMs);

    try {
      const res = await fetch("/api/challenge/refill", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash, token }),
        signal: controller.signal,
      });

      if (res.ok) {
        const data = (await res.json()) as RefillApiSuccess;
        clearPendingRefill();
        return { ok: true, data };
      }

      try {
        const body = await res.json();
        lastError = typeof body.error === "string" ? body.error : undefined;
      } catch {
        lastError = `HTTP_${res.status}`;
      }

      if (lastError === "REFILL_ALREADY_USED") {
        const recoveredAfterUsed = await tryRecoverRefillStateFromServer();
        if (recoveredAfterUsed) return { ok: true, data: recoveredAfterUsed };
        return { ok: false, error: lastError };
      }

      if (lastError === "TX_ALREADY_USED" || lastError === "WALLET_MISMATCH") {
        return { ok: false, error: lastError };
      }

      if (!shouldRetryRefill(lastError, res.status)) {
        return { ok: false, error: lastError };
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        lastError = "REQUEST_TIMEOUT";
      } else {
        lastError = "NETWORK_ERROR";
      }
    } finally {
      clearTimeout(timer);
    }

    if (Date.now() + retryDelayMs >= deadline) break;
    await new Promise((r) => setTimeout(r, retryDelayMs));
  }

  const recovered = await tryRecoverRefillStateFromServer();
  if (recovered) return { ok: true, data: recovered };

  return { ok: false, error: lastError ?? "VERIFY_TIMEOUT" };
}

function shouldRetryRefill(error: string | undefined, status: number): boolean {
  if (!error) return true;
  if (
    error === "TX_NOT_FOUND" ||
    error === "INVALID_PAYMENT" ||
    error === "REQUEST_TIMEOUT" ||
    error === "NETWORK_ERROR" ||
    error === "SERVER_ERROR" ||
    error === "VERIFY_TIMEOUT"
  ) {
    return true;
  }
  if (error.startsWith("HTTP_5")) return true;
  if (status >= 500) return true;
  return false;
}
