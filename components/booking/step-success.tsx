"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

function formatDayLong(d: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
}

type Props = {
  barberName: string;
  serviceName: string;
  date: Date;
  time: string;
  onClose?: () => void;
};

export default function StepSuccess({
  barberName,
  serviceName,
  date,
  time,
  onClose,
}: Props) {
  const t = useTranslations("booking");
  const locale = useLocale();
  return (
    <div className="text-center py-12 max-w-[560px] mx-auto">
      <div
        className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
        style={{ background: "var(--color-surface-2)" }}
      >
        <svg
          className="w-10 h-10 text-[var(--color-bronze)]"
          viewBox="0 0 48 48"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <circle cx="24" cy="24" r="20" />
          <path
            d="M16 24l6 6 12-14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h2
        className="font-display text-[var(--color-text)] mb-3"
        style={{ fontWeight: 500, fontSize: "clamp(24px, 4vw, 32px)" }}
      >
        {t("successTitle")}
      </h2>
      <p
        className="text-[var(--color-text)] mb-2 leading-relaxed"
        style={{ fontSize: "14px" }}
      >
        {formatDayLong(date, locale)} · {time} · {barberName} · «{serviceName}»
      </p>
      <p
        className="text-[var(--color-text-muted)] italic mb-8 leading-relaxed"
        style={{ fontSize: "13px" }}
      >
        {t("successMessage")}
      </p>
      <div className="flex items-center justify-center">
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center bg-[var(--color-action-bg)] text-[var(--color-action-text)] px-6 py-2.5 rounded-[8px] text-[14px] hover:opacity-90 transition-opacity"
          >
            {t("successCta")}
          </button>
        ) : (
          <Link
            href="/"
            className="inline-flex items-center justify-center bg-[var(--color-action-bg)] text-[var(--color-action-text)] px-6 py-2.5 rounded-[8px] text-[14px] hover:opacity-90 transition-opacity"
          >
            {t("successCta")}
          </Link>
        )}
      </div>
    </div>
  );
}
