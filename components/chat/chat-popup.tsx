"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { ChatListItem } from "@/lib/chat-client";
import ChatListPane from "./chat-list-pane";
import ChatConversationPane from "./chat-conversation-pane";

type Props = {
  chats: ChatListItem[];
  loading: boolean;
  selectedChatId: string | null;
  onSelectChat: (chatId: string | null) => void;
  onChatsRefetch: () => void;
  onClose: () => void;
};

export default function ChatPopup({
  chats,
  loading,
  selectedChatId,
  onSelectChat,
  onChatsRefetch,
  onClose,
}: Props) {
  const [isMobile, setIsMobile] = useState(false);

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
      className="fixed z-50 bg-[#FAF7F1] rounded-[16px] shadow-2xl overflow-hidden flex flex-col"
      style={{
        bottom: "24px",
        right: "24px",
        width: "min(700px, calc(100vw - 48px))",
        height: "min(500px, calc(100vh - 100px))",
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
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрити чат"
          className="w-9 h-9 flex items-center justify-center rounded-[8px] hover:bg-black/5 transition-colors text-[var(--color-text)]"
        >
          <X size={18} />
        </button>
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
          />
        )}
        {!isMobile && (
          <div style={{ background: "#D5D0C8" }} />
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
