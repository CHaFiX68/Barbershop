"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { WeekSchedule } from "@/lib/db/schema";
import { useTheme } from "@/lib/theme-context";
import BookingCalendar from "./booking-calendar";

function formatYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDayLong(d: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
}

type Slot = { time: string; available: boolean };

type Props = {
  barberId: string;
  serviceId: string;
  serviceName: string;
  servicePrice: string;
  estimatedMinutes: number;
  schedule: WeekSchedule;
  onBack: () => void;
  onSuccess: (bookingId: string, date: Date, time: string) => void;
};

export default function Step3Time({
  barberId,
  serviceId,
  serviceName,
  servicePrice,
  estimatedMinutes,
  schedule,
  onBack,
  onSuccess,
}: Props) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchTick, setRefetchTick] = useState(0);
  const { theme } = useTheme();
  const t = useTranslations("booking");
  const locale = useLocale();

  useEffect(() => {
    if (!selectedDate) {
      setSlots(null);
      return;
    }
    let cancelled = false;
    setLoadingSlots(true);
    setError(null);
    const dateStr = formatYMD(selectedDate);
    fetch(
      `/api/booking/availability?barberId=${barberId}&serviceId=${serviceId}&date=${dateStr}`
    )
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(json?.error || t("errorGeneric"));
        }
        return json as { slots: Slot[] };
      })
      .then((data) => {
        if (cancelled) return;
        setSlots(data.slots);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDate, barberId, serviceId, refetchTick]);

  const handleDateSelect = (d: Date) => {
    setSelectedDate(d);
    setSelectedTime(null);
    setError(null);
  };

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) return;
    setSubmitting(true);
    setError(null);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);
    try {
      const res = await fetch("/api/booking/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barberId,
          serviceId,
          date: formatYMD(selectedDate),
          time: selectedTime,
        }),
        signal: controller.signal,
      });
      const json = (await res.json().catch(() => null)) as
        | { id?: string; error?: string }
        | null;
      if (res.status === 409) {
        setError("Цей слот щойно зайняли. Оберіть інший час.");
        setSelectedTime(null);
        setRefetchTick((v) => v + 1);
        return;
      }
      if (!res.ok || !json?.id) {
        console.error(
          "[BOOKING-SUBMIT] failed",
          { status: res.status, body: json }
        );
        throw new Error(json?.error || t("errorGeneric"));
      }
      onSuccess(json.id, selectedDate, selectedTime);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setError(
          "Запит виконувався занадто довго. Спробуйте ще раз або перевірте підключення."
        );
      } else {
        console.error("[BOOKING-SUBMIT] exception:", err);
        setError(
          err instanceof Error ? err.message : t("errorGeneric")
        );
      }
    } finally {
      clearTimeout(timeoutId);
      setSubmitting(false);
    }
  };

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <BookingCalendar
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          schedule={schedule}
        />
        <button
          type="button"
          onClick={onBack}
          className="mt-4 text-[var(--color-bronze)] hover:text-[var(--color-text)] text-[13px] hover:underline transition-colors"
        >
          ← {t("back")}
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <div
            className="text-[var(--color-text)] mb-1"
            style={{
              fontSize: "10px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              fontWeight: 500,
            }}
          >
            Виберіть час
          </div>
          {selectedDate && (
            <p
              className="font-display italic text-[var(--color-text)]"
              style={{ fontSize: "16px" }}
            >
              {formatDayLong(selectedDate, locale)}
            </p>
          )}
        </div>

        {!selectedDate && (
          <p className="italic text-[var(--color-text-muted)] text-[13px]">
            {t("selectTime")}
          </p>
        )}

        {loadingSlots && (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-10 rounded-[8px] bg-[var(--color-surface)] animate-pulse"
              />
            ))}
          </div>
        )}

        {!loadingSlots && error && (
          <div className="flex flex-col gap-2">
            <p className="text-[var(--color-danger)] text-[13px]">{error}</p>
            <button
              type="button"
              onClick={() => setRefetchTick((v) => v + 1)}
              className="self-start text-[var(--color-bronze)] hover:text-[var(--color-text)] text-[13px] hover:underline transition-colors"
            >
              Спробувати знову
            </button>
          </div>
        )}

        {!loadingSlots &&
          !error &&
          slots !== null &&
          slots.length === 0 &&
          selectedDate && (
            <p className="italic text-[var(--color-text-muted)] text-[13px]">
              {t("noSlots")}
            </p>
          )}

        {!loadingSlots && !error && slots !== null && slots.length > 0 && (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {slots.map((s) => {
              const isSelected = selectedTime === s.time;
              if (!s.available) {
                return (
                  <button
                    key={s.time}
                    type="button"
                    disabled
                    className={`py-2.5 px-3 rounded-[8px] text-[14px] bg-[#F0EDE8] text-[#B5AEA4] cursor-not-allowed ${theme === "dark" ? "line-through decoration-[var(--color-text)] decoration-2" : ""}`}
                  >
                    {s.time}
                  </button>
                );
              }
              return (
                <button
                  key={s.time}
                  type="button"
                  onClick={() => setSelectedTime(s.time)}
                  className={`py-2.5 px-3 rounded-[8px] text-[14px] transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[var(--color-action-bg)] text-[var(--color-action-text)]"
                      : "bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-bg)]"
                  }`}
                  style={{
                    borderWidth: isSelected ? "1px" : "0.5px",
                    borderStyle: "solid",
                    borderColor: isSelected ? "var(--color-text)" : "var(--color-line)",
                  }}
                >
                  {s.time}
                </button>
              );
            })}
          </div>
        )}

        {selectedDate && selectedTime && (
          <div
            className="bg-[var(--color-surface)] rounded-[12px] p-4 mt-2 flex flex-col gap-2"
            style={{
              borderWidth: "0.5px",
              borderStyle: "solid",
              borderColor: "var(--color-line)",
            }}
          >
            <div
              className="text-[var(--color-text)] mb-1"
              style={{
                fontSize: "10px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                fontWeight: 500,
              }}
            >
              Ваш запис
            </div>
            <dl className="text-[13px] grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              <dt className="text-[var(--color-text-muted)]">Послуга:</dt>
              <dd className="text-[var(--color-text)]">{serviceName}</dd>
              <dt className="text-[var(--color-text-muted)]">Ціна:</dt>
              <dd className="text-[var(--color-text)]">{servicePrice}</dd>
              <dt className="text-[var(--color-text-muted)]">Тривалість:</dt>
              <dd className="text-[var(--color-text)]">
                ≈{estimatedMinutes} хв
              </dd>
              <dt className="text-[var(--color-text-muted)]">Дата:</dt>
              <dd className="text-[var(--color-text)]">
                {formatDayLong(selectedDate, locale)}
              </dd>
              <dt className="text-[var(--color-text-muted)]">Час:</dt>
              <dd className="text-[var(--color-text)]">{selectedTime}</dd>
            </dl>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting}
              className="mt-3 w-full bg-[var(--color-action-bg)] text-[var(--color-action-text)] px-4 py-3 rounded-[8px] text-[14px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? t("loading") : t("confirm")}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
