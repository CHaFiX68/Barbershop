"use client";

import { useEffect, useState } from "react";

const cache = new Map<string, unknown>();
const inflight = new Map<string, Promise<unknown>>();

/**
 * Module-level fetch cache. Data persists across popup open/close cycles
 * within the same session. Use ONLY for stable data (e.g. barbers list,
 * service catalogs) — never for volatile data (slots, bookings, messages).
 * Concurrent callers with the same key share a single in-flight request.
 */
export function useCachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  enabled = true
): { data: T | null; loading: boolean; error: string | null } {
  const [data, setData] = useState<T | null>(
    (cache.get(key) as T | undefined) ?? null
  );
  const [loading, setLoading] = useState(!cache.has(key) && enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (cache.has(key)) {
      setData(cache.get(key) as T);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    let p = inflight.get(key) as Promise<T> | undefined;
    if (!p) {
      p = fetcher();
      inflight.set(key, p);
    }
    p.then((result) => {
      cache.set(key, result);
      inflight.delete(key);
      if (!cancelled) {
        setData(result);
        setError(null);
      }
    })
      .catch((err: unknown) => {
        inflight.delete(key);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  return { data, loading, error };
}

export function invalidateCachedFetch(key: string): void {
  cache.delete(key);
  inflight.delete(key);
}

export function invalidateCachedFetchPrefix(prefix: string): void {
  for (const k of Array.from(cache.keys())) {
    if (k.startsWith(prefix)) cache.delete(k);
  }
  for (const k of Array.from(inflight.keys())) {
    if (k.startsWith(prefix)) inflight.delete(k);
  }
}
