"use client";

import { useCallback, useEffect, useState } from "react";
import { HelpCircle } from "lucide-react";
import ChatThread from "@/components/chat/chat-thread";

const POLL_LIST_INTERVAL_MS = 15_000;

type AdminSupportChat = {
  id: string;
  status: "active" | "archived";
  otherParticipant: {
    userId: string;
    name: string;
    email: string;
    role: string;
  };
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  archivedAt: string | null;
  unreadByAdmin: number;
};

type SupportListResp = {
  chats: AdminSupportChat[];
  totalActive: number;
  totalArchived: number;
};

type StatusFilter = "active" | "archived" | "all";

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

function formatTime(iso: string | null): string {
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

function formatDateLong(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}.${mm}.${yyyy} ${hh}:${mi}`;
}

function getInitial(name: string): string {
  const t = name.trim();
  return t ? t[0].toUpperCase() : "?";
}

type Props = {
  initial: SupportListResp;
};

export default function SupportDashboard({ initial }: Props) {
  const [chats, setChats] = useState<AdminSupportChat[]>(initial.chats);
  const [totalActive, setTotalActive] = useState(initial.totalActive);
  const [totalArchived, setTotalArchived] = useState(initial.totalArchived);
  const [filter, setFilter] = useState<StatusFilter>("active");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/support/list?status=all`);
      if (!res.ok) return;
      const data = (await res.json()) as SupportListResp;
      setChats(data.chats);
      setTotalActive(data.totalActive);
      setTotalArchived(data.totalArchived);
    } catch {
      // non-fatal
    }
  }, []);

  // Polling list every 15s for new tickets / unread updates
  useEffect(() => {
    const id = setInterval(() => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState !== "visible"
      ) {
        return;
      }
      refetch();
    }, POLL_LIST_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refetch]);

  const filteredChats = chats.filter((c) => {
    if (filter === "all") return true;
    return c.status === filter;
  });

  const selected = selectedId ? chats.find((c) => c.id === selectedId) : null;

  const handleArchive = async () => {
    if (!selected || archiving) return;
    if (!confirm("Архівувати цей тікет? Користувач зможе відкрити новий чат.")) {
      return;
    }
    setArchiving(true);
    setActionError(null);
    try {
      const res = await fetch(
        `/api/admin/support/${selected.id}/archive`,
        { method: "POST" }
      );
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(json?.error || "Не вдалось архівувати");
      }
      await refetch();
      setSelectedId(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Не вдалось архівувати"
      );
    } finally {
      setArchiving(false);
    }
  };

  const showList = !isMobile || selectedId == null;
  const showThread = !isMobile || selectedId != null;

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 56px)" }}>
      <div className="px-4 sm:px-6 py-4 shrink-0">
        <h1
          className="font-display text-[var(--color-text)] mb-1"
          style={{ fontWeight: 600, fontSize: "clamp(24px, 4vw, 32px)" }}
        >
          Підтримка
        </h1>
        <p className="text-[var(--color-text-muted)] text-[12px]">
          Активних: {totalActive} · Архівних: {totalArchived}
        </p>
      </div>

      <div
        className="flex-1 min-h-0"
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "320px 1px 1fr",
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
              {(
                [
                  { key: "active", label: "Активні", n: totalActive },
                  { key: "archived", label: "Архівні", n: totalArchived },
                  {
                    key: "all",
                    label: "Всі",
                    n: totalActive + totalArchived,
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilter(tab.key as StatusFilter)}
                  className={`flex-1 px-3 py-1.5 rounded-[8px] text-[12px] transition-colors ${
                    filter === tab.key
                      ? "bg-[var(--color-text)] text-white"
                      : "text-[var(--color-text)] hover:bg-[#EDEAE5]"
                  }`}
                >
                  {tab.label} ({tab.n})
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filteredChats.length === 0 ? (
                <p
                  className="italic text-center px-4 py-8 text-[var(--color-text-muted)]"
                  style={{ fontSize: "12px" }}
                >
                  Немає тікетів
                </p>
              ) : (
                filteredChats.map((c) => (
                  <SupportListRow
                    key={c.id}
                    chat={c}
                    isSelected={selectedId === c.id}
                    onSelect={() => setSelectedId(c.id)}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {!isMobile && <div style={{ background: "#D5D0C8" }} />}

        {showThread && (
          <div className="flex flex-col h-full min-h-0">
            {selected ? (
              <>
                <div
                  className="flex items-center gap-3 px-4 py-3 shrink-0"
                  style={{
                    height: "72px",
                    borderBottomWidth: "1px",
                    borderBottomStyle: "solid",
                    borderBottomColor: "#D5D0C8",
                    background: "#FAF7F1",
                  }}
                >
                  {isMobile && (
                    <button
                      type="button"
                      onClick={() => setSelectedId(null)}
                      aria-label="Назад до списку"
                      className="md:hidden flex items-center justify-center w-8 h-8 rounded-[8px] hover:bg-black/5 transition-colors"
                    >
                      ←
                    </button>
                  )}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: "#C9B89A",
                      color: "white",
                      fontSize: "16px",
                      fontWeight: 500,
                    }}
                  >
                    {getInitial(selected.otherParticipant.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="truncate"
                      style={{
                        fontSize: "15px",
                        fontWeight: 500,
                        color: "var(--color-text)",
                      }}
                    >
                      {selected.otherParticipant.name}
                    </p>
                    <p
                      className="truncate text-[var(--color-text-muted)]"
                      style={{ fontSize: "11px" }}
                    >
                      {selected.otherParticipant.email} ·{" "}
                      {formatDateLong(selected.createdAt)}
                    </p>
                  </div>
                  {selected.status === "active" ? (
                    <button
                      type="button"
                      onClick={handleArchive}
                      disabled={archiving}
                      className="px-3 py-1.5 rounded-[8px] text-[12px] border border-[var(--color-line)] hover:bg-[#EDEAE5] transition-colors disabled:opacity-50"
                    >
                      {archiving ? "Архівую..." : "Архівувати"}
                    </button>
                  ) : (
                    <span
                      className="text-[10px] uppercase shrink-0"
                      style={{
                        letterSpacing: "0.15em",
                        fontWeight: 500,
                        color: "var(--color-text-muted)",
                      }}
                    >
                      Архівовано
                      {selected.archivedAt
                        ? ` ${formatDateLong(selected.archivedAt)}`
                        : ""}
                    </span>
                  )}
                </div>

                {actionError && (
                  <p
                    className="px-4 py-2 italic text-[#A03030]"
                    style={{ fontSize: "11px" }}
                  >
                    {actionError}
                  </p>
                )}

                <ChatThread
                  key={selected.id}
                  chatId={selected.id}
                  active
                  onMessagesChanged={refetch}
                  forceArchived={selected.status === "archived"}
                />
              </>
            ) : (
              <div className="flex items-center justify-center h-full px-6">
                <p
                  className="italic text-[var(--color-text-muted)] text-center"
                  style={{ fontSize: "13px" }}
                >
                  Виберіть тікет зі списку зліва
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SupportListRow({
  chat,
  isSelected,
  onSelect,
}: {
  chat: AdminSupportChat;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const isArchived = chat.status === "archived";
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-start gap-3 px-3 py-3 text-left transition-colors ${
        isSelected ? "bg-[#EDEAE5]" : "hover:bg-[#F0EDE8]"
      } ${isArchived ? "opacity-60" : ""}`}
      style={{
        borderBottomWidth: "1px",
        borderBottomStyle: "solid",
        borderBottomColor: "#D5D0C8",
      }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{
          background: "#C9B89A",
          color: "white",
          fontSize: "14px",
          fontWeight: 500,
        }}
      >
        {getInitial(chat.otherParticipant.name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p
            className="flex-1 min-w-0 truncate"
            style={{
              fontSize: "13px",
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
              {formatTime(chat.lastMessageAt)}
            </span>
          )}
        </div>
        <p
          className="truncate text-[var(--color-text-muted)]"
          style={{ fontSize: "11px" }}
        >
          {chat.otherParticipant.email}
        </p>
        <div className="flex items-center gap-2 mt-1">
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
        {isArchived && (
          <p
            className="italic mt-0.5"
            style={{ fontSize: "10px", color: "var(--color-text-muted)" }}
          >
            Архівовано
          </p>
        )}
      </div>
      {/* HelpCircle reference for visual support category */}
      {!isArchived && (
        <HelpCircle
          size={14}
          className="shrink-0 mt-1 text-[#C9B89A]"
          aria-hidden="true"
        />
      )}
    </button>
  );
}
