/**
 * Client-side fetch wrapper with timeout, error classification, and console diagnostics.
 * Use during MiniPay testing — set NEXT_PUBLIC_API_DEBUG=true for verbose logs everywhere.
 */

export type ApiErrorKind =
  | "TIMEOUT"
  | "NETWORK"
  | "CORS"
  | "API_DOWN"
  | "DATABASE"
  | "INVALID_RESPONSE"
  | "HTTP_ERROR"
  | "UNAUTHORIZED";

export type ApiClientError = {
  kind: ApiErrorKind;
  message: string;
  url: string;
  method: string;
  status?: number;
  code?: string;
  detail?: string;
  body?: unknown;
  cause?: unknown;
};

export type ApiFetchOptions = RequestInit & {
  /** Request label for logs, e.g. "GET /api/challenge/today" */
  label?: string;
  timeoutMs?: number;
  /** If false, return response even when !res.ok (default: throw on !ok) */
  throwOnHttpError?: boolean;
};

const DEFAULT_TIMEOUT_MS = 25_000;

export function isApiVerboseLogging(): boolean {
  if (typeof window === "undefined") return false;
  if (process.env.NEXT_PUBLIC_API_DEBUG === "true") return true;
  const eth = (window as Window & { ethereum?: { isMiniPay?: boolean } }).ethereum;
  return eth?.isMiniPay === true;
}

function isPrismaCode(code: string): boolean {
  return code.startsWith("P") || code === "DATABASE_ERROR";
}

function classifyHttpFailure(
  status: number,
  body: Record<string, unknown> | null
): ApiErrorKind {
  const errorCode =
    typeof body?.error === "string" ? body.error : undefined;
  const bodyKind = typeof body?.kind === "string" ? body.kind : undefined;

  if (status === 401) return "UNAUTHORIZED";
  if (errorCode === "DATABASE_ERROR" || bodyKind === "DATABASE") {
    return "DATABASE";
  }
  if (
    status === 502 ||
    status === 503 ||
    status === 504 ||
    status === 521 ||
    status === 522
  ) {
    return "API_DOWN";
  }
  if (status >= 500) {
    if (errorCode === "SERVER_ERROR") return "DATABASE";
    return "API_DOWN";
  }
  return "HTTP_ERROR";
}

function networkKind(err: unknown): ApiErrorKind {
  const msg =
    err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  if (
    msg.includes("cors") ||
    msg.includes("cross-origin") ||
    msg.includes("access-control")
  ) {
    return "CORS";
  }
  // Browser blocks often surface as generic "Failed to fetch" (network or CORS).
  if (msg.includes("failed to fetch") || msg.includes("networkerror")) {
    return "NETWORK";
  }
  return "NETWORK";
}

export function logApiError(label: string, error: ApiClientError): void {
  if (!isApiVerboseLogging() && error.kind !== "DATABASE") {
    // Always log a single line; full detail only in verbose / MiniPay.
    console.warn(`[CeloQuest API] ${label}: ${error.kind}`, error.url, error.status ?? "");
    return;
  }

  console.group(`[CeloQuest API] ${label}`);
  console.error("kind:", error.kind);
  console.error("url:", error.url);
  console.error("method:", error.method);
  if (error.status != null) console.error("status:", error.status);
  if (error.code) console.error("code:", error.code);
  if (error.detail) console.error("detail:", error.detail);
  if (error.body) console.error("body:", error.body);
  if (error.cause) console.error("cause:", error.cause);
  console.groupEnd();
}

export function createApiClientError(params: {
  kind: ApiErrorKind;
  url: string;
  method: string;
  status?: number;
  code?: string;
  detail?: string;
  body?: unknown;
  cause?: unknown;
}): ApiClientError {
  return {
    kind: params.kind,
    message: params.detail ?? params.code ?? params.kind,
    url: params.url,
    method: params.method,
    status: params.status,
    code: params.code,
    detail: params.detail,
    body: params.body,
    cause: params.cause,
  };
}

export function isApiClientError(err: unknown): err is ApiClientError {
  return (
    !!err &&
    typeof err === "object" &&
    "kind" in err &&
    typeof (err as ApiClientError).kind === "string"
  );
}

/** Structured fetch — throws {@link ApiClientError} on failure. */
export async function apiFetch(
  input: string,
  options: ApiFetchOptions = {}
): Promise<{ response: Response; data: unknown; text: string }> {
  const method = (options.method ?? "GET").toUpperCase();
  const label = options.label ?? `${method} ${input}`;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const throwOnHttpError = options.throwOnHttpError ?? true;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(input, {
      ...options,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    const kind =
      err instanceof Error && err.name === "AbortError"
        ? "TIMEOUT"
        : networkKind(err);
    const apiErr = createApiClientError({
      kind,
      url: input,
      method,
      detail: err instanceof Error ? err.message : String(err),
      cause: err,
    });
    logApiError(label, apiErr);
    throw apiErr;
  } finally {
    clearTimeout(timer);
  }

  const text = await response.text();
  let data: unknown = null;
  let parseError: unknown;

  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch (err) {
      parseError = err;
    }
  }

  if (parseError && response.ok) {
    const apiErr = createApiClientError({
      kind: "INVALID_RESPONSE",
      url: input,
      method,
      status: response.status,
      detail: "Response is not valid JSON",
      body: text.slice(0, 200),
      cause: parseError,
    });
    logApiError(label, apiErr);
    throw apiErr;
  }

  const bodyObj =
    data && typeof data === "object" ? (data as Record<string, unknown>) : null;
  const errorCode =
    bodyObj && typeof bodyObj.error === "string" ? bodyObj.error : undefined;

  if (errorCode && isPrismaCode(errorCode)) {
    const apiErr = createApiClientError({
      kind: "DATABASE",
      url: input,
      method,
      status: response.status,
      code: errorCode,
      body: data,
    });
    if (throwOnHttpError && !response.ok) {
      logApiError(label, apiErr);
      throw apiErr;
    }
  }

  if (throwOnHttpError && !response.ok) {
    const kind = classifyHttpFailure(response.status, bodyObj);
    const apiErr = createApiClientError({
      kind,
      url: input,
      method,
      status: response.status,
      code: errorCode,
      body: data,
      detail:
        bodyObj && typeof bodyObj.message === "string"
          ? bodyObj.message
          : undefined,
    });
    logApiError(label, apiErr);
    throw apiErr;
  }

  if (isApiVerboseLogging()) {
    console.info(`[CeloQuest API] ${label} → ${response.status}`);
  }

  return { response, data, text };
}

/** Parse JSON body; throws {@link ApiClientError} on failure. */
export async function apiFetchJson<T>(
  input: string,
  options: ApiFetchOptions = {}
): Promise<{ response: Response; data: T }> {
  const { response, data } = await apiFetch(input, options);
  return { response, data: data as T };
}
