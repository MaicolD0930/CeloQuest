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

/** POST /api/challenge/refill with timeout; retries TX_NOT_FOUND / INVALID_PAYMENT. */
export async function postRefillUntilConfirmed(
  txHash: string,
  token: RecoveryTokenId,
  options?: { maxAttempts?: number; retryDelayMs?: number; fetchTimeoutMs?: number }
): Promise<{ ok: true; data: RefillApiSuccess } | { ok: false; error?: string }> {
  const maxAttempts = options?.maxAttempts ?? 20;
  const retryDelayMs = options?.retryDelayMs ?? 3000;
  const fetchTimeoutMs = options?.fetchTimeoutMs ?? 55_000;
  const retryable = new Set(["TX_NOT_FOUND", "INVALID_PAYMENT"]);

  let lastError: string | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, retryDelayMs));
    }

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
        return { ok: true, data };
      }

      try {
        const body = await res.json();
        lastError = typeof body.error === "string" ? body.error : undefined;
      } catch {
        lastError = `HTTP_${res.status}`;
      }

      if (lastError === "REFILL_ALREADY_USED" || lastError === "TX_ALREADY_USED") {
        return { ok: false, error: lastError };
      }

      if (!lastError || !retryable.has(lastError)) {
        return { ok: false, error: lastError };
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        lastError = "REQUEST_TIMEOUT";
      } else {
        lastError = "NETWORK_ERROR";
      }
      // Retry timeouts / network blips.
    } finally {
      clearTimeout(timer);
    }
  }

  return { ok: false, error: lastError ?? "TX_NOT_FOUND" };
}
