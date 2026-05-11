"use client";

import { useTranslations } from "next-intl";
import BookingsPopupShared from "./bookings-popup-shared";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function MyBookingsPopup({ open, onClose }: Props) {
  const t = useTranslations("myBookings");
  return (
    <BookingsPopupShared
      open={open}
      onClose={onClose}
      title={t("title")}
      endpoint="/api/booking/my"
      role="customer"
    />
  );
}
