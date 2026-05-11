"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useConfirm } from "@/lib/confirm-context";

function formatDateTime(d: Date, locale: string): string {
  const datePart = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${datePart} · ${hh}:${mm}`;
}

type Status = "active" | "cancelled" | "completed" | "no_show";

export type BookingItem = {
  id: string;
  serviceName: string;
  servicePrice: string;
  startsAt: string;
  endsAt: string;
  status: Status;
  // Customer view
  barberName?: string;
  // Barber view
  customerName?: string;
  customerEmail?: string;
};

type Props = {
  booking: BookingItem;
  role: "customer" | "barber" | "admin";
  onChanged?: () => void;
  showBarberInfo?: boolean;
};

export default function BookingCard({
  booking: b,
  role,
  onChanged,
  showBarberInfo = false,
}: Props) {
  const router = useRouter();
  const confirm = useConfirm();
  const t = useTranslations("myBookings");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startsDate = new Date(b.startsAt);
  const endsDate = new Date(b.endsAt);
  const now = new Date();
  const isUpcoming = b.status === "active" && endsDate > now;
  const isPendingForBarber =
    role === "barber" && b.status === "active" && endsDate <= now;
  const canCancel = isUpcoming && role !== "admin" && startsDate > now;

  const handleStatusChange = async (action: "complete" | "no_show") => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/booking/${b.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          (json as { error?: string } | null)?.error || tCommon("error")
        );
      }
      router.refresh();
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon("error"));
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    if (busy) return;
    const ok = await confirm({
      title: t("cancelConfirmTitle"),
      message: t("cancelConfirmMessage"),
      confirmLabel: t("cancelConfirmLabel"),
      cancelLabel: t("cancelConfirmCancelLabel"),
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/booking/${b.id}/cancel`, {
        method: "PATCH",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          (json as { error?: string } | null)?.error ||
            tCommon("error")
        );
      }
      router.refresh();
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon("error"));
    } finally {
      setBusy(false);
    }
  };

  const statusLabel = isPendingForBarber
    ? t("statusPending")
    : b.status === "cancelled"
      ? t("statusCancelled")
      : b.status === "completed"
        ? t("statusCompleted")
        : b.status === "no_show"
          ? t("statusNoShow")
          : t("statusActive");

  const statusClass = isPendingForBarber
    ? "text-[var(--color-bronze)]"
    : b.status === "cancelled" || b.status === "no_show"
      ? "text-[var(--color-danger)]"
      : b.status === "completed"
        ? "text-[var(--color-text-muted)]"
        : "text-[#5A7A5A]";

  const personLine = (() => {
    if (role === "customer") return b.barberName ?? "";
    const customerPart = `${b.customerName ?? ""}${
      b.customerEmail ? ` · ${b.customerEmail}` : ""
    }`;
    if (showBarberInfo && b.barberName) {
      return `${t("barberLabel")}: ${b.barberName} · ${customerPart}`;
    }
    return customerPart;
  })();

  return (
    <article
      className="bg-[var(--color-surface)] rounded-[12px] p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 sm:gap-6 sm:items-center"
      style={{
        borderWidth: "0.5px",
        borderStyle: "solid",
        borderColor: "var(--color-line)",
      }}
    >
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-base font-medium text-[var(--color-text)] truncate">
          {b.serviceName}
        </span>
        <span className="text-sm text-[var(--color-text-muted)] truncate">
          {personLine} · {b.servicePrice}
        </span>
        <span className="text-sm font-medium text-[var(--color-text)]">
          {formatDateTime(startsDate, locale)}
        </span>
      </div>

      <div className="flex items-center gap-3 sm:flex-col sm:items-end">
        <span
          className={`text-xs uppercase tracking-wider font-medium ${statusClass}`}
        >
          {statusLabel}
        </span>
        {canCancel && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={busy}
            className="px-3 py-1.5 rounded-[8px] text-sm text-[var(--color-danger)] bg-[rgba(160,48,48,0.06)] border border-[rgba(160,48,48,0.25)] hover:bg-[rgba(160,48,48,0.12)] hover:border-[rgba(160,48,48,0.4)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? "…" : t("cancelButton")}
          </button>
        )}
      </div>

      {isPendingForBarber && (
        <div className="col-span-full flex flex-col gap-2 mt-1">
          <p className="text-[11px] italic text-[var(--color-text-muted)] text-center">
            {t("pendingHint")}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleStatusChange("complete")}
              disabled={busy}
              className="flex-1 py-2 rounded-[8px] text-[12px] bg-[var(--color-action-bg)] text-[var(--color-action-text)] hover:opacity-85 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("actionComplete")}
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange("no_show")}
              disabled={busy}
              className="flex-1 py-2 rounded-[8px] text-[12px] border border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("actionNoShow")}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="col-span-full text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}
    </article>
  );
}
