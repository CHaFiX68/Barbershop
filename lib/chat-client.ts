"use client";

export type ChatListItem = {
  id: string;
  type: "booking" | "support" | "direct_admin";
  status: "active" | "archived";
  otherParticipant: {
    userId: string;
    name: string;
    role: string;
  };
  bookingId: string | null;
  bookingServiceName: string | null;
  bookingStartsAt: string | null;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  unreadCount: number;
};

export type ChatMessage = {
  id: string;
  senderUserId: string;
  body: string;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  createdAt: string;
  isOwn: boolean;
};

export type ChatDetail = {
  id: string;
  type: "booking" | "support" | "direct_admin";
  status: "active" | "archived";
  otherParticipant: {
    userId: string;
    name: string;
    email: string | null;
    role: string;
    phone: string | null;
  };
  bookingId: string | null;
  bookingServiceName: string | null;
  bookingServicePrice: string | null;
  bookingStartsAt: string | null;
  bookingStatus: string | null;
  supportPhone: string | null;
};

export async function fetchChats(signal?: AbortSignal): Promise<ChatListItem[]> {
  const res = await fetch("/api/chat/list", { signal });
  if (!res.ok) throw new Error(`fetchChats ${res.status}`);
  const data = (await res.json()) as { chats: ChatListItem[] };
  return data.chats;
}

export async function fetchMessages(
  chatId: string,
  signal?: AbortSignal
): Promise<{ chat: ChatDetail; messages: ChatMessage[] }> {
  const res = await fetch(`/api/chat/${chatId}/messages`, { signal });
  if (!res.ok) throw new Error(`fetchMessages ${res.status}`);
  return (await res.json()) as { chat: ChatDetail; messages: ChatMessage[] };
}

export async function pollMessages(
  chatId: string,
  since: string,
  signal?: AbortSignal
): Promise<{ messages: ChatMessage[]; serverTime: string }> {
  const url = `/api/chat/${chatId}/poll?since=${encodeURIComponent(since)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`pollMessages ${res.status}`);
  return (await res.json()) as { messages: ChatMessage[]; serverTime: string };
}

export async function sendMessage(
  chatId: string,
  body: string,
  attachment?: { url: string; type: string }
): Promise<ChatMessage> {
  const res = await fetch(`/api/chat/${chatId}/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      body,
      ...(attachment
        ? { attachmentUrl: attachment.url, attachmentType: attachment.type }
        : {}),
    }),
  });
  const json = (await res.json().catch(() => null)) as
    | {
        id?: string;
        body?: string;
        attachmentUrl?: string | null;
        attachmentType?: string | null;
        createdAt?: string;
        error?: string;
      }
    | null;
  if (!res.ok || !json?.id || !json?.createdAt) {
    throw new Error(json?.error || `sendMessage ${res.status}`);
  }
  return {
    id: json.id,
    senderUserId: "",
    body: json.body ?? "",
    attachmentUrl: json.attachmentUrl ?? null,
    attachmentType: json.attachmentType ?? null,
    createdAt: json.createdAt,
    isOwn: true,
  };
}

export async function uploadAttachment(
  chatId: string,
  file: File
): Promise<{ url: string; type: string }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`/api/chat/${chatId}/attachment/upload`, {
    method: "POST",
    body: fd,
  });
  const json = (await res.json().catch(() => null)) as
    | { url?: string; type?: string; error?: string }
    | null;
  if (!res.ok || !json?.url || !json?.type) {
    throw new Error(json?.error || `uploadAttachment ${res.status}`);
  }
  return { url: json.url, type: json.type };
}

export async function markRead(chatId: string): Promise<void> {
  await fetch(`/api/chat/${chatId}/read`, { method: "POST" });
}

export async function openSupport(): Promise<string> {
  const res = await fetch("/api/chat/support/open", { method: "POST" });
  const json = (await res.json().catch(() => null)) as
    | { chatId?: string; error?: string }
    | null;
  if (!res.ok || !json?.chatId) {
    throw new Error(json?.error || `openSupport ${res.status}`);
  }
  return json.chatId;
}

export async function deleteChat(chatId: string): Promise<void> {
  const res = await fetch(`/api/chat/${chatId}`, { method: "DELETE" });
  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(json?.error || `deleteChat ${res.status}`);
  }
}
