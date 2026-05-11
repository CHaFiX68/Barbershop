"use client";

type Props = {
  isActive: boolean;
  onChange: () => void;
  disabled?: boolean;
};

export default function ActiveToggle({ isActive, onChange, disabled }: Props) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className="absolute top-3 right-3 flex items-center gap-2 z-10 disabled:opacity-50"
      title={isActive ? "Приймаю клієнтів" : "Не приймаю клієнтів"}
    >
      <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
        {isActive ? "Активний" : "Неактивний"}
      </span>
      <div
        className={`relative w-9 h-5 rounded-full border-2 border-[#1C1B19] transition-colors ${
          isActive ? "bg-[var(--color-action-bg)]" : "bg-[var(--color-line)]"
        }`}
      >
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full transition-[left] ${
            isActive
              ? "bg-[var(--color-action-text)] left-[14px]"
              : "bg-[var(--color-surface)] left-0"
          }`}
        />
      </div>
    </button>
  );
}
