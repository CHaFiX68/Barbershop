"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import ConfirmDialog, {
  type ConfirmOptions,
} from "@/components/ui/confirm-dialog";

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

type Pending = {
  options: ConfirmOptions;
  resolve: (v: boolean) => void;
};

export function ConfirmDialogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [pending, setPending] = useState<Pending | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      setPending({ options, resolve });
      setIsOpen(true);
    });
  }, []);

  const close = useCallback(
    (result: boolean) => {
      if (pending) pending.resolve(result);
      setIsOpen(false);
    },
    [pending]
  );

  const handleExitComplete = useCallback(() => {
    setPending(null);
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        isOpen={isOpen}
        options={pending?.options ?? null}
        onConfirm={() => close(true)}
        onCancel={() => close(false)}
        onExitComplete={handleExitComplete}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error(
      "useConfirm must be used within ConfirmDialogProvider"
    );
  }
  return ctx;
}
