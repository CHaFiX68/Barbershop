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
        className={`w-9 h-5 rounded-full transition-colors ${
          isActive ? "bg-[#1C1B19]" : "bg-[var(--color-line)]"
        }`}
      >
        <div
          className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform mt-0.5 ${
            isActive ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </div>
    </button>
  );
}
