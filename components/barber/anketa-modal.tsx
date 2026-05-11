"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import type { WeekSchedule } from "@/lib/db/schema";
import { normalizeWeekSchedule } from "@/lib/schedule";
import { useModalStack } from "@/lib/modal-stack-context";
import AnketaEditor from "./anketa-editor";
import CloseButton from "@/components/ui/close-button";

type AnketaData = {
  userName: string;
  initials: string;
  profile: {
    phone: string | null;
    bio: string | null;
    landingImage: string | null;
    isActive: boolean;
    schedule: WeekSchedule;
  };
  services: {
    id: string;
    name: string;
    price: string;
    estimatedMinutes: number | null;
  }[];
  hasPendingChanges: boolean;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AnketaModal({ isOpen, onClose }: Props) {
  const t = useTranslations("anketa");
  const [data, setData] = useState<AnketaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    console.log(
      "[ANKETA-MODAL] fetching /api/barber/me, isOpen:",
      isOpen,
      "data exists:",
      !!data
    );
    fetch("/api/barber/me", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((json: AnketaData) => {
        if (cancelled) return;
        console.log("[ANKETA-MODAL] received data:", json);
        setData({
          ...json,
          profile: {
            ...json.profile,
            schedule: normalizeWeekSchedule(json.profile.schedule),
          },
        });
      })
      .catch(() => {
        if (cancelled) return;
        setError("Не вдалося завантажити анкету");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setAnimateIn(false);
      return;
    }
    const id = setTimeout(() => setAnimateIn(true), 16);
    return () => clearTimeout(id);
  }, [isOpen]);

  const { zIndex, isTop } = useModalStack("anketa-modal", isOpen, onClose);

  const handleRetry = () => {
    setData(null);
    setError(null);
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      style={{ zIndex }}
      onMouseDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (!isTop) return;
        onClose();
      }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("title")}
        data-anketa-modal
        className="w-full max-w-[calc(100vw-32px)] md:w-280 md:max-w-[calc(100vw-32px)] max-h-[90vh] bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[16px] shadow-[0_24px_48px_rgba(0,0,0,0.18)] flex flex-col overflow-hidden pr-2"
        style={{
          opacity: animateIn ? 1 : 0,
          transform: animateIn ? "translateY(0)" : "translateY(8px)",
          transition:
            "opacity 200ms cubic-bezier(0.22, 1, 0.36, 1), transform 200ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div
          className="custom-scrollbar"
          style={{
            flex: "1 1 auto",
            overflowY: "auto",
            minHeight: 0,
          }}
        >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <h2
                className="font-display"
                style={{ fontWeight: 600, fontSize: "20px" }}
              >
                {t("title")}
              </h2>
              {data?.hasPendingChanges && (
                <span
                  className="ml-3 inline-flex items-center px-2 py-0.5 text-[10px] uppercase rounded-[4px]"
                  style={{
                    background: "#F5E6C8",
                    color: "#8A6D2A",
                    letterSpacing: "0.15em",
                  }}
                >
                  На розгляді
                </span>
              )}
            </div>
            <CloseButton onClick={onClose} />
          </div>

          {loading && !data && (
            <div className="flex flex-col gap-3">
              <div className="bg-[var(--color-surface-2)] rounded-[8px] animate-pulse h-[64px]" />
              <div className="bg-[var(--color-surface-2)] rounded-[8px] animate-pulse h-[200px]" />
              <div className="bg-[var(--color-surface-2)] rounded-[8px] animate-pulse h-[100px]" />
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-8">
              <p className="text-[13px] text-[var(--color-text-muted)] mb-4">
                {error}
              </p>
              <button
                type="button"
                onClick={handleRetry}
                className="px-4 py-2 bg-[var(--color-action-bg)] text-[var(--color-action-text)] rounded-[8px] text-[13px] hover:opacity-90 transition-opacity"
              >
                Спробувати ще раз
              </button>
            </div>
          )}

          {data && !error && (
            <AnketaEditor
              userName={data.userName}
              initials={data.initials}
              initialPhone={data.profile.phone ?? ""}
              initialBio={data.profile.bio ?? ""}
              initialLandingImage={data.profile.landingImage}
              initialIsActive={data.profile.isActive}
              initialServices={data.services}
              initialSchedule={data.profile.schedule}
              initialHasPending={data.hasPendingChanges}
              onPendingChange={(v) =>
                setData((prev) =>
                  prev ? { ...prev, hasPendingChanges: v } : prev
                )
              }
            />
          )}
        </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
