import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { aliasedTable, asc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { barberProfile, booking, chat, message, user } from "@/lib/db/schema";
import { getContent } from "@/lib/content";

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
  const profileA = aliasedTable(barberProfile, "profile_a");
  const profileB = aliasedTable(barberProfile, "profile_b");

  const [chatRow] = await db
    .select({
      id: chat.id,
      type: chat.type,
      status: chat.status,
      bookingId: chat.bookingId,
      participantAUserId: chat.participantAUserId,
      participantBUserId: chat.participantBUserId,
      participantAName: userA.name,
      participantAEmail: userA.email,
      participantARole: userA.role,
      participantAPhone: profileA.phone,
      participantBName: userB.name,
      participantBEmail: userB.email,
      participantBRole: userB.role,
      participantBPhone: profileB.phone,
      bookingServiceName: booking.serviceName,
      bookingServicePrice: booking.servicePrice,
      bookingStartsAt: booking.startsAt,
      bookingStatus: booking.status,
    })
    .from(chat)
    .innerJoin(userA, eq(userA.id, chat.participantAUserId))
    .innerJoin(userB, eq(userB.id, chat.participantBUserId))
    .leftJoin(profileA, eq(profileA.userId, chat.participantAUserId))
    .leftJoin(profileB, eq(profileB.userId, chat.participantBUserId))
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
      attachmentUrl: message.attachmentUrl,
      attachmentType: message.attachmentType,
      createdAt: message.createdAt,
    })
    .from(message)
    .where(eq(message.chatId, chatId))
    .orderBy(asc(message.createdAt))
    .limit(100);

  const isA = chatRow.participantAUserId === me;
  const otherName = isA ? chatRow.participantBName : chatRow.participantAName;
  const otherEmail = isA
    ? chatRow.participantBEmail
    : chatRow.participantAEmail;
  const otherRole = isA ? chatRow.participantBRole : chatRow.participantARole;
  const otherPhone = isA
    ? chatRow.participantBPhone
    : chatRow.participantAPhone;
  const otherId = isA
    ? chatRow.participantBUserId
    : chatRow.participantAUserId;

  // For support chats, surface the shop's public phone (managed via the
  // editable "contacts.phone" content block) so the user can see it without
  // closing the chat. Empty string means admin never set it; treat as null.
  let supportPhone: string | null = null;
  if (chatRow.type === "support") {
    const raw = await getContent("contacts.phone", "");
    supportPhone = raw.trim() ? raw : null;
  }

  return NextResponse.json({
    chat: {
      id: chatRow.id,
      type: chatRow.type,
      status: chatRow.status,
      otherParticipant: {
        userId: otherId,
        name: otherName,
        email: otherEmail ?? null,
        role: otherRole,
        phone: otherPhone ?? null,
      },
      bookingId: chatRow.bookingId,
      bookingServiceName: chatRow.bookingServiceName ?? null,
      bookingServicePrice: chatRow.bookingServicePrice ?? null,
      bookingStartsAt: chatRow.bookingStartsAt
        ? chatRow.bookingStartsAt.toISOString()
        : null,
      bookingStatus: chatRow.bookingStatus ?? null,
      supportPhone,
    },
    messages: messages.map((m) => ({
      id: m.id,
      senderUserId: m.senderUserId,
      body: m.body,
      attachmentUrl: m.attachmentUrl,
      attachmentType: m.attachmentType,
      createdAt: m.createdAt.toISOString(),
      isOwn: m.senderUserId === me,
    })),
  });
}
