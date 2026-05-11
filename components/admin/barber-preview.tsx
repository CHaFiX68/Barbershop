"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { DAY_KEYS } from "@/lib/schedule";
import type { WeekSchedule } from "@/lib/db/schema";

type Service = { name: string; price: string };

type Props = {
  name: string;
  phone: string | null;
  bio: string | null;
  landingImage: string | null;
  schedule: WeekSchedule;
  services: Service[];
};

function formatHour(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (m === 0) return String(h);
  return `${h}:${String(m).padStart(2, "0")}`;
}

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "??";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function BarberPreview({
  name,
  phone,
  bio,
  landingImage,
  schedule,
  services,
}: Props) {
  const tAnketa = useTranslations("anketa");
  const initials = getInitials(name);

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[12px] p-5 md:p-6 flex flex-col gap-5">
      {/* 1. ФОТО — зверху, велике */}
      <div className="relative w-full max-w-[300px] mx-auto aspect-square bg-[var(--color-surface-2)] rounded-[12px] overflow-hidden flex items-center justify-center">
        {landingImage ? (
          <Image
            src={landingImage}
            alt={name}
            fill
            sizes="(min-width: 768px) 720px, 100vw"
            className="object-cover"
          />
        ) : (
          <span
            className="font-display italic text-[var(--color-text-muted)]"
            style={{ fontSize: "96px" }}
          >
            {initials}
          </span>
        )}
      </div>

      {/* 2. ІМ'Я + контакт + bio */}
      <div className="flex flex-col items-center text-center gap-1.5">
        <h3 className="font-display text-[24px] font-medium text-[var(--color-text)] leading-tight">
          {name}
        </h3>
        {phone && (
          <p className="text-[13px] font-medium text-[var(--color-text)]">
            {phone}
          </p>
        )}
        {bio && (
          <p className="text-[12px] italic text-[var(--color-text-muted)] leading-[1.5] max-w-[600px]">
            {bio}
          </p>
        )}
      </div>

      {/* 3. ПОСЛУГИ */}
      <div className="flex flex-col">
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--color-text)] mb-3 pb-2 text-center border-b border-[var(--color-line)]">
          {tAnketa("servicesTitle")}
        </div>
        {services.length === 0 ? (
          <p className="text-[12px] italic text-[var(--color-text-muted)] text-center py-3">
            {tAnketa("noServices")}
          </p>
        ) : (
          <div className="flex flex-col">
            {services.map((s, i) => (
              <div
                key={`svc-${i}`}
                className="flex items-center justify-between gap-4 py-2 border-b border-[var(--color-line)] text-[13px]"
              >
                <span className="text-[var(--color-text)] truncate">
                  {s.name}
                </span>
                <span className="text-[var(--color-text-muted)] shrink-0">
                  {s.price}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. ГРАФІК — той самий стиль як у public preview */}
      <div className="flex flex-col">
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--color-text)] mb-3 text-center">
          {tAnketa("scheduleTitle")}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {DAY_KEYS.map((dayKey) => {
            const day = schedule[dayKey];
            const enabled = day.enabled;
            return (
              <div
                key={dayKey}
                className={`aspect-square rounded-[6px] flex flex-col items-center justify-center gap-1 ${
                  enabled
                    ? "bg-[var(--color-action-bg)] text-[var(--color-action-text)]"
                    : "bg-[var(--color-surface-2)] border-[0.5px] border-[var(--color-line)] text-[var(--color-text-muted)]"
                }`}
              >
                <div className={`text-[10px] ${enabled ? "font-medium" : ""}`}>
                  {tAnketa(`weekdaysShort.${dayKey}`)}
                </div>
                <div
                  className={`text-[10px] whitespace-nowrap ${enabled ? "opacity-75" : ""}`}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {enabled
                    ? `${formatHour(day.startMinutes)}–${formatHour(day.endMinutes)}`
                    : "—"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
