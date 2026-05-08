"use client";

import { X } from "lucide-react";

type Props = {
  onClick: () => void;
  className?: string;
  ariaLabel?: string;
};

export default function CloseButton({
  onClick,
  className = "",
  ariaLabel = "Закрити",
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`h-9 w-9 shrink-0 rounded-full border border-[var(--color-line)] text-[var(--color-text-muted)] flex items-center justify-center transition-all duration-200 hover:border-[var(--color-text)] hover:text-[var(--color-text)] hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text)]/20${className ? ` ${className}` : ""}`}
    >
      <X size={18} strokeWidth={1.5} />
    </button>
  );
}
