"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchMe,
  invalidateMeCache,
  type MeResponse,
} from "@/lib/client/me-cache";

type UseMeOptions = {
  onUnauthorized?: () => void;
  skip?: boolean;
};

export function useMe(options: UseMeOptions = {}) {
  const { onUnauthorized, skip = false } = options;
  const [data, setData] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(
    async (force = false) => {
      setError(null);
      setLoading((prev) => (data ? prev : true));
      try {
        const next = await fetchMe({ force });
        setData(next);
        return next;
      } catch (e) {
        const err = e as Error & { status?: number };
        if (err.status === 401 || err.message === "UNAUTHORIZED") {
          onUnauthorized?.();
        } else {
          setError(err.message ?? "ERROR");
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [onUnauthorized, data]
  );

  useEffect(() => {
    if (skip) return;
    let cancelled = false;

    (async () => {
      try {
        const next = await fetchMe();
        if (!cancelled) setData(next);
      } catch (e) {
        if (cancelled) return;
        const err = e as Error & { status?: number };
        if (err.status === 401 || err.message === "UNAUTHORIZED") {
          onUnauthorized?.();
        } else {
          setError(err.message ?? "ERROR");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [skip, onUnauthorized]);

  return {
    data,
    loading,
    error,
    reload,
    invalidate: invalidateMeCache,
  };
}

export { invalidateMeCache, fetchMe, type MeResponse };
