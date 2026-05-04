"use client";

export type AdminSupportChat = {
  id: string;
  otherParticipant: {
    userId: string;
    name: string;
    email: string;
    image: string | null;
    role: string;
  };
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadByAdmin: number;
};

export type AdminDirectChat = {
  id: string;
  barber: {
    userId: string;
    name: string;
    image: string | null;
  };
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadByAdmin: number;
};

export type AdminChatsList = {
  support: AdminSupportChat[];
  direct: AdminDirectChat[];
};

export type AdminBarberOption = {
  userId: string;
  name: string;
  image: string | null;
  isActive: boolean;
};

export async function fetchAdminChats(
  signal?: AbortSignal
): Promise<AdminChatsList> {
  const res = await fetch("/api/admin/chats/list", { signal });
  if (!res.ok) throw new Error(`fetchAdminChats ${res.status}`);
  return (await res.json()) as AdminChatsList;
}

export async function fetchAdminBarbers(
  signal?: AbortSignal
): Promise<AdminBarberOption[]> {
  const res = await fetch("/api/admin/barbers/list-for-chat", { signal });
  if (!res.ok) throw new Error(`fetchAdminBarbers ${res.status}`);
  const data = (await res.json()) as { barbers: AdminBarberOption[] };
  return data.barbers;
}

export async function openDirectChat(barberUserId: string): Promise<string> {
  const res = await fetch("/api/admin/chats/direct/open", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ barberUserId }),
  });
  const json = (await res.json().catch(() => null)) as
    | { chatId?: string; error?: string }
    | null;
  if (!res.ok || !json?.chatId) {
    throw new Error(json?.error || `openDirectChat ${res.status}`);
  }
  return json.chatId;
}
