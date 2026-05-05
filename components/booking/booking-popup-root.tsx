"use client";

import { useBooking } from "@/lib/booking-context";
import BookingPopup from "./booking-popup";

export default function BookingPopupRoot() {
  const { isOpen, initialBarberId, close } = useBooking();
  return (
    <BookingPopup
      open={isOpen}
      onClose={close}
      initialBarberId={initialBarberId}
    />
  );
}
