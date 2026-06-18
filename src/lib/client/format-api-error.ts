import {
  isApiClientError,
  type ApiClientError,
  type ApiErrorKind,
} from "@/lib/client/api-fetch";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function formatApiErrorMessage(
  error: unknown,
  labels: Dictionary["apiErrors"],
  options?: { showDebug?: boolean }
): string {
  const showDebug = options?.showDebug ?? false;

  if (isApiClientError(error)) {
    return formatKnownApiError(error, labels, showDebug);
  }

  if (error instanceof Error) {
    const base = labels.unknown;
    return showDebug ? `${base} [${error.message.slice(0, 40)}]` : base;
  }

  return labels.unknown;
}

function formatKnownApiError(
  error: ApiClientError,
  labels: Dictionary["apiErrors"],
  showDebug: boolean
): string {
  const byKind: Record<ApiErrorKind, string> = {
    TIMEOUT: labels.timeout,
    NETWORK: labels.network,
    CORS: labels.cors,
    API_DOWN: labels.apiDown,
    DATABASE: labels.database,
    INVALID_RESPONSE: labels.invalidResponse,
    HTTP_ERROR: labels.http.replace("{status}", String(error.status ?? "?")),
    UNAUTHORIZED: labels.unauthorized,
  };

  let message = byKind[error.kind] ?? labels.unknown;

  if (showDebug) {
    const parts: string[] = [error.kind];
    if (error.status != null) parts.push(`HTTP ${error.status}`);
    if (error.code) parts.push(error.code);
    message = `${message} [${parts.join(" · ")}]`;
  }

  return message;
}
