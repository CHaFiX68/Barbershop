"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useModalStack } from "@/lib/modal-stack-context";
import BookingCard from "@/components/bookings/booking-card";

type Status = "active" | "cancelled" | "completed";

type Booking = {
  id: string;
  barberName: string;
  serviceName: string;
  servicePrice: string;
  startsAt: string;
  endsAt: string;
  status: Status;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function MyBookingsPopup({ open, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [bookings, setBookings] = useState<{
    upcoming: Booking[];
    past: Booking[];
  }>({ upcoming: [], past: [] });
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { zIndex, isTop } = useModalStack("my-bookings", open, onClose);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/booking/my");
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { bookings: Booking[] };
      const now = Date.now();
      const upcoming: Booking[] = [];
      const past: Booking[] = [];
      for (const b of data.bookings) {
        if (b.status === "active" && new Date(b.startsAt).getTime() >= now) {
          upcoming.push(b);
        } else {
          past.push(b);
        }
      }
      setBookings({ upcoming, past });
      setHasLoaded(true);
    } catch {
      // Silent fail; user sees empty state
    } finally {
      setLoading(false);
    }
  }, []);

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

  const isEmpty =
    bookings.upcoming.length === 0 && bookings.past.length === 0;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="my-bookings-overlay"
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
            aria-label="Мої записи"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-[calc(100vw-32px)] md:max-w-[640px] max-h-[calc(100vh-64px)] overflow-y-auto bg-[#FAF7F1] border border-[var(--color-line)] rounded-[16px] shadow-[0_24px_48px_rgba(0,0,0,0.18)] p-6 md:p-8"
          >
            <div className="flex items-start justify-between mb-6">
              <h2
                className="font-display text-[var(--color-text)]"
                style={{ fontWeight: 600, fontSize: "clamp(24px, 4vw, 32px)" }}
              >
                Мої записи
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

            {!hasLoaded && loading ? (
              <div className="text-center text-[var(--color-text-muted)] italic text-[13px] py-8">
                Завантаження...
              </div>
            ) : isEmpty ? (
              <div className="text-center py-12 italic text-[var(--color-text-muted)] text-[14px]">
                Поки записів немає.
              </div>
            ) : (
              <div className="flex flex-col gap-10">
                <section className="flex flex-col gap-3">
                  <h3
                    className="text-[var(--color-text)]"
                    style={{
                      fontSize: "10px",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      fontWeight: 500,
                    }}
                  >
                    Майбутні
                  </h3>
                  {bookings.upcoming.length === 0 ? (
                    <p className="italic text-[var(--color-text-muted)] text-[13px]">
                      Майбутніх записів немає.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {bookings.upcoming.map((b) => (
                        <BookingCard
                          key={b.id}
                          id={b.id}
                          barberName={b.barberName}
                          serviceName={b.serviceName}
                          servicePrice={b.servicePrice}
                          startsAt={b.startsAt}
                          status={b.status}
                          isUpcoming
                          onChanged={fetchBookings}
                        />
                      ))}
                    </div>
                  )}
                </section>

                {bookings.past.length > 0 && (
                  <section className="flex flex-col gap-3">
                    <h3
                      className="text-[var(--color-text)]"
                      style={{
                        fontSize: "10px",
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        fontWeight: 500,
                      }}
                    >
                      Минулі
                    </h3>
                    <div className="flex flex-col gap-3">
                      {bookings.past.map((b) => (
                        <BookingCard
                          key={b.id}
                          id={b.id}
                          barberName={b.barberName}
                          serviceName={b.serviceName}
                          servicePrice={b.servicePrice}
                          startsAt={b.startsAt}
                          status={b.status}
                          isUpcoming={false}
                          onChanged={fetchBookings}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
