"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { fetchChats, openSupport, type ChatListItem } from "@/lib/chat-client";
import { useChatActions } from "@/lib/chat-context";
import ChatPopup from "./chat-popup";

const POLL_INTERVAL_MS = 5000;

export default function ChatBubble() {
  const {
    isOpen,
    selectedChatId: ctxSelectedId,
    openChat,
    closeChat,
    openSupportRequested,
  } = useChatActions();

  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(
    ctxSelectedId
  );
  const lastSupportTickRef = useRef(0);

  // Sync external selectedChatId requests from context
  useEffect(() => {
    if (ctxSelectedId && ctxSelectedId !== selectedChatId) {
      setSelectedChatId(ctxSelectedId);
    }
    // intentionally not depending on selectedChatId — only react to external changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctxSelectedId]);

  const totalUnread = chats.reduce((sum, c) => sum + c.unreadCount, 0);

  const refetchChats = useCallback(async () => {
    try {
      const list = await fetchChats();
      setChats(list);
      setLoading(false);
    } catch {
      // 401 (logged out) or network — keep last known list, don't blow up UI
      setLoading(false);
    }
  }, []);

  // Initial fetch + light polling
  useEffect(() => {
    refetchChats();
    const id = setInterval(() => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState !== "visible"
      ) {
        return;
      }
      refetchChats();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refetchChats]);

  // External request to open support chat (from user-menu)
  useEffect(() => {
    if (openSupportRequested === 0) return;
    if (openSupportRequested === lastSupportTickRef.current) return;
    lastSupportTickRef.current = openSupportRequested;
    let cancelled = false;
    (async () => {
      try {
        const id = await openSupport();
        if (cancelled) return;
        await refetchChats();
        setSelectedChatId(id);
      } catch {
        // openSupport failed — popup is already open, list pane will let user retry
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [openSupportRequested, refetchChats]);

  const handleClose = () => {
    closeChat();
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            type="button"
            key="bubble"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => openChat()}
            aria-label="Відкрити чат"
            className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[#1C1B19] hover:bg-[#2C2B29] shadow-lg flex items-center justify-center transition-colors"
          >
            <MessageCircle size={24} className="text-white" />
            {totalUnread > 0 && (
              <span
                className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full"
                style={{
                  background: "#A03030",
                  color: "white",
                  minWidth: "20px",
                  height: "20px",
                  fontSize: "11px",
                  fontWeight: 500,
                  padding: "0 5px",
                }}
              >
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <ChatPopup
            key="popup"
            chats={chats}
            loading={loading}
            selectedChatId={selectedChatId}
            onSelectChat={setSelectedChatId}
            onChatsRefetch={refetchChats}
            onClose={handleClose}
          />
        )}
      </AnimatePresence>
    </>
  );
}
