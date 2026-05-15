"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { WeekSchedule } from "@/lib/db/schema";
import { normalizeWeekSchedule } from "@/lib/schedule";
import { useModalStack } from "@/lib/modal-stack-context";
import BarberPreview from "./barber-preview";
import BarbersAdminList from "./barbers-admin-list";
import BookingsAdminList from "./bookings-admin-list";
import CloseButton from "@/components/ui/close-button";
import { useConfirm } from "@/lib/confirm-context";

type Tab = "barbers" | "today" | "upcoming" | "history";

type Barber = {
  userId: string;
  name: string;
  email: string;
  avatar: string | null;
  approvedPhone: string | null;
  pendingPhone: string | null;
  phone: string | null;
  bio: string | null;
  landingImage: string | null;
  isActive: boolean;
  hasPending: boolean;
  schedule: WeekSchedule;
  services: { name: string; price: string }[];
  createdAt: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

type BarberRowProps = {
  barber: Barber;
  busy: boolean;
  toggleBusy: boolean;
  onApprove: () => void;
  onReject: () => void;
  onToggleActive: () => void;
};

function BarberRow({
  barber,
  busy,
  toggleBusy,
  onApprove,
  onReject,
  onToggleActive,
}: BarberRowProps) {
  const t = useTranslations("management");
  const tAnketa = useTranslations("anketa");
  return (
    <div
      className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[12px] overflow-hidden"
    >
      <div className="flex items-center gap-4 p-3">
        <div className="flex-shrink-0">
          {barber.avatar ? (
            <Image
              src={barber.avatar}
              alt={barber.name}
              width={48}
              height={48}
              className="rounded-[8px] object-cover"
              style={{ width: 48, height: 48 }}
            />
          ) : (
            <div
              className="w-12 h-12 rounded-[8px] bg-[var(--color-surface-2)] flex items-center justify-center font-display italic"
              style={{ color: "var(--color-bronze)", fontSize: "20px" }}
            >
              {barber.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-display text-[15px] font-medium truncate">
              {barber.name}
            </span>
            {barber.hasPending && (
              <span
                className="inline-flex items-center px-2 py-0.5 text-[10px] uppercase rounded-[4px]"
                style={{
                  background: "#F5E6C8",
                  color: "#8A6D2A",
                  letterSpacing: "0.15em",
                }}
              >
                {tAnketa("pending")}
              </span>
            )}
            {!barber.isActive && (
              <span
                className="inline-flex items-center px-2 py-0.5 text-[10px] uppercase rounded-[4px]"
                style={{
                  background: "#EAEAEA",
                  color: "var(--color-text-muted)",
                  letterSpacing: "0.15em",
                }}
              >
                Неактивний
              </span>
            )}
          </div>
          <div className="text-[12px] text-[var(--color-text-muted)] truncate">
            {barber.email}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onToggleActive}
            disabled={toggleBusy}
            className="flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title={barber.isActive ? "Прийняти зі списку публічних" : "Зробити публічним"}
          >
            <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
              {barber.isActive ? tAnketa("active") : tAnketa("hidden")}
            </span>
            <div
              className={`relative w-9 h-5 rounded-full border-2 border-[#1C1B19] transition-colors ${
                barber.isActive ? "bg-[var(--color-action-bg)]" : "bg-[var(--color-line)]"
              }`}
            >
              <div
                className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full transition-[left] ${
                  barber.isActive
                    ? "bg-[var(--color-action-text)] left-[14px]"
                    : "bg-[var(--color-surface)] left-0"
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      <div className="border-t border-[var(--color-line)] p-4">
          <BarberPreview
            name={barber.name}
            phone={barber.phone}
            bio={barber.bio}
            landingImage={barber.landingImage}
            schedule={barber.schedule}
            services={barber.services}
          />

          {barber.hasPending && (() => {
            const pendingPhoneMissing = !(barber.pendingPhone ?? "").trim();
            return (
              <div className="flex items-center gap-3 mt-4 justify-end">
                {pendingPhoneMissing && (
                  <span className="italic text-[11px] text-[var(--color-danger)]">
                    Барбер не вказав телефон
                  </span>
                )}
                <button
                  type="button"
                  onClick={onReject}
                  disabled={busy}
                  className="px-4 py-2 rounded-[8px] text-[12px] border border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] transition-colors disabled:opacity-50"
                >
                  {t("reject")}
                </button>
                <button
                  type="button"
                  onClick={onApprove}
                  disabled={busy || pendingPhoneMissing}
                  title={
                    pendingPhoneMissing
                      ? "Барбер не вказав телефон"
                      : undefined
                  }
                  className="px-4 py-2 rounded-[8px] text-[12px] bg-green-700 text-white hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("approve")}
                </button>
              </div>
            );
          })()}
        </div>
    </div>
  );
}

export default function ManagementModal({ isOpen, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [barbers, setBarbers] = useState<Barber[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promoteEmail, setPromoteEmail] = useState("");
  const [promoteBusy, setPromoteBusy] = useState(false);
  const [promoteError, setPromoteError] = useState<string | null>(null);
  const [promoteSuccess, setPromoteSuccess] = useState<string | null>(null);
  const [actionBusyUserId, setActionBusyUserId] = useState<string | null>(null);
  const [toggleBusyUserId, setToggleBusyUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("barbers");
  const confirm = useConfirm();
  const t = useTranslations("management");

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchBarbers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/barbers", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      const json = (await res.json()) as { barbers: Barber[] };
      setBarbers(
        json.barbers.map((b) => ({
          ...b,
          schedule: normalizeWeekSchedule(b.schedule),
        }))
      );
    } catch {
      setError("Не вдалося завантажити список барберів");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setBarbers(null);
      setPromoteEmail("");
      setPromoteError(null);
      setPromoteSuccess(null);
      return;
    }
    fetchBarbers();
  }, [isOpen]);

  const { zIndex, isTop } = useModalStack("management-modal", isOpen, onClose);

  const handlePromote = async () => {
    const email = promoteEmail.trim();
    if (!email) return;
    setPromoteBusy(true);
    setPromoteError(null);
    setPromoteSuccess(null);
    try {
      const res = await fetch("/api/admin/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPromoteError(data.error ?? "Помилка");
        return;
      }
      setPromoteEmail("");
      setPromoteSuccess(`${data.name} додано як барбера`);
      setTimeout(() => setPromoteSuccess(null), 3000);
      await fetchBarbers();
    } catch {
      setPromoteError("Не вдалося виконати дію");
    } finally {
      setPromoteBusy(false);
    }
  };

  const handleAction = async (
    action: "approve" | "reject" | "demote",
    userId: string
  ) => {
    setActionBusyUserId(userId);
    try {
      const url =
        action === "demote"
          ? "/api/admin/demote"
          : `/api/admin/anketa/${action}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Помилка");
        return;
      }
      await fetchBarbers();
    } catch {
      alert("Не вдалося виконати дію");
    } finally {
      setActionBusyUserId(null);
    }
  };

  const handleToggleActive = async (userId: string, current: boolean) => {
    const next = !current;
    setToggleBusyUserId(userId);
    setBarbers((prev) =>
      prev
        ? prev.map((b) =>
            b.userId === userId ? { ...b, isActive: next } : b
          )
        : prev
    );
    try {
      const res = await fetch(`/api/admin/barber/${userId}/toggle-active`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: next }),
      });
      if (!res.ok) {
        setBarbers((prev) =>
          prev
            ? prev.map((b) =>
                b.userId === userId ? { ...b, isActive: current } : b
              )
            : prev
        );
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Не вдалося змінити статус");
      }
    } catch {
      setBarbers((prev) =>
        prev
          ? prev.map((b) =>
              b.userId === userId ? { ...b, isActive: current } : b
            )
          : prev
      );
      alert("Не вдалося змінити статус");
    } finally {
      setToggleBusyUserId(null);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="management-overlay"
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          style={{ zIndex }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={(e) => {
            if (e.target !== e.currentTarget) return;
            if (!isTop) return;
            onClose();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t("title")}
            data-management-modal
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-[calc(100vw-32px)] h-[90vh] md:w-[800px] md:max-w-[90vw] md:h-[600px] md:max-h-[85vh] overflow-hidden bg-[var(--color-bg)]/85 backdrop-blur-[8px] border border-[var(--color-line)] rounded-3xl shadow-[0_24px_48px_rgba(0,0,0,0.18)] flex flex-col"
          >
        <div className="flex items-center justify-between px-4 md:px-6 pt-3 md:pt-4 pb-2 shrink-0">
          <h2
            className="font-display"
            style={{ fontSize: "20px", fontWeight: 600 }}
          >
            {t("title")}
          </h2>
          <CloseButton onClick={onClose} />
        </div>

        <div
          className="flex border-b border-[var(--color-line)] px-4 md:px-6 shrink-0 overflow-x-auto"
          style={{ scrollbarWidth: "none" }}
        >
          {(
            [
              { id: "barbers", label: t("tabBarbers") },
              { id: "today", label: t("tabToday") },
              { id: "upcoming", label: t("tabUpcoming") },
              { id: "history", label: t("tabHistory") },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-4 text-[13px] font-medium tracking-wide transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-b-2 border-[var(--color-text)] text-[var(--color-text)] -mb-px"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="custom-scrollbar overflow-y-auto flex-1 px-4 md:px-6 py-3 md:py-4">
        {activeTab === "barbers" && (
        <>
        <div
          style={{
            background: "var(--color-surface-2)",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "20px",
          }}
        >
          <div
            className="text-[13px] font-medium mb-3"
            style={{ color: "var(--color-text)" }}
          >
            {t("promoteTitle")}
          </div>
          <div className="flex gap-2 items-stretch">
            <input
              type="email"
              value={promoteEmail}
              onChange={(e) => setPromoteEmail(e.target.value)}
              placeholder={t("promoteEmail")}
              disabled={promoteBusy}
              className="flex-1 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[8px] px-3 py-2 outline-none focus:border-[var(--color-text)] text-[13px] disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handlePromote}
              disabled={promoteBusy || !promoteEmail.trim()}
              className="bg-[var(--color-action-bg)] text-[var(--color-action-text)] border border-transparent px-5 py-2 rounded-[8px] text-[13px] transition-colors hover:bg-transparent hover:text-[var(--color-action-bg)] hover:border-[var(--color-action-bg)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[var(--color-action-bg)] disabled:hover:text-[var(--color-action-text)] disabled:hover:border-transparent"
            >
              {t("promoteSubmit")}
            </button>
          </div>
          {promoteError && (
            <div className="mt-2 text-[12px] text-[var(--color-danger)]">
              {promoteError}
            </div>
          )}
          {promoteSuccess && (
            <div className="mt-2 text-[12px] text-green-700">
              ✓ {promoteSuccess}
            </div>
          )}
        </div>

        {!loading && !error && barbers && barbers.length > 0 && (
          <div className="mb-6">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-2">
              {t("barbersHeader")}
            </div>
            <BarbersAdminList
              barbers={barbers.map((b) => ({
                userId: b.userId,
                name: b.name,
                email: b.email,
                avatar: b.avatar,
                isActive: b.isActive,
              }))}
              busyUserId={actionBusyUserId}
              onDelete={async (userId, name) => {
                const ok = await confirm({
                  title: t("deleteBarberConfirmTitle"),
                  message: t("deleteBarberConfirmMessage", { name }),
                  confirmLabel: t("deleteBarberConfirmLabel"),
                  danger: true,
                });
                if (!ok) return;
                handleAction("demote", userId);
              }}
            />
          </div>
        )}

        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-3">
            {t("anketasHeader")}
          </div>

          {loading && (
            <div className="text-center py-8 text-[var(--color-text-muted)] text-[13px]">
              {t("loading")}
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <div className="text-[var(--color-danger)] text-[13px] mb-2">{error}</div>
              <button
                onClick={fetchBarbers}
                className="text-[12px] underline"
              >
                Спробувати знову
              </button>
            </div>
          )}

          {!loading && !error && barbers && barbers.length === 0 && (
            <div className="text-center py-8 text-[var(--color-text-muted)] text-[13px]">
              {t("noBarbers")}
            </div>
          )}

          {!loading && !error && barbers && barbers.length > 0 && (
            <div className="flex flex-col gap-3">
              {barbers.map((b) => (
                <BarberRow
                  key={b.userId}
                  barber={b}
                  busy={actionBusyUserId === b.userId}
                  toggleBusy={toggleBusyUserId === b.userId}
                  onApprove={() => handleAction("approve", b.userId)}
                  onReject={() => handleAction("reject", b.userId)}
                  onToggleActive={() => handleToggleActive(b.userId, b.isActive)}
                />
              ))}
            </div>
          )}
        </div>
        </>
        )}

        {activeTab === "today" && <BookingsAdminList mode="today" />}
        {activeTab === "upcoming" && <BookingsAdminList mode="upcoming" />}
        {activeTab === "history" && <BookingsAdminList mode="history" />}
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
