"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  fetchAdminBarbers,
  openDirectChat,
  type AdminBarberOption,
  type AdminChatsList,
  type AdminDirectChat,
  type AdminSupportChat,
} from "@/lib/admin-chat-client";
import { useModalStack } from "@/lib/modal-stack-context";
import ChatThread from "./chat-thread";
import CloseButton from "@/components/ui/close-button";

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

function formatLastTime(iso: string | null): string {
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
  return `${String(d.getDate()).padStart(2, "0")}.${MONTH_SHORT[d.getMonth()]}`;
}

function getInitial(name: string): string {
  const t = name.trim();
  return t ? t[0].toUpperCase() : "?";
}

type SelectedView =
  | { kind: "support"; chat: AdminSupportChat }
  | { kind: "direct"; chat: AdminDirectChat }
  | null;

type Props = {
  chats: AdminChatsList;
  loading: boolean;
  selectedChatId: string | null;
  onSelectChat: (chatId: string | null) => void;
  onChatsRefetch: () => void;
  onClose: () => void;
};

export default function AdminChatPopup({
  chats,
  loading,
  selectedChatId,
  onSelectChat,
  onChatsRefetch,
  onClose,
}: Props) {
  const [tab, setTab] = useState<"support" | "direct">("support");
  const [isMobile, setIsMobile] = useState(false);
  const [barbers, setBarbers] = useState<AdminBarberOption[]>([]);
  const [openingDirectFor, setOpeningDirectFor] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const { zIndex } = useModalStack("admin-chat-popup", true, onClose, {
    respectEsc: false,
  });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Load barbers once on mount
  useEffect(() => {
    let cancelled = false;
    fetchAdminBarbers()
      .then((b) => {
        if (!cancelled) setBarbers(b);
      })
      .catch(() => {
        // Non-fatal — barbers tab will show empty "new" section
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Split support chats by counterpart role: barbers' support tickets show
  // up in the "Барбери" tab next to direct_admin chats, regular customers
  // stay in "Підтримка". The role flag comes from the API (joined on user)
  // so a counterpart promoted to barber after the chat existed will move
  // tabs on the next refetch — no chat.type mutation needed.
  const customerSupportChats = useMemo(
    () => chats.support.filter((c) => c.otherParticipant.role !== "barber"),
    [chats.support]
  );
  const barberSupportChats = useMemo(
    () => chats.support.filter((c) => c.otherParticipant.role === "barber"),
    [chats.support]
  );

  const supportUnread = useMemo(
    () => customerSupportChats.reduce((s, c) => s + c.unreadByAdmin, 0),
    [customerSupportChats]
  );
  const directUnread = useMemo(
    () =>
      chats.direct.reduce((s, c) => s + c.unreadByAdmin, 0) +
      barberSupportChats.reduce((s, c) => s + c.unreadByAdmin, 0),
    [chats.direct, barberSupportChats]
  );

  const selected = useMemo<SelectedView>(() => {
    if (!selectedChatId) return null;
    const s = chats.support.find((c) => c.id === selectedChatId);
    if (s) return { kind: "support", chat: s };
    const d = chats.direct.find((c) => c.id === selectedChatId);
    if (d) return { kind: "direct", chat: d };
    return null;
  }, [selectedChatId, chats]);

  // Snap tab to the selected chat's bucket. A support-typed chat with a
  // barber counterpart belongs to "Барбери", so check role too.
  useEffect(() => {
    if (!selected) return;
    if (selected.kind === "direct") {
      if (tab !== "direct") setTab("direct");
      return;
    }
    const isBarberCounterpart =
      selected.chat.otherParticipant.role === "barber";
    const wantedTab = isBarberCounterpart ? "direct" : "support";
    if (tab !== wantedTab) setTab(wantedTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.chat.id]);

  const directBarberIds = useMemo(
    () =>
      new Set([
        ...chats.direct.map((c) => c.barber.userId),
        ...barberSupportChats.map((c) => c.otherParticipant.userId),
      ]),
    [chats.direct, barberSupportChats]
  );

  const newBarbers = useMemo(
    () => barbers.filter((b) => !directBarberIds.has(b.userId)),
    [barbers, directBarberIds]
  );

  const handleOpenDirectByBarber = useCallback(
    async (barberUserId: string) => {
      if (openingDirectFor) return;
      setOpeningDirectFor(barberUserId);
      setActionError(null);
      try {
        const chatId = await openDirectChat(barberUserId);
        onChatsRefetch();
        onSelectChat(chatId);
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : "Не вдалось відкрити чат"
        );
      } finally {
        setOpeningDirectFor(null);
      }
    },
    [openingDirectFor, onChatsRefetch, onSelectChat]
  );

  const showList = !isMobile || selectedChatId == null;
  const showConversation = !isMobile || selectedChatId != null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ duration: 0.2 }}
      className="fixed bg-[#FAF7F1] rounded-[16px] shadow-2xl overflow-hidden flex flex-col"
      style={{
        zIndex,
        bottom: "24px",
        right: "24px",
        width: "min(720px, calc(100vw - 48px))",
        height: "min(560px, calc(100vh - 100px))",
      }}
    >
      <div
        className="flex items-center justify-between px-4 shrink-0"
        style={{
          height: "56px",
          borderBottomWidth: "1px",
          borderBottomStyle: "solid",
          borderBottomColor: "#D5D0C8",
        }}
      >
        <h3
          className="font-display"
          style={{ fontSize: "18px", fontWeight: 500, color: "var(--color-text)" }}
        >
          Чат
        </h3>
        <CloseButton onClick={onClose} ariaLabel="Закрити чат" />
      </div>

      <div
        className="flex-1 min-h-0"
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "280px 1px 1fr",
        }}
      >
        {showList && (
          <div className="flex flex-col h-full min-h-0">
            <div
              className="flex items-center gap-1 p-2"
              style={{
                borderBottomWidth: "1px",
                borderBottomStyle: "solid",
                borderBottomColor: "#D5D0C8",
              }}
            >
              <TabButton
                active={tab === "support"}
                label="Підтримка"
                count={customerSupportChats.length}
                hasUnread={supportUnread > 0}
                onClick={() => setTab("support")}
              />
              <TabButton
                active={tab === "direct"}
                label="Барбери"
                count={chats.direct.length + barberSupportChats.length}
                hasUnread={directUnread > 0}
                onClick={() => setTab("direct")}
              />
            </div>

            {actionError && (
              <p
                className="px-4 py-2 italic text-[#A03030]"
                style={{ fontSize: "11px" }}
              >
                {actionError}
              </p>
            )}

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {tab === "support" && (
                <SupportList
                  chats={customerSupportChats}
                  loading={loading}
                  selectedChatId={selectedChatId}
                  onSelectChat={onSelectChat}
                />
              )}
              {tab === "direct" && (
                <DirectList
                  existingChats={chats.direct}
                  barberSupportChats={barberSupportChats}
                  newBarbers={newBarbers}
                  loading={loading}
                  selectedChatId={selectedChatId}
                  openingDirectFor={openingDirectFor}
                  onSelectChat={onSelectChat}
                  onOpenWithBarber={handleOpenDirectByBarber}
                />
              )}
            </div>
          </div>
        )}

        {!isMobile && <div style={{ background: "#D5D0C8" }} />}

        {showConversation && (
          <div className="flex flex-col h-full min-h-0">
            {selected ? (
              <SelectedThread
                key={selected.chat.id}
                selected={selected}
                onChatRefetch={onChatsRefetch}
                onBackMobile={
                  isMobile ? () => onSelectChat(null) : undefined
                }
              />
            ) : (
              <div className="flex items-center justify-center h-full px-6">
                <p
                  className="italic text-[var(--color-text-muted)] text-center"
                  style={{ fontSize: "13px", lineHeight: 1.5 }}
                >
                  {tab === "support"
                    ? "Оберіть тікет зліва"
                    : "Оберіть барбера або відкрийте новий чат"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TabButton({
  active,
  label,
  count,
  hasUnread,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  hasUnread: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 px-3 py-1.5 rounded-[8px] text-[12px] transition-colors flex items-center justify-center gap-1.5 ${
        active
          ? "bg-[var(--color-text)] text-white"
          : "text-[var(--color-text)] hover:bg-[#EDEAE5]"
      }`}
    >
      <span>
        {label} ({count})
      </span>
      {hasUnread && (
        <span
          className="inline-block rounded-full"
          style={{
            width: "6px",
            height: "6px",
            background: active ? "white" : "#A03030",
          }}
        />
      )}
    </button>
  );
}

function SupportList({
  chats,
  loading,
  selectedChatId,
  onSelectChat,
}: {
  chats: AdminSupportChat[];
  loading: boolean;
  selectedChatId: string | null;
  onSelectChat: (id: string) => void;
}) {
  if (!loading && chats.length === 0) {
    return (
      <p
        className="italic text-center px-4 py-8 text-[var(--color-text-muted)]"
        style={{ fontSize: "12px" }}
      >
        Немає активних тікетів
      </p>
    );
  }
  return (
    <>
      {chats.map((c) => (
        <SupportRow
          key={c.id}
          chat={c}
          isSelected={selectedChatId === c.id}
          onSelect={() => onSelectChat(c.id)}
        />
      ))}
    </>
  );
}

function DirectList({
  existingChats,
  barberSupportChats,
  newBarbers,
  loading,
  selectedChatId,
  openingDirectFor,
  onSelectChat,
  onOpenWithBarber,
}: {
  existingChats: AdminDirectChat[];
  barberSupportChats: AdminSupportChat[];
  newBarbers: AdminBarberOption[];
  loading: boolean;
  selectedChatId: string | null;
  openingDirectFor: string | null;
  onSelectChat: (id: string) => void;
  onOpenWithBarber: (barberUserId: string) => void;
}) {
  const hasExisting =
    existingChats.length > 0 || barberSupportChats.length > 0;
  if (!loading && !hasExisting && newBarbers.length === 0) {
    return (
      <p
        className="italic text-center px-4 py-8 text-[var(--color-text-muted)]"
        style={{ fontSize: "12px" }}
      >
        Барберів поки немає
      </p>
    );
  }
  return (
    <>
      {existingChats.map((c) => (
        <DirectExistingRow
          key={c.id}
          chat={c}
          isSelected={selectedChatId === c.id}
          onSelect={() => onSelectChat(c.id)}
        />
      ))}
      {barberSupportChats.map((c) => (
        <SupportRow
          key={c.id}
          chat={c}
          isSelected={selectedChatId === c.id}
          onSelect={() => onSelectChat(c.id)}
        />
      ))}
      {hasExisting && newBarbers.length > 0 && (
        <SectionDivider label="Новий чат" />
      )}
      {newBarbers.map((b) => (
        <DirectNewRow
          key={b.userId}
          barber={b}
          opening={openingDirectFor === b.userId}
          onOpen={() => onOpenWithBarber(b.userId)}
        />
      ))}
    </>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div
      className="px-4 py-2 text-[var(--color-text-muted)]"
      style={{
        fontSize: "10px",
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        fontWeight: 500,
        background: "#F0EDE8",
        borderTopWidth: "1px",
        borderTopStyle: "solid",
        borderTopColor: "#D5D0C8",
        borderBottomWidth: "1px",
        borderBottomStyle: "solid",
        borderBottomColor: "#D5D0C8",
      }}
    >
      {label}
    </div>
  );
}

function Avatar({
  name,
  image,
  background = "#C9B89A",
}: {
  name: string;
  image: string | null;
  background?: string;
}) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt=""
        className="w-10 h-10 rounded-full object-cover shrink-0"
      />
    );
  }
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-display"
      style={{
        background,
        color: "white",
        fontSize: "16px",
        fontWeight: 500,
      }}
    >
      {getInitial(name)}
    </div>
  );
}

function SupportRow({
  chat,
  isSelected,
  onSelect,
}: {
  chat: AdminSupportChat;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
        isSelected ? "bg-[#EDEAE5]" : "hover:bg-[#F0EDE8]"
      }`}
      style={{
        borderBottomWidth: "1px",
        borderBottomStyle: "solid",
        borderBottomColor: "#D5D0C8",
      }}
    >
      <Avatar
        name={chat.otherParticipant.name}
        image={chat.otherParticipant.image}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p
            className="flex-1 min-w-0 truncate"
            style={{
              fontSize: "14px",
              fontWeight: chat.unreadByAdmin > 0 ? 600 : 500,
              color: "var(--color-text)",
            }}
          >
            {chat.otherParticipant.name}
          </p>
          {chat.lastMessageAt && (
            <span
              className="shrink-0 text-[var(--color-text-muted)]"
              style={{ fontSize: "10px" }}
            >
              {formatLastTime(chat.lastMessageAt)}
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
          {chat.unreadByAdmin > 0 && (
            <span
              className="shrink-0 inline-flex items-center justify-center rounded-full"
              style={{
                background: "#A03030",
                color: "white",
                minWidth: "18px",
                height: "18px",
                fontSize: "10px",
                fontWeight: 500,
                padding: "0 5px",
              }}
            >
              {chat.unreadByAdmin > 99 ? "99+" : chat.unreadByAdmin}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function DirectExistingRow({
  chat,
  isSelected,
  onSelect,
}: {
  chat: AdminDirectChat;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
        isSelected ? "bg-[#EDEAE5]" : "hover:bg-[#F0EDE8]"
      }`}
      style={{
        borderBottomWidth: "1px",
        borderBottomStyle: "solid",
        borderBottomColor: "#D5D0C8",
      }}
    >
      <Avatar name={chat.barber.name} image={chat.barber.image} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p
            className="flex-1 min-w-0 truncate"
            style={{
              fontSize: "14px",
              fontWeight: chat.unreadByAdmin > 0 ? 600 : 500,
              color: "var(--color-text)",
            }}
          >
            {chat.barber.name}
          </p>
          {chat.lastMessageAt && (
            <span
              className="shrink-0 text-[var(--color-text-muted)]"
              style={{ fontSize: "10px" }}
            >
              {formatLastTime(chat.lastMessageAt)}
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
          {chat.unreadByAdmin > 0 && (
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
              {chat.unreadByAdmin > 99 ? "99+" : chat.unreadByAdmin}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function DirectNewRow({
  barber,
  opening,
  onOpen,
}: {
  barber: AdminBarberOption;
  opening: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={opening}
      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#F0EDE8] transition-colors disabled:opacity-50"
      style={{
        borderBottomWidth: "1px",
        borderBottomStyle: "solid",
        borderBottomColor: "#D5D0C8",
      }}
    >
      <Avatar
        name={barber.name}
        image={barber.image}
        background={barber.isActive ? "#C9B89A" : "#A8A095"}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p
            className="flex-1 min-w-0 truncate"
            style={{
              fontSize: "14px",
              fontWeight: 500,
              color: "var(--color-text)",
            }}
          >
            {barber.name}
          </p>
          {!barber.isActive && (
            <span
              className="shrink-0 text-[var(--color-text-muted)] italic"
              style={{ fontSize: "10px" }}
            >
              Pending
            </span>
          )}
        </div>
        <p
          className="truncate italic"
          style={{ fontSize: "12px", color: "var(--color-text-muted)" }}
        >
          {opening ? "Відкриваємо..." : "Натисніть щоб написати"}
        </p>
      </div>
    </button>
  );
}

function SelectedThread({
  selected,
  onChatRefetch,
  onBackMobile,
}: {
  selected: NonNullable<SelectedView>;
  onChatRefetch: () => void;
  onBackMobile?: () => void;
}) {
  const headerName =
    selected.kind === "support"
      ? selected.chat.otherParticipant.name
      : selected.chat.barber.name;
  const headerSub =
    selected.kind === "support"
      ? selected.chat.otherParticipant.email
      : "Прямий чат";
  const headerImage =
    selected.kind === "support"
      ? selected.chat.otherParticipant.image
      : selected.chat.barber.image;

  return (
    <>
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
        <Avatar name={headerName} image={headerImage} />
        <div className="flex-1 min-w-0">
          <p
            className="truncate"
            style={{
              fontSize: "15px",
              fontWeight: 500,
              color: "var(--color-text)",
            }}
          >
            {headerName}
          </p>
          <p
            className="truncate text-[var(--color-text-muted)]"
            style={{ fontSize: "11px" }}
          >
            {headerSub}
          </p>
        </div>
      </div>
      <ChatThread
        chatId={selected.chat.id}
        active
        onMessagesChanged={onChatRefetch}
      />
    </>
  );
}
