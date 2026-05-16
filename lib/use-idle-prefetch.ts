"use client";

import { useEffect } from "react";

/**
 * Warms dynamic() chunks on browser idle after page load so the first popup
 * open is instant. Importers are expected to be `() => import("...")` factories
 * matching the ones passed to next/dynamic.
 */
export function useIdlePrefetch(importers: Array<() => Promise<unknown>>) {
  useEffect(() => {
    const run = () => {
      for (const imp of importers) {
        imp().catch(() => {});
      }
    };
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void) => number;
    };
    if (typeof w.requestIdleCallback === "function") {
      w.requestIdleCallback(run);
      return;
    }
    const t = setTimeout(run, 2000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
