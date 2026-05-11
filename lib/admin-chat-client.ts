"use client";

export type AdminChatListItem = {
  kind: "barber" | "support";
  chatId: string | null;
  partnerId: string;
  partnerName: string;
  partnerEmail: string;
  partnerAvatar: string | null;
  isPinned: boolean;
  lastMessageText: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
};

export async function fetchAdminChatList(
  signal?: AbortSignal
): Promise<AdminChatListItem[]> {
  const res = await fetch("/api/admin/chats/list", { signal });
  if (!res.ok) throw new Error(`fetchAdminChatList ${res.status}`);
  const data = (await res.json()) as { items: AdminChatListItem[] };
  return data.items;
}

export async function openChatWithBarber(barberId: string): Promise<string> {
  const res = await fetch("/api/admin/chats/with-barber", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ barberId }),
  });
  const json = (await res.json().catch(() => null)) as
    | { chatId?: string; error?: string }
    | null;
  if (!res.ok || !json?.chatId) {
    throw new Error(json?.error || `openChatWithBarber ${res.status}`);
  }
  return json.chatId;
}
