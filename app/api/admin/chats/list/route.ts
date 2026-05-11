import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { aliasedTable, and, asc, eq, ne, or, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { chat, message, user } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export type AdminChatListItem = {
  kind: "barber" | "support";
  chatId: string | null;
  partnerId: string;
  partnerName: string;
  partnerEmail: string;
  partnerAvatar: string | null;
  isPinned: boolean;
  lastMessageText: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
};

export async function GET() {
  try {
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

    const barbers = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      })
      .from(user)
      .where(eq(user.role, "barber"))
      .orderBy(asc(user.name));

    const directRows = await db
      .select({
        id: chat.id,
        partAUserId: chat.participantAUserId,
        partBUserId: chat.participantBUserId,
        lastMessageAt: chat.lastMessageAt,
        lastMessagePreview: chat.lastMessagePreview,
      })
      .from(chat)
      .where(
        and(
          eq(chat.type, "direct_admin"),
          eq(chat.status, "active"),
          or(
            eq(chat.participantAUserId, adminId),
            eq(chat.participantBUserId, adminId)
          )
        )
      );

    const directByBarber = new Map<string, (typeof directRows)[number]>();
    for (const c of directRows) {
      const barberId =
        c.partAUserId === adminId ? c.partBUserId : c.partAUserId;
      directByBarber.set(barberId, c);
    }

    const userA = aliasedTable(user, "user_a");
    const userB = aliasedTable(user, "user_b");
    const supportRows = await db
      .select({
        id: chat.id,
        partAUserId: chat.participantAUserId,
        partBUserId: chat.participantBUserId,
        partARole: userA.role,
        partBRole: userB.role,
        partAName: userA.name,
        partAEmail: userA.email,
        partAImage: userA.image,
        partBName: userB.name,
        partBEmail: userB.email,
        partBImage: userB.image,
        lastMessageAt: chat.lastMessageAt,
        lastMessagePreview: chat.lastMessagePreview,
      })
      .from(chat)
      .innerJoin(userA, eq(userA.id, chat.participantAUserId))
      .innerJoin(userB, eq(userB.id, chat.participantBUserId))
      .where(and(eq(chat.type, "support"), eq(chat.status, "active")));

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

    const barberItems: AdminChatListItem[] = barbers.map((b) => {
      const dc = directByBarber.get(b.id);
      return {
        kind: "barber",
        chatId: dc?.id ?? null,
        partnerId: b.id,
        partnerName: b.name,
        partnerEmail: b.email,
        partnerAvatar: b.image ?? null,
        isPinned: true,
        lastMessageText: dc?.lastMessagePreview ?? null,
        lastMessageAt: dc?.lastMessageAt ? dc.lastMessageAt.toISOString() : null,
        unreadCount: dc ? unreadMap.get(dc.id) ?? 0 : 0,
      };
    });

    const supportItems: AdminChatListItem[] = supportRows
      .map<AdminChatListItem | null>((r) => {
        if (r.partARole === "admin" && r.partBRole === "admin") return null;
        const aIsAdmin = r.partARole === "admin";
        const customerId = aIsAdmin ? r.partBUserId : r.partAUserId;
        const customerName = aIsAdmin ? r.partBName : r.partAName;
        const customerEmail = aIsAdmin ? r.partBEmail : r.partAEmail;
        const customerImage = aIsAdmin ? r.partBImage : r.partAImage;
        return {
          kind: "support",
          chatId: r.id,
          partnerId: customerId,
          partnerName: customerName,
          partnerEmail: customerEmail,
          partnerAvatar: customerImage ?? null,
          isPinned: false,
          lastMessageText: r.lastMessagePreview,
          lastMessageAt: r.lastMessageAt
            ? r.lastMessageAt.toISOString()
            : null,
          unreadCount: unreadMap.get(r.id) ?? 0,
        };
      })
      .filter((x): x is AdminChatListItem => x !== null)
      .sort((a, b) => {
        if (a.lastMessageAt && b.lastMessageAt) {
          return b.lastMessageAt.localeCompare(a.lastMessageAt);
        }
        if (a.lastMessageAt) return -1;
        if (b.lastMessageAt) return 1;
        return 0;
      });

    return NextResponse.json({ items: [...barberItems, ...supportItems] });
  } catch (err) {
    console.error("[admin/chats/list ERROR]", err);
    return NextResponse.json(
      {
        error: "Internal",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
