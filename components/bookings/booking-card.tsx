"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const WEEKDAY_FULL = [
  "Неділя",
  "Понеділок",
  "Вівторок",
  "Середа",
  "Четвер",
  "П'ятниця",
  "Субота",
];
const MONTH_GENITIVE = [
  "січня",
  "лютого",
  "березня",
  "квітня",
  "травня",
  "червня",
  "липня",
  "серпня",
  "вересня",
  "жовтня",
  "листопада",
  "грудня",
];

function formatDateTime(d: Date): string {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${WEEKDAY_FULL[d.getDay()]}, ${d.getDate()} ${MONTH_GENITIVE[d.getMonth()]} · ${hh}:${mm}`;
}

type Status = "active" | "cancelled" | "completed";

type Props = {
  id: string;
  barberName: string;
  serviceName: string;
  servicePrice: string;
  startsAt: string;
  status: Status;
  isUpcoming: boolean;
};

export default function BookingCard({
  id,
  barberName,
  serviceName,
  servicePrice,
  startsAt,
  status,
  isUpcoming,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startsDate = new Date(startsAt);

  const handleCancel = async () => {
    if (busy) return;
    if (!confirm("Точно скасувати запис?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/booking/${id}/cancel`, { method: "PATCH" });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          (json as { error?: string } | null)?.error ||
            "Не вдалось скасувати запис"
        );
      }
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Не вдалось скасувати запис"
      );
    } finally {
      setBusy(false);
    }
  };

  const statusLabel =
    status === "cancelled"
      ? "Скасований"
      : status === "completed"
        ? "Завершений"
        : "Активний";

  const statusClass =
    status === "cancelled"
      ? "text-[#A03030]"
      : status === "completed"
        ? "text-[var(--color-text-muted)]"
        : "text-[#5A7A5A]";

  return (
    <article
      className="bg-[#FAF7F1] rounded-[12px] p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 sm:gap-6 sm:items-center"
      style={{ borderWidth: "0.5px", borderStyle: "solid", borderColor: "#D5D0C8" }}
    >
      <div className="flex flex-col gap-1 min-w-0">
        <span
          className="text-[var(--color-text)] truncate"
          style={{ fontSize: "15px", fontWeight: 500 }}
        >
          {serviceName}
        </span>
        <span
          className="italic text-[var(--color-text-muted)] truncate"
          style={{ fontSize: "12px" }}
        >
          {barberName} · {servicePrice}
        </span>
        <span
          className="font-display italic text-[#C9B89A]"
          style={{ fontSize: "15px" }}
        >
          {formatDateTime(startsDate)}
        </span>
      </div>

      <div className="flex items-center gap-3 sm:flex-col sm:items-end">
        <span
          className={`text-[11px] uppercase ${statusClass}`}
          style={{ letterSpacing: "0.15em", fontWeight: 500 }}
        >
          {statusLabel}
        </span>
        {isUpcoming && status === "active" && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={busy}
            className="px-3 py-1.5 rounded-[8px] text-[12px] text-[#A03030] hover:bg-[rgba(160,48,48,0.06)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? "Скасовуємо..." : "Скасувати"}
          </button>
        )}
      </div>

      {error && (
        <p className="col-span-full text-[12px] text-[#A03030] italic">
          {error}
        </p>
      )}
    </article>
  );
}
