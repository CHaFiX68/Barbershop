"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useModalStack } from "@/lib/modal-stack-context";
import BookingCard, {
  type BookingItem,
} from "@/components/bookings/booking-card";

type Tab = "active" | "history";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  endpoint: string;
  role: "customer" | "barber";
};

export default function BookingsPopupShared({
  open,
  onClose,
  title,
  endpoint,
  role,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>("active");
  const [data, setData] = useState<{
    upcoming: BookingItem[];
    history: BookingItem[];
  }>({ upcoming: [], history: [] });
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { zIndex, isTop } = useModalStack(`bookings-${role}`, open, onClose);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error();
      const json = (await res.json()) as {
        upcoming: BookingItem[];
        history: BookingItem[];
      };
      setData({
        upcoming: json.upcoming ?? [],
        history: json.history ?? [],
      });
      setHasLoaded(true);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    if (!open) return;
    fetchBookings();
  }, [open, fetchBookings]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!mounted) return null;

  const list = tab === "active" ? data.upcoming : data.history;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key={`bookings-${role}-overlay`}
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
            aria-label={title}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="w-[calc(100vw-32px)] md:w-[600px] h-[calc(100vh-64px)] md:h-[700px] bg-[#FAF7F1] border border-[var(--color-line)] rounded-[16px] shadow-[0_24px_48px_rgba(0,0,0,0.18)] overflow-hidden flex flex-col"
          >
            <header className="shrink-0 px-6 md:px-8 pt-6 md:pt-8">
              <div className="flex items-start justify-between mb-4">
                <h2
                  className="font-display text-[var(--color-text)]"
                  style={{ fontWeight: 600, fontSize: "clamp(24px, 4vw, 32px)" }}
                >
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Закрити"
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-2xl leading-none w-8 h-8 flex items-center justify-center"
                >
                  ×
                </button>
              </div>

              <div className="flex gap-2 border-b-[0.5px] border-[#D5D0C8]">
                <TabButton
                  active={tab === "active"}
                  label="Активні"
                  count={data.upcoming.length}
                  onClick={() => setTab("active")}
                />
                <TabButton
                  active={tab === "history"}
                  label="Історія"
                  count={data.history.length}
                  onClick={() => setTab("history")}
                />
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-6 md:px-8 pt-4 pb-6 md:pb-8">
              {!hasLoaded && loading ? (
                <div className="text-center text-[var(--color-text-muted)] italic text-[13px] py-8">
                  Завантаження...
                </div>
              ) : list.length === 0 ? (
                <p className="italic text-[var(--color-text-muted)] text-[13px] text-center py-8">
                  {tab === "active"
                    ? "Активних записів немає."
                    : "Історія порожня."}
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {list.map((b) => (
                    <BookingCard
                      key={b.id}
                      booking={b}
                      role={role}
                      onChanged={fetchBookings}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function TabButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm transition-colors ${
        active
          ? "text-[var(--color-text)] border-b-2 border-[var(--color-text)] -mb-[1px] font-medium"
          : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
      }`}
    >
      {label} ({count})
    </button>
  );
}
