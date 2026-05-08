"use client";

import { useEffect, useState } from "react";
import BookingCard, {
  type BookingItem,
} from "@/components/bookings/booking-card";

type AdminBookingItem = BookingItem & {
  barberName: string;
  barberEmail: string;
};

export default function BookingsAdminList() {
  const [bookings, setBookings] = useState<AdminBookingItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/bookings/all", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const json = (await r.json()) as { bookings: AdminBookingItem[] };
        if (!cancelled) setBookings(json.bookings);
      })
      .catch(() => {
        if (!cancelled) setError("Не вдалося завантажити список бронювань");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="text-center py-8 text-[#A03030] text-[13px]">
        {error}
      </div>
    );
  }

  if (bookings === null) {
    return (
      <div className="text-center py-8 text-[var(--color-text-muted)] text-[13px]">
        Завантаження...
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--color-text-muted)] text-[13px]">
        Бронювань немає
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {bookings.map((b) => (
        <BookingCard
          key={b.id}
          booking={b}
          role="admin"
          showBarberInfo
        />
      ))}
    </div>
  );
}
