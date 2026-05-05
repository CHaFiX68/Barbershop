"use client";

import BookingsPopupShared from "@/components/my-bookings/bookings-popup-shared";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function BarberBookingsPopup({ open, onClose }: Props) {
  return (
    <BookingsPopupShared
      open={open}
      onClose={onClose}
      title="Записи"
      endpoint="/api/booking/barber/me"
      role="barber"
    />
  );
}
