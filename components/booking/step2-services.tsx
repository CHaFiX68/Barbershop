"use client";

import { useTranslations } from "next-intl";
import type { BookingServiceItem } from "./booking-flow";

type BarberInfo = {
  userId: string;
  name: string;
  bio: string | null;
  landingImage: string | null;
};

type Props = {
  barberData: { barber: BarberInfo; services: BookingServiceItem[] } | null;
  loading: boolean;
  error: string | null;
  onSelect: (serviceId: string) => void;
  onBack?: () => void;
};

export default function Step2Services({
  barberData,
  loading,
  error,
  onSelect,
  onBack,
}: Props) {
  const t = useTranslations("booking");
  if (loading || !barberData) {
    if (error) {
      return (
        <div className="text-center py-12">
          <p className="text-[var(--color-text-muted)] italic mb-6">{error}</p>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="bg-[var(--color-action-bg)] text-[var(--color-action-text)] px-6 py-2.5 rounded-[8px] text-[14px] hover:opacity-90 transition-opacity"
            >
              ← {t("back")}
            </button>
          )}
        </div>
      );
    }
    return (
      <section className="max-w-200 mx-auto">
        <div className="flex flex-col gap-2">
          <div className="bg-[var(--color-surface-2)] rounded-[8px] h-6 animate-pulse" />
          <div className="bg-[var(--color-surface-2)] rounded-[8px] h-14 animate-pulse" />
          <div className="bg-[var(--color-surface-2)] rounded-[8px] h-14 animate-pulse" />
          <div className="bg-[var(--color-surface-2)] rounded-[8px] h-14 animate-pulse" />
        </div>
      </section>
    );
  }

  const { services } = barberData;

  return (
    <section className="max-w-200 mx-auto">
      <div className="flex flex-col">
        <div
          className="text-[var(--color-text)] mb-3"
          style={{
            fontSize: "10px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            fontWeight: 500,
          }}
        >
          {t("selectService")}
        </div>

        {services.length === 0 ? (
          <p className="italic text-[var(--color-text-muted)] text-[13px] py-6">
            {t("noServices")}
          </p>
        ) : (
          <ul className="flex flex-col bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[12px] overflow-hidden">
            {services.map((s, i) => {
              const isLast = i === services.length - 1;
              const disabled = s.estimatedMinutes == null;
              const meta = disabled
                ? "—"
                : `≈ ${t("duration", { minutes: s.estimatedMinutes ?? 0 })}`;

              const rowBase = `flex items-center gap-3 py-3 px-4 transition-colors text-left w-full ${
                isLast ? "" : "border-b border-[var(--color-line)]"
              }`;

              return (
                <li key={s.id}>
                  {disabled ? (
                    <div
                      className={`${rowBase} opacity-50 cursor-not-allowed`}
                      aria-disabled="true"
                    >
                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <span
                          className="text-[var(--color-text)] truncate"
                          style={{ fontSize: "14px" }}
                        >
                          {s.name}
                        </span>
                        <span
                          className="text-[var(--color-text-muted)] truncate"
                          style={{ fontSize: "11px" }}
                        >
                          {meta}
                        </span>
                      </div>
                      <span
                        className="italic text-[var(--color-text-muted)] text-right shrink-0"
                        style={{ fontSize: "11px" }}
                      >
                        —
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelect(s.id)}
                      className={`${rowBase} hover:bg-[var(--color-surface-2)] cursor-pointer`}
                    >
                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <span
                          className="text-[var(--color-text)] truncate"
                          style={{ fontSize: "14px" }}
                        >
                          {s.name}
                        </span>
                        <span
                          className="text-[var(--color-text-muted)] truncate"
                          style={{ fontSize: "11px" }}
                        >
                          {meta}
                        </span>
                      </div>
                      <span
                        className="text-[var(--color-text)] font-medium text-right shrink-0"
                        style={{ fontSize: "14px" }}
                      >
                        {s.price}
                      </span>
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="self-start mt-6 text-[var(--color-bronze)] hover:text-[var(--color-text)] text-[13px] hover:underline transition-colors"
          >
            ← {t("back")}
          </button>
        )}
      </div>
    </section>
  );
}
