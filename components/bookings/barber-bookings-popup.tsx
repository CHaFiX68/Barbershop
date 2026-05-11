"use client";

import { useTranslations } from "next-intl";
import BookingsPopupShared from "@/components/my-bookings/bookings-popup-shared";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function BarberBookingsPopup({ open, onClose }: Props) {
  const t = useTranslations("profile.menu");
  return (
    <BookingsPopupShared
      open={open}
      onClose={onClose}
      title={t("bookings")}
      endpoint="/api/booking/barber/me"
      role="barber"
    />
  );
}
