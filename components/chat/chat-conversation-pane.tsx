"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { deleteChat, type ChatDetail } from "@/lib/chat-client";
import { useConfirm } from "@/lib/confirm-context";
import ChatThread from "./chat-thread";

type Props = {
  chatId: string;
  isPopupOpen: boolean;
  onChatRefetch: () => void;
  onBackMobile?: () => void;
  onDeleted?: () => void;
  currentUserRole?: string | null;
  canDeleteOverride?: boolean;
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

export default function ChatConversationPane({
  chatId,
  isPopupOpen,
  onChatRefetch,
  onBackMobile,
  onDeleted,
  currentUserRole = null,
  canDeleteOverride,
}: Props) {
  const [chat, setChat] = useState<ChatDetail | null>(null);
  const [deleting, setDeleting] = useState(false);
  const confirm = useConfirm();
  const t = useTranslations("chat");
  const tCommon = useTranslations("common");

  function statusLabelAndColor(
    status: string | null
  ): { label: string; color: string } {
    switch (status as BookingStatus | null) {
      case "cancelled":
        return { label: t("bookingPinnedCancelled"), color: "var(--color-danger)" };
      case "completed":
        return { label: t("bookingPinnedCompleted"), color: "var(--color-text-muted)" };
      case "active":
      default:
        return { label: t("bookingPinnedActive"), color: "#2D7A3D" };
    }
  }

  const isBookingChat = chat?.type === "booking";
  const isSupportChat = chat?.type === "support";

  const canDeleteDefault =
    !!chat &&
    chat.type !== "support" &&
    (chat.type !== "booking" ||
      chat.bookingId === null ||
      chat.bookingStatus === "cancelled" ||
      chat.bookingStatus === "completed");
  const canDelete =
    canDeleteOverride !== undefined ? canDeleteOverride && !!chat : canDeleteDefault;

  const handleDelete = async () => {
    if (!chat || deleting) return;
    const ok = await confirm({
      title: t("deleteChatConfirmTitle"),
      message: t("deleteChatConfirmMessage"),
      confirmLabel: t("deleteChatConfirmLabel"),
      danger: true,
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteChat(chat.id);
      onDeleted?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : tCommon("error"));
      setDeleting(false);
    }
  };
  const counterpartName = chat
    ? isSupportChat
      ? currentUserRole === "barber"
        ? t("administrator")
        : t("supportLabel")
      : chat.otherParticipant.name
    : tCommon("loading");
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
              ? "border-b-[0.5px] border-[var(--color-line)]"
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
          {canDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              aria-label={t("deleteChatAria")}
              title={t("deleteChatAria")}
              className="flex items-center justify-center w-8 h-8 rounded-[8px] hover:bg-[rgba(160,48,48,0.08)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />
              </svg>
            </button>
          )}
        </div>

        {showPinnedBooking && (
          <div className="px-3 pt-3 pb-3">
            <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-[var(--color-bg)] rounded-[10px]">
              <div className="flex-1 min-w-0">
                <p
                  className="truncate text-[var(--color-text)]"
                  style={{ fontSize: "12px", fontWeight: 500 }}
                >
                  {chat?.bookingServiceName}
                  {chat?.bookingServicePrice
                    ? ` · ${chat.bookingServicePrice}`
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
