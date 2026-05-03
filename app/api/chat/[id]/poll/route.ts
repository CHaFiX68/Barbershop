import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, asc, eq, gt } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { chat, message } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = session.user.id;
  const { id: chatId } = await params;

  const url = new URL(request.url);
  const sinceParam = url.searchParams.get("since");
  const since = sinceParam ? new Date(sinceParam) : null;
  if (!since || Number.isNaN(since.getTime())) {
    return NextResponse.json(
      { error: "Missing or invalid 'since' query param (ISO timestamp)" },
      { status: 400 }
    );
  }

  const [chatRow] = await db
    .select({
      participantAUserId: chat.participantAUserId,
      participantBUserId: chat.participantBUserId,
    })
    .from(chat)
    .where(eq(chat.id, chatId));

  if (!chatRow) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }
  if (
    chatRow.participantAUserId !== me &&
    chatRow.participantBUserId !== me
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const newMessages = await db
    .select({
      id: message.id,
      senderUserId: message.senderUserId,
      body: message.body,
      createdAt: message.createdAt,
    })
    .from(message)
    .where(and(eq(message.chatId, chatId), gt(message.createdAt, since)))
    .orderBy(asc(message.createdAt));

  return NextResponse.json({
    messages: newMessages.map((m) => ({
      id: m.id,
      senderUserId: m.senderUserId,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      isOwn: m.senderUserId === me,
    })),
    serverTime: new Date().toISOString(),
  });
}
