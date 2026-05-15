"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useModalStack } from "@/lib/modal-stack-context";

export type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type Props = {
  isOpen: boolean;
  options: ConfirmOptions | null;
  onConfirm: () => void;
  onCancel: () => void;
  onExitComplete: () => void;
};

export default function ConfirmDialog({
  isOpen,
  options,
  onConfirm,
  onCancel,
  onExitComplete,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const { zIndex, isTop } = useModalStack("confirm-dialog", isOpen, onCancel);
  const tCommon = useTranslations("common");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const danger = options?.danger ?? false;
  const confirmLabel =
    options?.confirmLabel ?? (danger ? tCommon("delete") : tCommon("confirm"));
  const cancelLabel = options?.cancelLabel ?? tCommon("cancel");

  return createPortal(
    <AnimatePresence onExitComplete={onExitComplete}>
      {isOpen && options && (
        <motion.div
          key="confirm-overlay"
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          style={{ zIndex }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onMouseDown={(e) => {
            if (e.target !== e.currentTarget) return;
            if (!isTop) return;
            onCancel();
          }}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-label={options.title ?? tCommon("confirm")}
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-[440px] bg-[var(--color-bg)]/85 backdrop-blur-[8px] border border-[var(--color-line)] rounded-[16px] shadow-[0_24px_48px_rgba(0,0,0,0.18)] overflow-hidden"
          >
            <div className="px-6 pt-6 pb-5">
              {options.title && (
                <h3
                  className="font-display text-[var(--color-text)] mb-2"
                  style={{ fontSize: "20px", fontWeight: 600 }}
                >
                  {options.title}
                </h3>
              )}
              <p
                className="text-[var(--color-text-muted)]"
                style={{ fontSize: "13px", lineHeight: 1.55 }}
              >
                {options.message}
              </p>
            </div>
            <div className="flex gap-2 px-6 pb-6">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2.5 rounded-[8px] border border-[var(--color-line)] bg-transparent text-[var(--color-text)] text-[13px] hover:bg-black/5 transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                autoFocus
                className={`flex-1 px-4 py-2.5 rounded-[8px] text-[13px] font-medium transition-colors ${
                  danger
                    ? "bg-[var(--color-danger)] text-white hover:bg-[#8B2828]"
                    : "bg-[var(--color-action-bg)] text-[var(--color-action-text)] hover:opacity-90"
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
