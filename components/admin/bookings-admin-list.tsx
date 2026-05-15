"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { BookingItem } from "@/components/bookings/booking-card";

type AdminBookingItem = BookingItem & {
  barberName: string;
  barberEmail: string;
};

type Mode = "today" | "upcoming" | "history";

type Props = {
  mode: Mode;
};

type ComputedStatus = "active" | "pending" | "done" | "cancel" | "no_show";

function getComputedStatus(b: AdminBookingItem, now: Date): ComputedStatus {
  if (b.status === "cancelled") return "cancel";
  if (b.status === "completed") return "done";
  if (b.status === "no_show") return "no_show";
  const ends = new Date(b.endsAt);
  return ends > now ? "active" : "pending";
}

function formatBookingTime(d: Date): string {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function formatBookingDate(d: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  }).format(d);
}

export default function BookingsAdminList({ mode }: Props) {
  const t = useTranslations("management");
  const locale = useLocale();
  const [bookings, setBookings] = useState<AdminBookingItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeBarberEmail, setActiveBarberEmail] = useState<string | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/bookings/all", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const json = (await r.json()) as { bookings: AdminBookingItem[] };
        if (!cancelled) setBookings(json.bookings);
      })
      .catch(() => {
        if (!cancelled) setError(t("bookingsLoadError"));
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  const grouped = useMemo(() => {
    if (!bookings) return null;
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const startOfTomorrow = new Date(
      startOfToday.getTime() + 24 * 60 * 60 * 1000
    );

    const filtered = bookings.filter((b) => {
      const starts = new Date(b.startsAt);
      if (mode === "today") {
        return starts >= startOfToday && starts < startOfTomorrow;
      }
      if (mode === "upcoming") {
        return starts >= startOfTomorrow;
      }
      return starts < startOfToday;
    });

    filtered.sort((a, b) => {
      const ta = new Date(a.startsAt).getTime();
      const tb = new Date(b.startsAt).getTime();
      return ta - tb;
    });

    const map = new Map<
      string,
      { name: string; email: string; items: AdminBookingItem[] }
    >();
    for (const b of filtered) {
      const key = b.barberEmail;
      const existing = map.get(key);
      if (existing) {
        existing.items.push(b);
      } else {
        map.set(key, {
          name: b.barberName,
          email: b.barberEmail,
          items: [b],
        });
      }
    }
    return Array.from(map.values());
  }, [bookings, mode]);

  useEffect(() => {
    if (!grouped || grouped.length === 0) {
      setActiveBarberEmail(null);
      return;
    }
    if (
      !activeBarberEmail ||
      !grouped.some((g) => g.email === activeBarberEmail)
    ) {
      setActiveBarberEmail(grouped[0].email);
    }
  }, [grouped, activeBarberEmail]);

  const activeGroup = useMemo(
    () => grouped?.find((g) => g.email === activeBarberEmail) ?? null,
    [grouped, activeBarberEmail]
  );

  if (error) {
    return (
      <div className="text-center py-8 text-[var(--color-danger)] text-[13px]">
        {error}
      </div>
    );
  }

  if (bookings === null) {
    return (
      <div className="text-center py-8 text-[var(--color-text-muted)] text-[13px]">
        {t("loading")}
      </div>
    );
  }

  if (!grouped || grouped.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--color-text-muted)] text-[13px]">
        {t("noBookings")}
      </div>
    );
  }

  const now = new Date();

  return (
    <>
      <div
        className="flex gap-1.5 mb-3 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        {grouped.map((g) => {
          const isActive = g.email === activeBarberEmail;
          return (
            <button
              key={g.email}
              type="button"
              onClick={() => setActiveBarberEmail(g.email)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-[14px] font-medium border whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-[var(--color-surface-2)] border-[var(--color-text)] text-[var(--color-text)]"
                  : "bg-[var(--color-surface)] border-[var(--color-line)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center font-display italic flex-shrink-0"
                style={{
                  background: "var(--color-bronze)",
                  color: "var(--color-surface)",
                  fontSize: "12px",
                }}
              >
                {g.name.charAt(0).toUpperCase()}
              </span>
              <span>{g.name}</span>
              <span className="text-[12px] opacity-70 tabular-nums">
                {g.items.length}
              </span>
            </button>
          );
        })}
      </div>

      {activeGroup && (
        <div className="flex flex-col gap-1.5">
          {activeGroup.items.map((b) => {
            const starts = new Date(b.startsAt);
            const cs = getComputedStatus(b, now);
            return (
              <div
                key={b.id}
                className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] px-3 py-2 flex items-center gap-3"
              >
                <div className="text-[13px] font-medium tabular-nums text-[var(--color-bronze)] flex-shrink-0 w-[88px] sm:w-[96px]">
                  {mode === "today"
                    ? formatBookingTime(starts)
                    : `${formatBookingDate(starts, locale)} · ${formatBookingTime(starts)}`}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-[var(--color-text)] truncate leading-tight">
                    {b.serviceName}
                  </div>
                  <div className="text-[10px] text-[var(--color-text-muted)] truncate mt-0.5">
                    {b.customerEmail ?? ""}
                    {b.customerEmail ? " · " : ""}
                    {b.servicePrice}
                  </div>
                </div>
                <StatusPill status={cs} />
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function StatusPill({ status }: { status: ComputedStatus }) {
  const styles: Record<
    ComputedStatus,
    { bg: string; color: string; label: string }
  > = {
    active: {
      bg: "rgba(105,160,90,0.12)",
      color: "#6b9c5a",
      label: "ACTIVE",
    },
    pending: {
      bg: "rgba(212,164,80,0.12)",
      color: "#b88a30",
      label: "PENDING",
    },
    done: {
      bg: "var(--color-surface-2)",
      color: "var(--color-text-muted)",
      label: "DONE",
    },
    cancel: {
      bg: "rgba(208,90,90,0.12)",
      color: "var(--color-danger)",
      label: "CANCEL",
    },
    no_show: {
      bg: "rgba(208,90,90,0.12)",
      color: "var(--color-danger)",
      label: "NO-SHOW",
    },
  };
  const s = styles[status];
  return (
    <span
      className="text-[9px] font-medium tracking-[0.5px] px-1.5 py-1 rounded-md flex-shrink-0 whitespace-nowrap"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}
