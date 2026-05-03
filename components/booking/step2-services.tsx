"use client";

import Image from "next/image";
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
  onBack: () => void;
};

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function Step2Services({
  barberData,
  loading,
  error,
  onSelect,
  onBack,
}: Props) {
  if (loading || !barberData) {
    if (error) {
      return (
        <div className="text-center py-12">
          <p className="text-[var(--color-text-muted)] italic mb-6">{error}</p>
          <button
            type="button"
            onClick={onBack}
            className="bg-[var(--color-text)] text-[var(--color-bg)] px-6 py-2.5 rounded-[8px] text-[14px] hover:opacity-90 transition-opacity"
          >
            ← Назад до вибору барбера
          </button>
        </div>
      );
    }
    return (
      <section className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
        <div className="bg-[#F5F0E6] rounded-[12px] aspect-square animate-pulse" />
        <div className="flex flex-col gap-2">
          <div className="bg-[#F5F0E6] rounded-[8px] h-6 animate-pulse" />
          <div className="bg-[#F5F0E6] rounded-[8px] h-14 animate-pulse" />
          <div className="bg-[#F5F0E6] rounded-[8px] h-14 animate-pulse" />
          <div className="bg-[#F5F0E6] rounded-[8px] h-14 animate-pulse" />
        </div>
      </section>
    );
  }

  const { barber, services } = barberData;

  return (
    <section className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 md:items-start">
      <div className="flex flex-col gap-3">
        <div className="relative aspect-square bg-[#F5F0E6] rounded-[12px] overflow-hidden flex items-center justify-center">
          {barber.landingImage ? (
            <Image
              src={barber.landingImage}
              alt={barber.name}
              fill
              sizes="280px"
              className="object-cover"
            />
          ) : (
            <span
              className="font-display italic text-[var(--color-text-muted)]"
              style={{ fontSize: "72px" }}
            >
              {getInitials(barber.name)}
            </span>
          )}
        </div>
        <h2
          className="font-display text-center text-[var(--color-text)]"
          style={{ fontSize: "24px", fontWeight: 500 }}
        >
          {barber.name}
        </h2>
        {barber.bio && (
          <p
            className="text-center italic text-[var(--color-text-muted)]"
            style={{ fontSize: "13px", lineHeight: 1.5 }}
          >
            {barber.bio}
          </p>
        )}
      </div>

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
          Оберіть послугу
        </div>

        {services.length === 0 ? (
          <p className="italic text-[var(--color-text-muted)] text-[13px] py-6">
            Цей барбер ще не додав послуг.
          </p>
        ) : (
          <ul className="flex flex-col bg-[#FAF7F1] border border-[var(--color-line)] rounded-[12px] overflow-hidden">
            {services.map((s, i) => {
              const isLast = i === services.length - 1;
              const disabled = s.estimatedMinutes == null;
              const meta = disabled
                ? "тривалість не вказана"
                : `≈ ${s.estimatedMinutes} хв`;

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
                        недоступно для онлайн запису
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelect(s.id)}
                      className={`${rowBase} hover:bg-[#F5F0E6] cursor-pointer`}
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

        <button
          type="button"
          onClick={onBack}
          className="self-start mt-6 text-[#C9B89A] hover:text-[var(--color-text)] text-[13px] hover:underline transition-colors"
        >
          ← Назад до вибору барбера
        </button>
      </div>
    </section>
  );
}
