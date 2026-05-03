import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { aliasedTable, and, desc, eq, ne, or, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { chat, message, user } from "@/lib/db/schema";
import SupportDashboard from "@/components/admin/support-dashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Підтримка — BARBER&CO" };

export default async function AdminSupportPage() {
  // Layout already enforces auth + admin role; double-check session for adminId
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login?callbackUrl=/admin/support");

  const adminId = session.user.id;
  const userA = aliasedTable(user, "user_a");
  const userB = aliasedTable(user, "user_b");

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
    .where(eq(chat.type, "support"))
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
      status: r.status as "active" | "archived",
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

  const totalActive = chats.filter((c) => c.status === "active").length;
  const totalArchived = chats.filter((c) => c.status === "archived").length;

  return (
    <SupportDashboard
      initial={{ chats, totalActive, totalArchived }}
    />
  );
}
