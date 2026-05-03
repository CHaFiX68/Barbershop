import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { aliasedTable, and, desc, eq, ne, or, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { booking, chat, message, user } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const me = session.user.id;
  const userA = aliasedTable(user, "user_a");
  const userB = aliasedTable(user, "user_b");

  const rows = await db
    .select({
      id: chat.id,
      type: chat.type,
      status: chat.status,
      bookingId: chat.bookingId,
      participantAUserId: chat.participantAUserId,
      participantBUserId: chat.participantBUserId,
      lastMessageAt: chat.lastMessageAt,
      lastMessagePreview: chat.lastMessagePreview,
      createdAt: chat.createdAt,
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
    .where(
      or(
        eq(chat.participantAUserId, me),
        eq(chat.participantBUserId, me)
      )
    )
    .orderBy(
      sql`${chat.lastMessageAt} DESC NULLS LAST`,
      desc(chat.createdAt)
    );

  const unreadCounts = await db
    .select({
      chatId: message.chatId,
      count: sql<number>`count(*)::int`.as("count"),
    })
    .from(message)
    .innerJoin(chat, eq(chat.id, message.chatId))
    .where(
      and(
        ne(message.senderUserId, me),
        or(
          and(
            eq(chat.participantAUserId, me),
            eq(message.readByA, false)
          ),
          and(
            eq(chat.participantBUserId, me),
            eq(message.readByB, false)
          )
        )
      )
    )
    .groupBy(message.chatId);

  const unreadMap = new Map(unreadCounts.map((u) => [u.chatId, u.count]));

  const chats = rows.map((r) => {
    const isA = r.participantAUserId === me;
    const otherName = isA ? r.participantBName : r.participantAName;
    const otherRole = isA ? r.participantBRole : r.participantARole;
    const otherId = isA ? r.participantBUserId : r.participantAUserId;
    return {
      id: r.id,
      type: r.type,
      status: r.status,
      otherParticipant: {
        userId: otherId,
        name: otherName,
        role: otherRole,
      },
      bookingId: r.bookingId,
      bookingServiceName: r.bookingServiceName ?? null,
      bookingStartsAt: r.bookingStartsAt
        ? r.bookingStartsAt.toISOString()
        : null,
      lastMessagePreview: r.lastMessagePreview,
      lastMessageAt: r.lastMessageAt ? r.lastMessageAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
      unreadCount: unreadMap.get(r.id) ?? 0,
    };
  });

  return NextResponse.json({ chats });
}
