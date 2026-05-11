"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { ChatListItem } from "@/lib/chat-client";
import { useModalStack } from "@/lib/modal-stack-context";
import CloseButton from "@/components/ui/close-button";
import ChatListPane from "./chat-list-pane";
import ChatConversationPane from "./chat-conversation-pane";

type Props = {
  chats: ChatListItem[];
  loading: boolean;
  selectedChatId: string | null;
  onSelectChat: (chatId: string | null) => void;
  onChatsRefetch: () => void;
  onClose: () => void;
  currentUserRole?: string | null;
};

export default function ChatPopup({
  chats,
  loading,
  selectedChatId,
  onSelectChat,
  onChatsRefetch,
  onClose,
  currentUserRole = null,
}: Props) {
  const [isMobile, setIsMobile] = useState(false);
  const { zIndex } = useModalStack("chat-popup", true, onClose, {
    respectEsc: false,
  });
  const t = useTranslations("chat");

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const showList = !isMobile || selectedChatId == null;
  const showConversation = !isMobile || selectedChatId != null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ duration: 0.2 }}
      className="fixed bg-[var(--color-surface)] shadow-2xl overflow-hidden flex flex-col"
      style={{
        zIndex,
        bottom: isMobile ? "0" : "24px",
        right: isMobile ? "0" : "24px",
        left: isMobile ? "0" : "auto",
        top: isMobile ? "0" : "auto",
        width: isMobile ? "100vw" : "min(700px, calc(100vw - 48px))",
        height: isMobile ? "100dvh" : "min(500px, calc(100vh - 100px))",
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
          style={{ fontSize: "18px", fontWeight: 500, color: "var(--color-text)" }}
        >
          {t("title")}
        </h3>
        <CloseButton onClick={onClose} ariaLabel={t("title")} />
      </div>

      <div
        className="flex-1 min-h-0"
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "280px 1px 1fr",
        }}
      >
        {showList && (
          <ChatListPane
            chats={chats}
            selectedChatId={selectedChatId}
            onSelectChat={(id) => onSelectChat(id)}
            onChatsRefetch={onChatsRefetch}
            loading={loading}
            currentUserRole={currentUserRole}
          />
        )}
        {!isMobile && (
          <div style={{ background: "var(--color-line)" }} />
        )}
        {showConversation && (
          <>
            {selectedChatId ? (
              <ChatConversationPane
                key={selectedChatId}
                chatId={selectedChatId}
                isPopupOpen={true}
                onChatRefetch={onChatsRefetch}
                onBackMobile={
                  isMobile ? () => onSelectChat(null) : undefined
                }
                onDeleted={() => {
                  onSelectChat(null);
                  onChatsRefetch();
                }}
                currentUserRole={currentUserRole}
              />
            ) : (
              <div className="flex items-center justify-center h-full px-6">
                <p
                  className="italic text-[var(--color-text-muted)] text-center"
                  style={{ fontSize: "13px", lineHeight: 1.5 }}
                >
                  Оберіть чат зліва
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
