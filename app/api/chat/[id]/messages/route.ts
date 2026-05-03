import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { aliasedTable, asc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { booking, chat, message, user } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const me = session.user.id;
  const { id: chatId } = await params;

  const userA = aliasedTable(user, "user_a");
  const userB = aliasedTable(user, "user_b");

  const [chatRow] = await db
    .select({
      id: chat.id,
      type: chat.type,
      status: chat.status,
      bookingId: chat.bookingId,
      participantAUserId: chat.participantAUserId,
      participantBUserId: chat.participantBUserId,
      participantAName: userA.name,
      participantARole: userA.role,
      participantBName: userB.name,
      participantBRole: userB.role,
      bookingServiceName: booking.serviceName,
      bookingStartsAt: booking.startsAt,
    })
    .from(chat)
    .innerJoin(userA, eq(userA.id, chat.participantAUserId))
    .innerJoin(userB, eq(userB.id, chat.participantBUserId))
    .leftJoin(booking, eq(booking.id, chat.bookingId))
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

  const messages = await db
    .select({
      id: message.id,
      senderUserId: message.senderUserId,
      body: message.body,
      createdAt: message.createdAt,
    })
    .from(message)
    .where(eq(message.chatId, chatId))
    .orderBy(asc(message.createdAt))
    .limit(100);

  const isA = chatRow.participantAUserId === me;
  const otherName = isA ? chatRow.participantBName : chatRow.participantAName;
  const otherRole = isA ? chatRow.participantBRole : chatRow.participantARole;
  const otherId = isA
    ? chatRow.participantBUserId
    : chatRow.participantAUserId;

  return NextResponse.json({
    chat: {
      id: chatRow.id,
      type: chatRow.type,
      status: chatRow.status,
      otherParticipant: {
        userId: otherId,
        name: otherName,
        role: otherRole,
      },
      bookingId: chatRow.bookingId,
      bookingServiceName: chatRow.bookingServiceName ?? null,
      bookingStartsAt: chatRow.bookingStartsAt
        ? chatRow.bookingStartsAt.toISOString()
        : null,
    },
    messages: messages.map((m) => ({
      id: m.id,
      senderUserId: m.senderUserId,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      isOwn: m.senderUserId === me,
    })),
  });
}
