"use client";

import { useState } from "react";
import type { ChatDetail } from "@/lib/chat-client";
import ChatThread from "./chat-thread";

type Props = {
  chatId: string;
  isPopupOpen: boolean;
  onChatRefetch: () => void;
  onBackMobile?: () => void;
};

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

function formatBookingMeta(serviceName: string | null, startsAt: string | null) {
  if (!serviceName || !startsAt) return null;
  const d = new Date(startsAt);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${serviceName} · ${d.getDate()} ${MONTH_GENITIVE[d.getMonth()]} ${hh}:${mm}`;
}

export default function ChatConversationPane({
  chatId,
  isPopupOpen,
  onChatRefetch,
  onBackMobile,
}: Props) {
  const [chat, setChat] = useState<ChatDetail | null>(null);
  const isArchived = chat?.status === "archived";
  const bookingMeta =
    chat?.type === "booking"
      ? formatBookingMeta(chat.bookingServiceName, chat.bookingStartsAt)
      : null;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div
        className="flex items-center gap-3 px-4 py-3 shrink-0"
        style={{
          height: "64px",
          borderBottomWidth: "1px",
          borderBottomStyle: "solid",
          borderBottomColor: "#D5D0C8",
        }}
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
            {chat
              ? chat.type === "support"
                ? "Підтримка"
                : chat.otherParticipant.name
              : "Завантаження..."}
          </p>
          {bookingMeta && (
            <p
              className="truncate text-[var(--color-text-muted)]"
              style={{ fontSize: "11px" }}
            >
              {bookingMeta}
            </p>
          )}
        </div>
        {chat && (
          <span
            className="text-[10px] uppercase shrink-0"
            style={{
              letterSpacing: "0.15em",
              fontWeight: 500,
              color: isArchived ? "var(--color-text-muted)" : "#5A7A5A",
            }}
          >
            {isArchived ? "Архівовано" : "Активний"}
          </span>
        )}
      </div>

      <ChatThread
        chatId={chatId}
        active={isPopupOpen}
        onChatLoaded={setChat}
        onMessagesChanged={onChatRefetch}
      />
    </div>
  );
}
