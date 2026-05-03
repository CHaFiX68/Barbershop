import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { aliasedTable, and, desc, eq, ne, or, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { chat, message, user } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

type StatusFilter = "active" | "archived" | "all";

export async function GET(request: Request) {
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
  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status") ?? "all";
  const status: StatusFilter =
    statusParam === "active" || statusParam === "archived"
      ? statusParam
      : "all";

  const userA = aliasedTable(user, "user_a");
  const userB = aliasedTable(user, "user_b");

  const baseFilter = eq(chat.type, "support");
  const filter =
    status === "all"
      ? baseFilter
      : and(baseFilter, eq(chat.status, status));

  const rows = await db
    .select({
      id: chat.id,
      status: chat.status,
      participantAUserId: chat.participantAUserId,
      participantBUserId: chat.participantBUserId,
      lastMessageAt: chat.lastMessageAt,
      lastMessagePreview: chat.lastMessagePreview,
      createdAt: chat.createdAt,
      archivedAt: chat.archivedAt,
      participantAName: userA.name,
      participantAEmail: userA.email,
      participantARole: userA.role,
      participantBName: userB.name,
      participantBEmail: userB.email,
      participantBRole: userB.role,
    })
    .from(chat)
    .innerJoin(userA, eq(userA.id, chat.participantAUserId))
    .innerJoin(userB, eq(userB.id, chat.participantBUserId))
    .where(filter)
    .orderBy(
      sql`CASE WHEN ${chat.status} = 'active' THEN 0 ELSE 1 END`,
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
        eq(chat.type, "support"),
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

  const chats = rows.map((r) => {
    // The non-admin participant is the customer raising the ticket.
    const aIsAdmin = r.participantARole === "admin";
    const customerId = aIsAdmin ? r.participantBUserId : r.participantAUserId;
    const customerName = aIsAdmin
      ? r.participantBName
      : r.participantAName;
    const customerEmail = aIsAdmin
      ? r.participantBEmail
      : r.participantAEmail;
    const customerRole = aIsAdmin
      ? r.participantBRole
      : r.participantARole;
    return {
      id: r.id,
      status: r.status,
      otherParticipant: {
        userId: customerId,
        name: customerName,
        email: customerEmail,
        role: customerRole,
      },
      lastMessagePreview: r.lastMessagePreview,
      lastMessageAt: r.lastMessageAt
        ? r.lastMessageAt.toISOString()
        : null,
      createdAt: r.createdAt.toISOString(),
      archivedAt: r.archivedAt ? r.archivedAt.toISOString() : null,
      unreadByAdmin: unreadMap.get(r.id) ?? 0,
    };
  });

  // Aggregate counts (independent of filter — for nav badge / tabs)
  const [totals] = await db
    .select({
      total: sql<number>`count(*)::int`.as("total"),
      active:
        sql<number>`count(*) FILTER (WHERE ${chat.status} = 'active')::int`.as(
          "active"
        ),
      archived:
        sql<number>`count(*) FILTER (WHERE ${chat.status} = 'archived')::int`.as(
          "archived"
        ),
    })
    .from(chat)
    .where(eq(chat.type, "support"));

  return NextResponse.json({
    chats,
    totalActive: totals?.active ?? 0,
    totalArchived: totals?.archived ?? 0,
  });
}
