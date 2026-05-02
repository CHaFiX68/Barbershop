import Image from "next/image";
import Link from "next/link";
import type { WeekSchedule } from "@/lib/db/schema";
import { DAY_KEYS } from "@/lib/schedule";

const DAY_LABELS: Record<keyof WeekSchedule, string> = {
  mon: "Пн",
  tue: "Вт",
  wed: "Ср",
  thu: "Чт",
  fri: "Пт",
  sat: "Сб",
  sun: "Нд",
};

function formatHour(minutes: number): string {
  return String(Math.floor(minutes / 60)).padStart(2, "0");
}

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

type Props = {
  name: string;
  bio: string | null;
  landingImage: string | null;
  initials?: string;
  services: { name: string; price: string }[];
  schedule: WeekSchedule;
  ctaHref?: string;
};

const SERVICE_SLOTS = 6;

export default function BarberPublicCard({
  name,
  bio,
  landingImage,
  initials,
  services,
  schedule,
  ctaHref,
}: Props) {
  const renderedInitials = initials ?? getInitials(name);
  const slots: ({ name: string; price: string } | null)[] = Array.from(
    { length: SERVICE_SLOTS },
    (_, i) => services[i] ?? null
  );

  const renderServiceRow = (
    slot: { name: string; price: string } | null,
    i: number
  ) => {
    if (slot) {
      return (
        <div key={`svc-${i}`} style={{ display: "contents" }}>
          <div className="border-b border-[var(--color-line)] text-[var(--color-text)] flex items-end py-2 pr-4">
            {slot.name}
          </div>
          <div className="bg-[var(--color-line)]" />
          <div className="border-b border-[var(--color-line)] text-[var(--color-text-muted)] text-right flex items-end justify-end py-2 pl-1">
            {slot.price}
          </div>
        </div>
      );
    }
    return (
      <div key={`empty-${i}`} style={{ display: "contents" }}>
        <div className="border-b border-[var(--color-line)] flex items-end py-2 pr-4" />
        <div className="bg-[var(--color-line)]" />
        <div className="border-b border-[var(--color-line)] flex items-end justify-end py-2 pl-1" />
      </div>
    );
  };

  const renderDayTile = (
    dayKey: keyof WeekSchedule,
    variant: "mobile" | "desktop"
  ) => {
    const day = schedule[dayKey];
    const enabled = day.enabled;
    const sizing =
      variant === "mobile" ? "aspect-square" : "aspect-square";
    return (
      <div
        key={dayKey}
        className={`${sizing} rounded-[6px] flex flex-col items-center justify-center ${
          enabled
            ? "bg-[var(--color-text)] text-white"
            : "bg-[#EDEAE5] text-[var(--color-text-muted)]"
        }`}
      >
        <div className={`text-[10px] ${enabled ? "font-medium" : ""}`}>
          {DAY_LABELS[dayKey]}
        </div>
        <div
          className={`text-[8px] ${enabled ? "opacity-70" : ""}`}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {enabled
            ? `${formatHour(day.startMinutes)}–${formatHour(day.endMinutes)}`
            : "—"}
        </div>
      </div>
    );
  };

  const photoBlock = (sizes: string) => (
    <div className="relative aspect-[4/5] bg-[#F5F0E6] rounded-[12px] overflow-hidden flex items-center justify-center">
      {landingImage ? (
        <Image
          src={landingImage}
          alt={name}
          fill
          sizes={sizes}
          className="object-cover"
        />
      ) : (
        <span
          className="font-display italic text-[var(--color-text-muted)]"
          style={{ fontSize: "80px" }}
        >
          {renderedInitials}
        </span>
      )}
    </div>
  );

  return (
    <article className="bg-[#FAF7F1] border border-[var(--color-line)] rounded-[16px] p-4 sm:p-5 md:p-7">
      {/* Mobile layout (default, до md) */}
      <div className="md:hidden flex flex-col gap-5">
        <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
          <div className="flex flex-col">
            <h3 className="font-display text-[20px] font-medium text-center mb-2 text-[var(--color-text)]">
              {name}
            </h3>
            {photoBlock("120px")}
            {bio && (
              <p className="mt-2 text-[11px] italic text-[var(--color-text-muted)] text-center leading-[1.5]">
                {bio}
              </p>
            )}
          </div>

          <div className="flex flex-col">
            <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--color-text)] mb-2 text-center">
              Послуги
            </div>
            <div
              className="grid text-[12px]"
              style={{
                gridTemplateColumns: "1fr 1px 60px",
                columnGap: "0",
              }}
            >
              {slots.map((slot, i) => renderServiceRow(slot, i))}
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--color-text)] mb-2 text-center">
            Графік
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {DAY_KEYS.map((dayKey) => renderDayTile(dayKey, "mobile"))}
          </div>
        </div>

        {ctaHref && (
          <Link
            href={ctaHref}
            className="block w-full text-center bg-[var(--color-text)] text-white px-4 py-3 rounded-[8px] text-[13px] font-medium hover:bg-transparent hover:text-[var(--color-text)] hover:border-[var(--color-text)] border border-transparent transition-colors"
          >
            Записатись
          </Link>
        )}
      </div>

      {/* Desktop layout (md+) */}
      <div className="hidden md:grid md:grid-cols-[240px_1fr_44px] md:gap-8 md:items-start">
        <div className="flex flex-col">
          <h3 className="font-display text-[26px] font-medium text-center mb-3 text-[var(--color-text)]">
            {name}
          </h3>
          <div className="mb-3">{photoBlock("240px")}</div>
          {bio && (
            <p className="text-[12px] italic text-[var(--color-text-muted)] text-center leading-[1.5]">
              {bio}
            </p>
          )}
        </div>

        <div className="flex flex-col border-r border-[var(--color-line)] pr-8">
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--color-text)] mb-3 pb-2 text-center border-b border-[var(--color-line)]">
            Послуги
          </div>
          <div
            className="grid text-[13px]"
            style={{
              gridTemplateColumns: "1fr 1px 75px",
              columnGap: "14px",
            }}
          >
            {slots.map((slot, i) => renderServiceRow(slot, i))}
          </div>
          {ctaHref && (
            <Link
              href={ctaHref}
              className="mt-4 block w-full text-center bg-[var(--color-text)] text-white px-4 py-3 rounded-[8px] text-[13px] font-medium hover:bg-transparent hover:text-[var(--color-text)] hover:border-[var(--color-text)] border border-transparent transition-colors"
            >
              Записатись
            </Link>
          )}
        </div>

        <div className="flex flex-col">
          <div className="text-[9px] font-medium uppercase tracking-[0.15em] text-[var(--color-text)] mb-2.5 text-center">
            Графік
          </div>
          <div className="flex flex-col gap-1">
            {DAY_KEYS.map((dayKey) => renderDayTile(dayKey, "desktop"))}
          </div>
        </div>
      </div>
    </article>
  );
}
