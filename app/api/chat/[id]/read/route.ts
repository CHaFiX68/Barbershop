import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, eq, ne } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { chat, message } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = session.user.id;
  const { id: chatId } = await params;

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

  const isA = chatRow.participantAUserId === me;

  if (isA) {
    await db
      .update(message)
      .set({ readByA: true })
      .where(
        and(
          eq(message.chatId, chatId),
          eq(message.readByA, false),
          ne(message.senderUserId, me)
        )
      );
  } else {
    await db
      .update(message)
      .set({ readByB: true })
      .where(
        and(
          eq(message.chatId, chatId),
          eq(message.readByB, false),
          ne(message.senderUserId, me)
        )
      );
  }

  return NextResponse.json({ ok: true });
}
