"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ChatActions = {
  isOpen: boolean;
  selectedChatId: string | null;
  openChat: (chatId?: string) => void;
  closeChat: () => void;
  openSupportRequested: number; // ticks each time openSupport is invoked, so ChatBubble can react
  requestOpenSupport: () => void;
};

const ChatContext = createContext<ChatActions | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [openSupportRequested, setOpenSupportRequested] = useState(0);

  const openChat = useCallback((chatId?: string) => {
    setIsOpen(true);
    if (chatId) setSelectedChatId(chatId);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const requestOpenSupport = useCallback(() => {
    setIsOpen(true);
    setOpenSupportRequested((v) => v + 1);
  }, []);

  const value = useMemo<ChatActions>(
    () => ({
      isOpen,
      selectedChatId,
      openChat,
      closeChat,
      openSupportRequested,
      requestOpenSupport,
    }),
    [isOpen, selectedChatId, openChat, closeChat, openSupportRequested, requestOpenSupport]
  );

  // Internal setter for child components (ChatBubble) to update selected chat
  return (
    <ChatContext.Provider value={value}>
      <ChatInternalContext.Provider value={{ setSelectedChatId }}>
        {children}
      </ChatInternalContext.Provider>
    </ChatContext.Provider>
  );
}

const ChatInternalContext = createContext<{
  setSelectedChatId: (id: string | null) => void;
} | null>(null);

export function useChatActions(): ChatActions {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChatActions must be used within ChatProvider");
  }
  return ctx;
}

export function useChatInternal() {
  const ctx = useContext(ChatInternalContext);
  if (!ctx) {
    throw new Error("useChatInternal must be used within ChatProvider");
  }
  return ctx;
}
