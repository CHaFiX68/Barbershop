"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  openChatWithBarber,
  type AdminChatListItem,
} from "@/lib/admin-chat-client";
import { useModalStack } from "@/lib/modal-stack-context";
import ChatConversationPane from "./chat-conversation-pane";
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
  const trimmed = name.trim();
  return trimmed ? trimmed[0].toUpperCase() : "?";
}

type Props = {
  items: AdminChatListItem[];
  loading: boolean;
  selectedChatId: string | null;
  onSelectChat: (chatId: string | null) => void;
  onChatsRefetch: () => void;
  onClose: () => void;
};

export default function AdminChatPopup({
  items,
  loading,
  selectedChatId,
  onSelectChat,
  onChatsRefetch,
  onClose,
}: Props) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768
  );
  const [openingBarberId, setOpeningBarberId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const { zIndex } = useModalStack("admin-chat-popup", true, onClose, {
    respectEsc: false,
    lockBody: isMobile,
  });
  const t = useTranslations("chat");
  const tSupport = useTranslations("support");
  const tManagement = useTranslations("management");
  const tCommon = useTranslations("common");

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const barberItems = useMemo(
    () => items.filter((i) => i.kind === "barber"),
    [items]
  );
  const supportItems = useMemo(
    () => items.filter((i) => i.kind === "support"),
    [items]
  );

  const selectedItem = useMemo(
    () =>
      selectedChatId
        ? items.find((i) => i.chatId === selectedChatId) ?? null
        : null,
    [selectedChatId, items]
  );

  const handleSelectBarber = async (item: AdminChatListItem) => {
    if (item.chatId) {
      onSelectChat(item.chatId);
      return;
    }
    if (openingBarberId) return;
    setOpeningBarberId(item.partnerId);
    setActionError(null);
    try {
      const chatId = await openChatWithBarber(item.partnerId);
      onChatsRefetch();
      onSelectChat(chatId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : tCommon("error"));
    } finally {
      setOpeningBarberId(null);
    }
  };

  const showList = !isMobile || selectedChatId == null;
  const showConversation = !isMobile || selectedChatId != null;

  const listPaneContent = (
    <div className="flex flex-col h-full min-h-0 min-w-0">
      {actionError && (
        <p
          className="px-4 py-2 italic text-[var(--color-danger)]"
          style={{ fontSize: "11px" }}
        >
          {actionError}
        </p>
      )}

      <div className="flex-1 overflow-y-auto overscroll-contain chat-list-scrollbar">
        {!loading && items.length === 0 && (
          <p
            className="italic text-center px-4 py-8 text-[var(--color-text-muted)]"
            style={{ fontSize: "12px" }}
          >
            {tSupport("noActiveTickets")}
          </p>
        )}

        {barberItems.length > 0 && (
          <>
            <SectionHeader
              label={tManagement("barbersHeader")}
              tooltip={t("barberChatNoDelete")}
            />
            {barberItems.map((item) => (
              <ChatRow
                key={`barber-${item.partnerId}`}
                item={item}
                selected={
                  item.chatId != null && selectedChatId === item.chatId
                }
                onClick={() => handleSelectBarber(item)}
                isOpening={openingBarberId === item.partnerId}
              />
            ))}
          </>
        )}

        {supportItems.length > 0 && (
          <>
            <SectionHeader label={tSupport("title")} />
            {supportItems.map((item) => (
              <ChatRow
                key={`support-${item.chatId}`}
                item={item}
                selected={selectedChatId === item.chatId}
                onClick={() => item.chatId && onSelectChat(item.chatId)}
                isOpening={false}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );

  const conversationPaneContent = (
    <div className="flex flex-col h-full min-h-0 min-w-0">
      <AnimatePresence mode="wait" initial={false}>
        {selectedChatId && selectedItem ? (
          <motion.div
            key={selectedChatId}
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -14 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="flex flex-col h-full min-h-0 min-w-0"
          >
            <ChatConversationPane
              key={selectedChatId}
              chatId={selectedChatId}
              isPopupOpen
              onChatRefetch={onChatsRefetch}
              onBackMobile={isMobile ? () => onSelectChat(null) : undefined}
              onDeleted={() => {
                onSelectChat(null);
                onChatsRefetch();
              }}
              currentUserRole="admin"
              canDeleteOverride={false}
            />
          </motion.div>
        ) : (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="flex items-center justify-center h-full px-6"
          >
            <p
              className="italic text-[var(--color-text-muted)] text-center"
              style={{ fontSize: "13px", lineHeight: 1.5 }}
            >
              {tSupport("selectTicketPlaceholder")}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ duration: 0.2 }}
      className="fixed bg-[var(--color-bg)]/85 backdrop-blur-[8px] border border-[var(--color-line)] shadow-2xl overflow-hidden flex flex-col"
      style={{
        zIndex,
        bottom: isMobile ? "0" : "24px",
        right: isMobile ? "0" : "24px",
        left: isMobile ? "0" : "auto",
        top: isMobile ? "0" : "auto",
        width: isMobile ? "100vw" : "min(720px, calc(100vw - 48px))",
        height: isMobile ? "100dvh" : "min(560px, calc(100vh - 100px))",
        borderRadius: isMobile ? "0" : "16px",
      }}
    >
      <div
        className="flex items-center justify-between px-4 shrink-0"
        style={{
          height: "56px",
          borderBottomWidth: "1px",
          borderBottomStyle: "solid",
          borderBottomColor: "var(--color-line)",
        }}
      >
        <h3
          className="font-display"
          style={{
            fontSize: "18px",
            fontWeight: 500,
            color: "var(--color-text)",
          }}
        >
          {t("title")}
        </h3>
        <CloseButton onClick={onClose} ariaLabel={t("title")} />
      </div>

      <div
        className="flex-1 min-h-0 overflow-hidden"
        style={
          isMobile
            ? { position: "relative" }
            : {
                display: "grid",
                gridTemplateColumns: "280px 1px 1fr",
              }
        }
      >
        {isMobile ? (
          <AnimatePresence mode="wait" initial={false}>
            {showList && (
              <motion.div
                key="list"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 flex flex-col"
              >
                {listPaneContent}
              </motion.div>
            )}
            {showConversation && selectedChatId && (
              <motion.div
                key="conversation"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 flex flex-col"
              >
                {conversationPaneContent}
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          <>
            {showList && listPaneContent}
            <div style={{ background: "var(--color-line)" }} />
            {showConversation && conversationPaneContent}
          </>
        )}
      </div>
    </motion.div>
  );
}

function SectionHeader({
  label,
  tooltip,
}: {
  label: string;
  tooltip?: string;
}) {
  return (
    <div
      className="px-4 py-2 sticky top-0 z-10"
      style={{
        fontSize: "10px",
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        fontWeight: 500,
        color: "var(--color-text-muted)",
        background: "var(--color-surface-2)",
        borderBottomWidth: "1px",
        borderBottomStyle: "solid",
        borderBottomColor: "var(--color-line)",
      }}
      title={tooltip}
    >
      {label}
    </div>
  );
}

function ChatRow({
  item,
  selected,
  onClick,
  isOpening,
}: {
  item: AdminChatListItem;
  selected: boolean;
  onClick: () => void;
  isOpening: boolean;
}) {
  const initial = getInitial(item.partnerName);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isOpening}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors disabled:opacity-50 ${
        selected ? "bg-[var(--color-bg)]" : "hover:bg-[var(--color-bg)]"
      }`}
      style={{
        borderBottomWidth: "1px",
        borderBottomStyle: "solid",
        borderBottomColor: "var(--color-line)",
      }}
    >
      {item.partnerAvatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.partnerAvatar}
          alt=""
          className="w-10 h-10 rounded-full object-cover shrink-0"
        />
      ) : (
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-display"
          style={{
            background: "var(--color-bronze)",
            color: "white",
            fontSize: "16px",
            fontWeight: 500,
          }}
        >
          {initial}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p
            className="flex-1 min-w-0 truncate"
            style={{
              fontSize: "14px",
              fontWeight: item.unreadCount > 0 ? 600 : 500,
              color: "var(--color-text)",
            }}
          >
            {item.partnerName}
          </p>
          {item.lastMessageAt && (
            <span
              className="shrink-0 text-[var(--color-text-muted)]"
              style={{ fontSize: "10px" }}
            >
              {formatLastTime(item.lastMessageAt)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <p
            className="flex-1 min-w-0 truncate italic pr-12"
            style={{ fontSize: "12px", color: "var(--color-text-muted)" }}
          >
            {item.lastMessageText ?? item.partnerEmail}
          </p>
          {item.unreadCount > 0 && (
            <span
              className="shrink-0 inline-flex items-center justify-center rounded-full"
              style={{
                background:
                  item.kind === "support"
                    ? "var(--color-danger)"
                    : "var(--color-bronze)",
                color: "white",
                minWidth: "18px",
                height: "18px",
                fontSize: "10px",
                fontWeight: 500,
                padding: "0 5px",
              }}
            >
              {item.unreadCount > 99 ? "99+" : item.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
