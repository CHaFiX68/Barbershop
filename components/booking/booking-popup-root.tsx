"use client";

import { useBooking } from "@/lib/booking-context";
import { useIdlePrefetch } from "@/lib/use-idle-prefetch";
import BookingPopup from "./booking-popup";

export default function BookingPopupRoot() {
  const { isOpen, initialBarberId, close } = useBooking();
  useIdlePrefetch([() => import("./booking-flow")]);
  return (
    <BookingPopup
      open={isOpen}
      onClose={close}
      initialBarberId={initialBarberId}
    />
  );
}
