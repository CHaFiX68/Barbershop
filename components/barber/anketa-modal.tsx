"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import EditableBarberCard from "./editable-barber-card";

type AnketaData = {
  userName: string;
  initials: string;
  profile: {
    bio: string | null;
    landingImage: string | null;
    isActive: boolean;
  };
  services: { id: string; name: string; price: string }[];
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AnketaModal({ isOpen, onClose }: Props) {
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
    if (!isOpen) return;
    if (data) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/barber/me")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((json: AnketaData) => {
        if (cancelled) return;
        setData(json);
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
  }, [isOpen, data]);

  useEffect(() => {
    if (!isOpen) {
      setAnimateIn(false);
      return;
    }
    const id = setTimeout(() => setAnimateIn(true), 16);
    return () => clearTimeout(id);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const handleRetry = () => {
    setData(null);
    setError(null);
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
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Анкета"
        data-anketa-modal
        style={{
          width: "640px",
          maxWidth: "calc(100vw - 32px)",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#ffffff",
          border: "1px solid var(--color-line)",
          borderRadius: "16px",
          boxShadow: "0 24px 48px rgba(0,0,0,0.18)",
          pointerEvents: "auto",
          opacity: animateIn ? 1 : 0,
          transform: animateIn ? "translateY(0)" : "translateY(8px)",
          transition:
            "opacity 200ms cubic-bezier(0.22, 1, 0.36, 1), transform 200ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2
              className="font-display"
              style={{ fontWeight: 600, fontSize: "20px" }}
            >
              Анкета
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

          {loading && !data && (
            <div className="flex flex-col gap-3">
              <div className="bg-[#F5F0E6] rounded-[8px] animate-pulse h-[64px]" />
              <div className="bg-[#F5F0E6] rounded-[8px] animate-pulse h-[200px]" />
              <div className="bg-[#F5F0E6] rounded-[8px] animate-pulse h-[100px]" />
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
                className="px-4 py-2 bg-[var(--color-text)] text-[var(--color-bg)] rounded-[8px] text-[13px] hover:opacity-90 transition-opacity"
              >
                Спробувати ще раз
              </button>
            </div>
          )}

          {data && !error && (
            <EditableBarberCard
              userName={data.userName}
              initials={data.initials}
              initialBio={data.profile.bio ?? ""}
              initialLandingImage={data.profile.landingImage}
              initialIsActive={data.profile.isActive}
              initialServices={data.services}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
