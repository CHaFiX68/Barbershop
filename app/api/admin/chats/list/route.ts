import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { aliasedTable, and, desc, eq, ne, or, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { chat, message, user } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [me] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id));
  if (!me || me.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const adminId = session.user.id;
  const userA = aliasedTable(user, "user_a");
  const userB = aliasedTable(user, "user_b");

  const rows = await db
    .select({
      id: chat.id,
      type: chat.type,
      status: chat.status,
      participantAUserId: chat.participantAUserId,
      participantBUserId: chat.participantBUserId,
      lastMessageAt: chat.lastMessageAt,
      lastMessagePreview: chat.lastMessagePreview,
      createdAt: chat.createdAt,
      participantAName: userA.name,
      participantAImage: userA.image,
      participantARole: userA.role,
      participantAEmail: userA.email,
      participantBName: userB.name,
      participantBImage: userB.image,
      participantBRole: userB.role,
      participantBEmail: userB.email,
    })
    .from(chat)
    .innerJoin(userA, eq(userA.id, chat.participantAUserId))
    .innerJoin(userB, eq(userB.id, chat.participantBUserId))
    .where(
      and(
        eq(chat.status, "active"),
        or(
          eq(chat.type, "support"),
          and(
            eq(chat.type, "direct_admin"),
            eq(chat.participantAUserId, adminId)
          )
        )
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
        ne(message.senderUserId, adminId),
        or(
          and(
            eq(chat.participantAUserId, adminId),
            eq(message.readByA, false)
          ),
          and(
            eq(chat.participantBUserId, adminId),
            eq(message.readByB, false)
          )
        )
      )
    )
    .groupBy(message.chatId);

  const unreadMap = new Map(unreadCounts.map((u) => [u.chatId, u.count]));

  const support: Array<{
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
  }> = [];
  const direct: Array<{
    id: string;
    barber: {
      userId: string;
      name: string;
      image: string | null;
    };
    lastMessagePreview: string | null;
    lastMessageAt: string | null;
    unreadByAdmin: number;
  }> = [];

  for (const r of rows) {
    if (r.type === "support") {
      // The non-admin participant is the customer. Skip pathological
      // self-chats just in case.
      const aIsAdmin = r.participantARole === "admin";
      if (
        r.participantARole === "admin" &&
        r.participantBRole === "admin"
      ) {
        continue;
      }
      const customerId = aIsAdmin
        ? r.participantBUserId
        : r.participantAUserId;
      const customerName = aIsAdmin
        ? r.participantBName
        : r.participantAName;
      const customerEmail = aIsAdmin
        ? r.participantBEmail
        : r.participantAEmail;
      const customerImage = aIsAdmin
        ? r.participantBImage
        : r.participantAImage;
      const customerRole = aIsAdmin
        ? r.participantBRole
        : r.participantARole;
      support.push({
        id: r.id,
        otherParticipant: {
          userId: customerId,
          name: customerName,
          email: customerEmail,
          image: customerImage ?? null,
          role: customerRole,
        },
        lastMessagePreview: r.lastMessagePreview,
        lastMessageAt: r.lastMessageAt
          ? r.lastMessageAt.toISOString()
          : null,
        unreadByAdmin: unreadMap.get(r.id) ?? 0,
      });
    } else if (r.type === "direct_admin") {
      // By convention participantA = admin, participantB = barber.
      direct.push({
        id: r.id,
        barber: {
          userId: r.participantBUserId,
          name: r.participantBName,
          image: r.participantBImage ?? null,
        },
        lastMessagePreview: r.lastMessagePreview,
        lastMessageAt: r.lastMessageAt
          ? r.lastMessageAt.toISOString()
          : null,
        unreadByAdmin: unreadMap.get(r.id) ?? 0,
      });
    }
  }

  return NextResponse.json({ support, direct });
}
