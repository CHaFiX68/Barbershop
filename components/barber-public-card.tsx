"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import type { DaySchedule, WeekSchedule } from "@/lib/db/schema";
import { DAY_KEYS } from "@/lib/schedule";
import { useBooking } from "@/lib/booking-context";

const EMPTY_DAY: DaySchedule = {
  enabled: false,
  startMinutes: 0,
  endMinutes: 0,
  breakStartMinutes: null,
  breakEndMinutes: null,
};

const EMPTY_WEEK: WeekSchedule = {
  mon: EMPTY_DAY,
  tue: EMPTY_DAY,
  wed: EMPTY_DAY,
  thu: EMPTY_DAY,
  fri: EMPTY_DAY,
  sat: EMPTY_DAY,
  sun: EMPTY_DAY,
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

type ServicePublic = { name: string; price: string };

type Props = {
  name: string;
  phone: string | null;
  bio: string | null;
  landingImage: string | null;
  initials?: string;
  barberId?: string;
  variant?: "compact" | "preview";
  services?: ServicePublic[];
  schedule?: WeekSchedule;
};

const SERVICE_SLOTS = 6;

export default function BarberPublicCard({
  name,
  phone,
  bio,
  landingImage,
  initials,
  barberId,
  variant = "compact",
  services = [],
  schedule,
}: Props) {
  const renderedInitials = initials ?? getInitials(name);

  if (variant === "preview") {
    return (
      <PreviewLayout
        name={name}
        phone={phone}
        bio={bio}
        landingImage={landingImage}
        initials={renderedInitials}
        services={services}
        schedule={schedule ?? EMPTY_WEEK}
      />
    );
  }

  return (
    <CompactLayout
      name={name}
      landingImage={landingImage}
      initials={renderedInitials}
      barberId={barberId}
    />
  );
}

function CompactLayout({
  name,
  landingImage,
  initials,
  barberId,
}: {
  name: string;
  landingImage: string | null;
  initials: string;
  barberId?: string;
}) {
  const booking = useBooking();
  const photo = (
    <div className="relative w-40 md:w-62.5 aspect-[3/4] mx-auto bg-[var(--color-surface-2)] rounded-[8px] md:rounded-[10px] overflow-hidden flex items-center justify-center">
      {landingImage ? (
        <Image
          src={landingImage}
          alt={name}
          fill
          sizes="(min-width: 768px) 250px, 160px"
          className="object-cover"
        />
      ) : (
        <span className="font-display italic text-[var(--color-text-muted)] text-[60px] md:text-[83px]">
          {initials}
        </span>
      )}
    </div>
  );

  const body = (
    <>
      {photo}
      <h3 className="font-display text-base md:text-[22px] text-center mt-2.5 md:mt-3 text-[var(--color-text)]">
        {name}
      </h3>
    </>
  );

  const baseClass =
    "block bg-[var(--color-surface)] border-[0.5px] border-[var(--color-line)] rounded-[10px] md:rounded-[12px] p-3 md:p-4 max-w-45 md:max-w-70 mx-auto";

  if (barberId) {
    return (
      <button
        type="button"
        onClick={() => booking.open(barberId)}
        className={`${baseClass} text-left hover:scale-[1.035] hover:ring-2 hover:ring-[var(--color-text)] hover:shadow-[0_8px_30px_rgba(28,27,25,0.25)]`}
        style={{
          transition:
            "transform 1318ms cubic-bezier(0.16,1,0.3,1), box-shadow 1318ms cubic-bezier(0.16,1,0.3,1), border-color 1318ms cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {body}
      </button>
    );
  }
  return <article className={baseClass}>{body}</article>;
}

function PreviewLayout({
  name,
  phone,
  bio,
  landingImage,
  initials,
  services,
  schedule,
}: {
  name: string;
  phone: string | null;
  bio: string | null;
  landingImage: string | null;
  initials: string;
  services: ServicePublic[];
  schedule: WeekSchedule;
}) {
  const tAnketa = useTranslations("anketa");
  const slots: (ServicePublic | null)[] = Array.from(
    { length: SERVICE_SLOTS },
    (_, i) => services[i] ?? null
  );

  const renderServiceRow = (slot: ServicePublic | null, i: number) => {
    if (slot) {
      return (
        <div key={`svc-${i}`} style={{ display: "contents" }}>
          <div className="border-b border-[var(--color-line)] text-[var(--color-text)] flex items-end md:items-center min-w-0 py-1 md:py-0 pr-4">
            <span className="truncate leading-[1.3]">{slot.name}</span>
          </div>
          <div className="bg-[var(--color-line)]" />
          <div className="border-b border-[var(--color-line)] text-[var(--color-text-muted)] text-right flex items-end md:items-center justify-end py-1 md:py-0 pl-1">
            {slot.price}
          </div>
        </div>
      );
    }
    return (
      <div key={`empty-${i}`} style={{ display: "contents" }}>
        <div className="border-b border-[var(--color-line)] flex items-end md:items-center min-w-0 py-1 md:py-0 pr-4" />
        <div className="bg-[var(--color-line)]" />
        <div className="border-b border-[var(--color-line)] flex items-end md:items-center justify-end py-1 md:py-0 pl-1" />
      </div>
    );
  };

  const renderDayTile = (dayKey: keyof WeekSchedule) => {
    const day = schedule[dayKey];
    const enabled = day.enabled;
    return (
      <div
        key={dayKey}
        className={`aspect-square rounded-[6px] flex flex-col items-center justify-center ${
          enabled
            ? "bg-[var(--color-action-bg)] text-[var(--color-action-text)]"
            : "bg-[var(--color-bg)] text-[var(--color-text-muted)]"
        }`}
      >
        <div className={`text-[10px] ${enabled ? "font-medium" : ""}`}>
          {tAnketa(`weekdaysShort.${dayKey}`)}
        </div>
        <div
          className={`text-[8px] md:text-[12px] ${enabled ? "opacity-70" : ""}`}
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
    <div className="relative aspect-[4/5] bg-[var(--color-surface-2)] rounded-[12px] overflow-hidden flex items-center justify-center">
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
          {initials}
        </span>
      )}
    </div>
  );

  return (
    <article className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[16px] p-4 sm:p-5 md:p-7">
      {/* Mobile layout (default, до md) */}
      <div className="md:hidden flex flex-col gap-5">
        <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
          <div className="flex flex-col">
            <h3 className="font-display text-[20px] font-medium text-center mb-2 text-[var(--color-text)]">
              {name}
            </h3>
            {photoBlock("120px")}
            {phone && (
              <p className="mt-2 text-[12px] font-medium text-[var(--color-text)] text-center leading-[1.4]">
                {phone}
              </p>
            )}
            {bio && (
              <p className="mt-1 text-[11px] italic text-[var(--color-text-muted)] text-center leading-[1.5]">
                {bio}
              </p>
            )}
          </div>

          <div className="flex flex-col">
            <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--color-text)] mb-2 text-center">
              {tAnketa("servicesTitle")}
            </div>
            <div
              className="grid text-[12px]"
              style={{
                gridTemplateColumns: "minmax(0, 1fr) 1px 60px",
                columnGap: "0",
              }}
            >
              {slots.map((slot, i) => renderServiceRow(slot, i))}
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--color-text)] mb-2 text-center">
            {tAnketa("scheduleTitle")}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {DAY_KEYS.map((dayKey) => renderDayTile(dayKey))}
          </div>
        </div>
      </div>

      {/* Desktop layout (md+) */}
      <div className="hidden md:grid md:grid-cols-[240px_1fr_56px] md:gap-8 md:items-start">
        <div className="flex flex-col">
          <h3 className="font-display text-[26px] font-medium text-center mb-3 text-[var(--color-text)]">
            {name}
          </h3>
          <div className="mb-3">{photoBlock("240px")}</div>
          {phone && (
            <p className="text-[13px] font-medium text-[var(--color-text)] text-center leading-[1.4]">
              {phone}
            </p>
          )}
          {bio && (
            <p className="mt-1 text-[12px] italic text-[var(--color-text-muted)] text-center leading-[1.5]">
              {bio}
            </p>
          )}
        </div>

        <div className="flex flex-col border-r border-[var(--color-line)] pr-8">
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--color-text)] mb-3 pb-2 text-center border-b border-[var(--color-line)]">
            {tAnketa("servicesTitle")}
          </div>
          <div
            className="grid text-[13px]"
            style={{
              gridTemplateColumns: "minmax(0, 1fr) 1px 75px",
              columnGap: "14px",
              gridAutoRows: "56px",
            }}
          >
            {slots.map((slot, i) => renderServiceRow(slot, i))}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="text-[9px] font-medium uppercase tracking-[0.15em] text-[var(--color-text)] mb-2.5 text-center">
            {tAnketa("scheduleTitle")}
          </div>
          <div className="flex flex-col gap-1">
            {DAY_KEYS.map((dayKey) => renderDayTile(dayKey))}
          </div>
        </div>
      </div>
    </article>
  );
}
