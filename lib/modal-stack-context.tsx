"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";

type StackItem = {
  id: string;
  onCloseRef: MutableRefObject<() => void>;
  respectEsc: boolean;
};

type ModalStackContextValue = {
  register: (item: StackItem) => void;
  unregister: (id: string) => void;
  isTop: (id: string) => boolean;
  getZIndex: (id: string) => number;
};

const ModalStackContext = createContext<ModalStackContextValue | null>(null);

const BASE_Z_INDEX = 50;
const STEP = 10;

export function ModalStackProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [stack, setStack] = useState<StackItem[]>([]);

  const register = useCallback((item: StackItem) => {
    setStack((prev) => {
      if (prev.some((i) => i.id === item.id)) {
        // Same id already in stack — replace ref/options without changing position
        return prev.map((i) => (i.id === item.id ? item : i));
      }
      return [...prev, item];
    });
  }, []);

  const unregister = useCallback((id: string) => {
    setStack((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const isTop = useCallback(
    (id: string) => stack.length > 0 && stack[stack.length - 1].id === id,
    [stack]
  );

  const getZIndex = useCallback(
    (id: string) => {
      const idx = stack.findIndex((i) => i.id === id);
      if (idx < 0) return BASE_Z_INDEX;
      return BASE_Z_INDEX + idx * STEP;
    },
    [stack]
  );

  // Global ESC: walk from top down and close first item with respectEsc=true.
  // Items with respectEsc=false (e.g., chat popup) are skipped — ESC passes
  // through them to the next eligible modal below.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].respectEsc) {
          stack[i].onCloseRef.current();
          return;
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [stack]);

  const value = useMemo<ModalStackContextValue>(
    () => ({ register, unregister, isTop, getZIndex }),
    [register, unregister, isTop, getZIndex]
  );

  return (
    <ModalStackContext.Provider value={value}>
      {children}
    </ModalStackContext.Provider>
  );
}

type UseModalStackOptions = {
  respectEsc?: boolean;
};

/**
 * Register an overlay in the global stack while it's open.
 *
 * Returns a `zIndex` for inline style and `isTop` for components that need
 * to know whether they own the top of the stack. When the provider is
 * missing (e.g., dev/storybook isolation) callers fall back to the base
 * z-index — the UI degrades gracefully but ESC routing won't work.
 *
 * Pass `respectEsc: false` for popups that should remain open on Escape
 * (chat popup, etc.) — they still occupy a slot for z-index ordering, but
 * the global ESC handler skips past them to the next eligible modal.
 */
export function useModalStack(
  id: string,
  isOpen: boolean,
  onClose: () => void,
  options: UseModalStackOptions = {}
) {
  const { respectEsc = true } = options;
  const ctx = useContext(ModalStackContext);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Pull register/unregister out of ctx for effect deps. Both are stable
  // (useCallback([], ...) in the provider), so deps stay constant across
  // renders. Putting `ctx` itself in deps would re-fire the effect every
  // time `stack` mutates (the memoized `value` object re-references on each
  // stack update), creating an unregister↔register loop.
  const register = ctx?.register;
  const unregister = ctx?.unregister;

  useEffect(() => {
    if (!register || !unregister || !isOpen) return;
    register({ id, onCloseRef, respectEsc });
    return () => unregister(id);
  }, [register, unregister, id, isOpen, respectEsc]);

  return {
    zIndex: ctx?.getZIndex(id) ?? BASE_Z_INDEX,
    isTop: ctx?.isTop(id) ?? true,
  };
}
