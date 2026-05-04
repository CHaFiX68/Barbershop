"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { openSupport, type ChatListItem } from "@/lib/chat-client";

type Props = {
  chats: ChatListItem[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onChatsRefetch: () => void;
  loading: boolean;
};

const MONTH_SHORT = [
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
];

function formatLastMessageTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();
  if (isYesterday) return "Вчора";
  return `${String(d.getDate()).padStart(2, "0")}.${MONTH_SHORT[d.getMonth()]}`;
}

function getInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed[0].toUpperCase();
}

export default function ChatListPane({
  chats,
  selectedChatId,
  onSelectChat,
  onChatsRefetch,
  loading,
}: Props) {
  const [openingSupport, setOpeningSupport] = useState(false);
  const [supportError, setSupportError] = useState<string | null>(null);

  const supportChat = chats.find((c) => c.type === "support") ?? null;
  const otherChats = chats.filter((c) => c.type !== "support");

  const handleOpenSupport = async () => {
    if (openingSupport) return;
    setOpeningSupport(true);
    setSupportError(null);
    try {
      const id = await openSupport();
      onChatsRefetch();
      onSelectChat(id);
    } catch (err) {
      setSupportError(
        err instanceof Error ? err.message : "Не вдалось відкрити підтримку"
      );
    } finally {
      setOpeningSupport(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div
        className="px-4 py-3"
        style={{
          fontSize: "10px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          fontWeight: 500,
          color: "var(--color-text)",
          borderBottomWidth: "1px",
          borderBottomStyle: "solid",
          borderBottomColor: "#D5D0C8",
        }}
      >
        Чати
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Support row — pinned */}
        {supportChat ? (
          <ChatRow
            chat={supportChat}
            isSelected={selectedChatId === supportChat.id}
            onSelect={() => onSelectChat(supportChat.id)}
          />
        ) : (
          <button
            type="button"
            onClick={handleOpenSupport}
            disabled={openingSupport}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#F0EDE8] transition-colors disabled:opacity-50"
            style={{
              borderBottomWidth: "1px",
              borderBottomStyle: "solid",
              borderBottomColor: "#D5D0C8",
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "#F5F0E6" }}
            >
              <HelpCircle size={18} className="text-[#C9B89A]" />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="truncate"
                style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text)" }}
              >
                Написати в підтримку
              </p>
              <p
                className="truncate italic"
                style={{ fontSize: "12px", color: "var(--color-text-muted)" }}
              >
                {openingSupport ? "Відкриваємо..." : "Адміністратор відповість"}
              </p>
            </div>
          </button>
        )}

        {supportError && (
          <p
            className="px-4 py-2 text-[#A03030] italic"
            style={{ fontSize: "11px" }}
          >
            {supportError}
          </p>
        )}

        {/* Booking + direct_admin chats */}
        {otherChats.map((c) => (
          <ChatRow
            key={c.id}
            chat={c}
            isSelected={selectedChatId === c.id}
            onSelect={() => onSelectChat(c.id)}
          />
        ))}

        {!loading && otherChats.length === 0 && supportChat == null && (
          <div className="px-4 py-6 text-center">
            <p
              className="italic text-[var(--color-text-muted)]"
              style={{ fontSize: "12px", lineHeight: 1.5 }}
            >
              Поки немає чатів. Заброньте візит щоб написати барберу або
              зверніться у підтримку.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatRow({
  chat,
  isSelected,
  onSelect,
}: {
  chat: ChatListItem;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const isArchived = chat.status === "archived";
  const isSupport = chat.type === "support";
  const name = isSupport ? "Підтримка" : chat.otherParticipant.name;
  const initial = getInitial(name);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
        isSelected ? "bg-[#EDEAE5]" : "hover:bg-[#F0EDE8]"
      } ${isArchived ? "opacity-60" : ""}`}
      style={{
        borderBottomWidth: "1px",
        borderBottomStyle: "solid",
        borderBottomColor: "#D5D0C8",
      }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-display"
        style={{
          background: isSupport ? "#F5F0E6" : "#C9B89A",
          color: isSupport ? "#C9B89A" : "white",
          fontSize: "16px",
          fontWeight: 500,
        }}
      >
        {isSupport ? <HelpCircle size={18} /> : initial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p
            className="flex-1 min-w-0 truncate"
            style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text)" }}
          >
            {name}
          </p>
          {chat.lastMessageAt && (
            <span
              className="shrink-0 text-[var(--color-text-muted)]"
              style={{ fontSize: "10px" }}
            >
              {formatLastMessageTime(chat.lastMessageAt)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <p
            className="flex-1 min-w-0 truncate italic"
            style={{ fontSize: "12px", color: "var(--color-text-muted)" }}
          >
            {chat.lastMessagePreview ?? "—"}
          </p>
          {chat.unreadCount > 0 && (
            <span
              className="shrink-0 inline-flex items-center justify-center rounded-full"
              style={{
                background: "#C9B89A",
                color: "white",
                minWidth: "18px",
                height: "18px",
                fontSize: "10px",
                fontWeight: 500,
                padding: "0 5px",
              }}
            >
              {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
            </span>
          )}
        </div>
        {isArchived && (
          <p
            className="italic"
            style={{ fontSize: "10px", color: "var(--color-text-muted)" }}
          >
            Архівовано
          </p>
        )}
      </div>
    </button>
  );
}
