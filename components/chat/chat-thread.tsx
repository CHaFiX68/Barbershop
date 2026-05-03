"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import {
  fetchMessages,
  markRead,
  pollMessages,
  sendMessage,
  type ChatDetail,
  type ChatMessage,
} from "@/lib/chat-client";
import ChatMessageBubble from "./chat-message-bubble";

const POLL_INTERVAL_MS = 5000;

type Props = {
  chatId: string;
  /** Whether polling should run. Parent decides (popup open, tab visible). */
  active: boolean;
  /** Called once when chat metadata is loaded — parent renders own header. */
  onChatLoaded?: (chat: ChatDetail) => void;
  /** Called whenever messages list changes (new send or new poll). */
  onMessagesChanged?: () => void;
  /** Override input disabled state. Defaults to chat.status === 'archived'. */
  forceArchived?: boolean;
};

export default function ChatThread({
  chatId,
  active,
  onChatLoaded,
  onMessagesChanged,
  forceArchived,
}: Props) {
  const [chat, setChat] = useState<ChatDetail | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const lastPollRef = useRef<string>(new Date(0).toISOString());
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setChat(null);
    setMessages([]);
    fetchMessages(chatId)
      .then(({ chat: c, messages: m }) => {
        if (cancelled) return;
        setChat(c);
        onChatLoaded?.(c);
        setMessages(m);
        lastPollRef.current = new Date().toISOString();
        const hasInbound = m.some((msg) => !msg.isOwn);
        if (hasInbound) {
          markRead(chatId)
            .then(() => onMessagesChanged?.())
            .catch(() => {});
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  // Polling
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      if (
        typeof document !== "undefined" &&
        document.visibilityState !== "visible"
      ) {
        return;
      }
      try {
        const data = await pollMessages(chatId, lastPollRef.current);
        if (cancelled) return;
        if (data.messages.length > 0) {
          setMessages((prev) => {
            const ids = new Set(prev.map((p) => p.id));
            const fresh = data.messages.filter((m) => !ids.has(m.id));
            return fresh.length ? [...prev, ...fresh] : prev;
          });
          const hasInbound = data.messages.some((m) => !m.isOwn);
          if (hasInbound) {
            markRead(chatId)
              .then(() => onMessagesChanged?.())
              .catch(() => {});
          }
        }
        lastPollRef.current = data.serverTime;
      } catch {
        // non-fatal
      }
    };
    const id = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, active]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  }, [inputValue]);

  const isArchived = forceArchived ?? chat?.status === "archived";

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || sending || isArchived) return;
    setSending(true);
    setError(null);
    const optimisticId = `optimistic-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: optimisticId,
      senderUserId: "self",
      body: trimmed,
      createdAt: new Date().toISOString(),
      isOwn: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setInputValue("");
    try {
      const real = await sendMessage(chatId, trimmed);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimisticId ? { ...real, isOwn: true } : m
        )
      );
      onMessagesChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалось надіслати");
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setInputValue(trimmed);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="italic text-[var(--color-text-muted)] text-[13px]">
          Завантаження...
        </p>
      </div>
    );
  }

  if (error && !chat) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <p className="italic text-[#A03030] text-[13px] text-center">
          {error}
        </p>
      </div>
    );
  }

  if (!chat) return null;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div
        className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 flex flex-col gap-2"
        style={{ background: "#F5F0E6" }}
      >
        {messages.length === 0 && (
          <p className="italic text-[var(--color-text-muted)] text-[13px] text-center my-auto">
            Це початок розмови
          </p>
        )}
        {messages.map((m) => (
          <ChatMessageBubble
            key={m.id}
            body={m.body}
            createdAt={m.createdAt}
            isOwn={m.isOwn}
            pending={m.id.startsWith("optimistic-")}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div
        className="px-3 py-2.5 flex items-end gap-2"
        style={{
          borderTopWidth: "1px",
          borderTopStyle: "solid",
          borderTopColor: "#D5D0C8",
        }}
      >
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isArchived ? "Чат архівований" : "Напишіть повідомлення..."
          }
          disabled={isArchived || sending}
          rows={1}
          className="flex-1 resize-none bg-white border border-[var(--color-line)] rounded-[12px] px-3 py-2 text-[13px] outline-none focus:border-[var(--color-text)] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ maxHeight: "96px" }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={isArchived || sending || !inputValue.trim()}
          aria-label="Надіслати"
          className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center bg-[var(--color-text)] text-white hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Send size={16} />
        </button>
      </div>
      {error && chat && (
        <p
          className="px-4 pb-2 text-[#A03030] italic"
          style={{ fontSize: "11px" }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
