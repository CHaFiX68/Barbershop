"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import type { WeekSchedule } from "@/lib/db/schema";
import { normalizeWeekSchedule } from "@/lib/schedule";
import BarberPreview from "./barber-preview";

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
  isExpanded: boolean;
  onToggle: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDemote: () => void;
};

function BarberRow({
  barber,
  busy,
  isExpanded,
  onToggle,
  onApprove,
  onReject,
  onDemote,
}: BarberRowProps) {
  return (
    <div
      className="border border-[var(--color-line)] rounded-[12px] overflow-hidden"
      style={{ background: "white" }}
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
              className="w-12 h-12 rounded-[8px] bg-[#F5F0E6] flex items-center justify-center font-display italic"
              style={{ color: "#C9B89A", fontSize: "20px" }}
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
                На розгляді
              </span>
            )}
            {!barber.isActive && (
              <span
                className="inline-flex items-center px-2 py-0.5 text-[10px] uppercase rounded-[4px]"
                style={{
                  background: "#EAEAEA",
                  color: "#7A736A",
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

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onToggle}
            aria-label={isExpanded ? "Згорнути анкету" : "Розгорнути анкету"}
            aria-expanded={isExpanded}
            className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-[#F5F0E6] transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className={`transition-transform duration-150 ${
                isExpanded ? "rotate-180" : ""
              }`}
            >
              <path
                d="M3 5.5l4 4 4-4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={onDemote}
            disabled={busy}
            className="px-3 py-1.5 rounded-[8px] text-[12px] text-[#A03030] hover:bg-[rgba(160,48,48,0.06)] transition-colors disabled:opacity-50"
          >
            Видалити
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-[var(--color-line)] bg-[#F9F6F1] p-4">
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
                  <span className="italic text-[11px] text-[#A03030]">
                    Барбер не вказав телефон
                  </span>
                )}
                <button
                  type="button"
                  onClick={onReject}
                  disabled={busy}
                  className="px-4 py-2 rounded-[8px] text-[12px] border border-[var(--color-line)] bg-white hover:bg-[#F5F0E6] transition-colors disabled:opacity-50"
                >
                  Відхилити
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
                  Затвердити
                </button>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

export default function ManagementModal({ isOpen, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [barbers, setBarbers] = useState<Barber[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promoteEmail, setPromoteEmail] = useState("");
  const [promoteBusy, setPromoteBusy] = useState(false);
  const [promoteError, setPromoteError] = useState<string | null>(null);
  const [promoteSuccess, setPromoteSuccess] = useState<string | null>(null);
  const [actionBusyUserId, setActionBusyUserId] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

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
      setExpandedUserId(null);
      return;
    }
    fetchBarbers();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => setAnimateIn(true), 16);
      return () => clearTimeout(t);
    } else {
      setAnimateIn(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

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

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        zIndex: 60,
        pointerEvents: "none",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Менеджмент"
        data-management-modal
        className="w-full max-w-[calc(100vw-32px)] md:w-[960px] md:max-w-[calc(100vw-32px)] max-h-[90vh] overflow-y-auto bg-white border border-[var(--color-line)] rounded-[16px] shadow-[0_24px_48px_rgba(0,0,0,0.18)] p-4 md:p-6"
        style={{
          pointerEvents: "auto",
          opacity: animateIn ? 1 : 0,
          transform: animateIn ? "translateY(0)" : "translateY(8px)",
          transition:
            "opacity 200ms cubic-bezier(0.22, 1, 0.36, 1), transform 200ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2
            className="font-display"
            style={{ fontSize: "20px", fontWeight: 600 }}
          >
            Менеджмент
          </h2>
          <button
            type="button"
            aria-label="Закрити"
            onClick={onClose}
            className="relative w-8 h-8 rounded-[8px] hover:bg-black/5 transition-colors"
          >
            <span className="absolute left-1/2 top-1/2 w-[14px] h-px bg-[var(--color-text)] -translate-x-1/2 -translate-y-1/2 rotate-45" />
            <span className="absolute left-1/2 top-1/2 w-[14px] h-px bg-[var(--color-text)] -translate-x-1/2 -translate-y-1/2 -rotate-45" />
          </button>
        </div>

        <div
          style={{
            background: "#F5F0E6",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "20px",
          }}
        >
          <div
            className="text-[13px] font-medium mb-3"
            style={{ color: "var(--color-text)" }}
          >
            Додати барбера за email
          </div>
          <div className="flex gap-2 items-stretch">
            <input
              type="email"
              value={promoteEmail}
              onChange={(e) => setPromoteEmail(e.target.value)}
              placeholder="email@example.com"
              disabled={promoteBusy}
              className="flex-1 bg-white border border-[var(--color-line)] rounded-[8px] px-3 py-2 outline-none focus:border-[var(--color-text)] text-[13px] disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handlePromote}
              disabled={promoteBusy || !promoteEmail.trim()}
              className="bg-black text-white border border-transparent px-5 py-2 rounded-[8px] text-[13px] transition-colors hover:bg-transparent hover:text-black hover:border-black disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black disabled:hover:text-white disabled:hover:border-transparent"
            >
              {promoteBusy ? "Додаю..." : "Додати"}
            </button>
          </div>
          {promoteError && (
            <div className="mt-2 text-[12px] text-[#A03030]">
              {promoteError}
            </div>
          )}
          {promoteSuccess && (
            <div className="mt-2 text-[12px] text-green-700">
              ✓ {promoteSuccess}
            </div>
          )}
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-3">
            Барбери
          </div>

          {loading && (
            <div className="text-center py-8 text-[var(--color-text-muted)] text-[13px]">
              Завантаження...
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <div className="text-[#A03030] text-[13px] mb-2">{error}</div>
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
              Поки що немає барберів. Додайте першого через форму вище.
            </div>
          )}

          {!loading && !error && barbers && barbers.length > 0 && (
            <div className="flex flex-col gap-3">
              {barbers.map((b) => (
                <BarberRow
                  key={b.userId}
                  barber={b}
                  busy={actionBusyUserId === b.userId}
                  isExpanded={expandedUserId === b.userId}
                  onToggle={() =>
                    setExpandedUserId((prev) =>
                      prev === b.userId ? null : b.userId
                    )
                  }
                  onApprove={() => handleAction("approve", b.userId)}
                  onReject={() => handleAction("reject", b.userId)}
                  onDemote={() => {
                    if (
                      confirm(
                        `Видалити ${b.name} з барберів? Анкета лишиться в БД, але стане неактивною.`
                      )
                    ) {
                      handleAction("demote", b.userId);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
