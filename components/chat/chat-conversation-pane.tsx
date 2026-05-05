"use client";

import { useState } from "react";
import type { ChatDetail } from "@/lib/chat-client";
import ChatThread from "./chat-thread";

type Props = {
  chatId: string;
  isPopupOpen: boolean;
  onChatRefetch: () => void;
  onBackMobile?: () => void;
  currentUserRole?: string | null;
};

const WEEKDAY_FULL = [
  "Неділя",
  "Понеділок",
  "Вівторок",
  "Середа",
  "Четвер",
  "П'ятниця",
  "Субота",
];

const MONTH_GENITIVE = [
  "січня",
  "лютого",
  "березня",
  "квітня",
  "травня",
  "червня",
  "липня",
  "серпня",
  "вересня",
  "жовтня",
  "листопада",
  "грудня",
];

function formatBookingDateTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${WEEKDAY_FULL[d.getDay()]}, ${d.getDate()} ${MONTH_GENITIVE[d.getMonth()]} · ${hh}:${mm}`;
}

type BookingStatus = "active" | "cancelled" | "completed";

function statusLabelAndColor(
  status: string | null
): { label: string; color: string } {
  switch (status as BookingStatus | null) {
    case "cancelled":
      return { label: "Скасований", color: "#A03030" };
    case "completed":
      return { label: "Завершений", color: "#7A736A" };
    case "active":
    default:
      return { label: "Активний", color: "#2D7A3D" };
  }
}

export default function ChatConversationPane({
  chatId,
  isPopupOpen,
  onChatRefetch,
  onBackMobile,
  currentUserRole = null,
}: Props) {
  const [chat, setChat] = useState<ChatDetail | null>(null);

  const isBookingChat = chat?.type === "booking";
  const isSupportChat = chat?.type === "support";
  const counterpartName = chat
    ? isSupportChat
      ? currentUserRole === "barber"
        ? "Адміністратор"
        : "Підтримка"
      : chat.otherParticipant.name
    : "Завантаження...";
  const phoneToShow = chat
    ? isSupportChat
      ? chat.supportPhone
      : chat.otherParticipant.phone
    : null;
  const showPinnedBooking =
    isBookingChat && !!chat?.bookingServiceName && !!chat?.bookingStartsAt;

  const statusInfo = statusLabelAndColor(chat?.bookingStatus ?? null);

  return (
    <div className="flex flex-col h-full min-h-0">
      <header className="shrink-0">
        <div
          className={`flex items-center gap-3 px-4 py-3 ${
            showPinnedBooking
              ? "border-b-[0.5px] border-[#D5D0C8]"
              : ""
          }`}
        >
          {onBackMobile && (
            <button
              type="button"
              onClick={onBackMobile}
              aria-label="Назад до списку"
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-[8px] hover:bg-black/5 transition-colors text-[var(--color-text)]"
            >
              ←
            </button>
          )}
          <div className="flex-1 min-w-0">
            <p
              className="truncate"
              style={{
                fontSize: "15px",
                fontWeight: 500,
                color: "var(--color-text)",
              }}
            >
              {counterpartName}
            </p>
            {phoneToShow && (
              <p
                className="truncate text-[var(--color-text-muted)]"
                style={{ fontSize: "11px" }}
              >
                {phoneToShow}
              </p>
            )}
          </div>
        </div>

        {showPinnedBooking && (
          <div className="px-3 pt-3 pb-3">
            <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-[#EDEAE5] rounded-[10px]">
              <div className="flex-1 min-w-0">
                <p
                  className="truncate text-[var(--color-text)]"
                  style={{ fontSize: "12px", fontWeight: 500 }}
                >
                  {chat?.bookingServiceName}
                  {chat?.bookingServicePrice
                    ? ` · ${chat.bookingServicePrice} грн`
                    : ""}
                </p>
                <p
                  className="truncate text-[var(--color-text-muted)] mt-0.5"
                  style={{ fontSize: "11px" }}
                >
                  {chat?.bookingStartsAt
                    ? formatBookingDateTime(chat.bookingStartsAt)
                    : ""}
                </p>
              </div>
              <span
                className="text-[10px] uppercase shrink-0"
                style={{
                  letterSpacing: "0.15em",
                  fontWeight: 500,
                  color: statusInfo.color,
                }}
              >
                {statusInfo.label}
              </span>
            </div>
          </div>
        )}
      </header>

      <ChatThread
        chatId={chatId}
        active={isPopupOpen}
        onChatLoaded={setChat}
        onMessagesChanged={onChatRefetch}
      />
    </div>
  );
}
