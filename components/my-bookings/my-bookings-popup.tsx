"use client";

import BookingsPopupShared from "./bookings-popup-shared";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function MyBookingsPopup({ open, onClose }: Props) {
  return (
    <BookingsPopupShared
      open={open}
      onClose={onClose}
      title="Мої записи"
      endpoint="/api/booking/my"
      role="customer"
    />
  );
}
