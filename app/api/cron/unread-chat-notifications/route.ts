import { NextResponse } from "next/server";
import { and, desc, eq, lt, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { chat, message, user } from "@/lib/db/schema";
import { sendUnreadChatNotification } from "@/lib/email";

export const dynamic = "force-dynamic";

const UNREAD_THRESHOLD_MIN = 5;

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const cutoff = new Date(now.getTime() - UNREAD_THRESHOLD_MIN * 60_000);
    const stats = { sent: 0, failed: 0, chatsProcessed: 0, chatsTouched: 0 };

    const chats = await db
      .select({
        id: chat.id,
        participantAUserId: chat.participantAUserId,
        participantBUserId: chat.participantBUserId,
        lastNotifiedAt: chat.lastNotifiedAt,
      })
      .from(chat)
      .where(ne(chat.status, "archived"));

    for (const c of chats) {
      stats.chatsProcessed += 1;

      // Newest qualifying unread message for participant A:
      // sender = B, readByA = false, createdAt < cutoff.
      const [unreadForA] = await db
        .select({
          createdAt: message.createdAt,
        })
        .from(message)
        .where(
          and(
            eq(message.chatId, c.id),
            eq(message.senderUserId, c.participantBUserId),
            eq(message.readByA, false),
            lt(message.createdAt, cutoff)
          )
        )
        .orderBy(desc(message.createdAt))
        .limit(1);

      // Newest qualifying unread message for participant B:
      const [unreadForB] = await db
        .select({
          createdAt: message.createdAt,
        })
        .from(message)
        .where(
          and(
            eq(message.chatId, c.id),
            eq(message.senderUserId, c.participantAUserId),
            eq(message.readByB, false),
            lt(message.createdAt, cutoff)
          )
        )
        .orderBy(desc(message.createdAt))
        .limit(1);

      const notifyA =
        unreadForA &&
        (c.lastNotifiedAt === null ||
          unreadForA.createdAt > c.lastNotifiedAt);
      const notifyB =
        unreadForB &&
        (c.lastNotifiedAt === null ||
          unreadForB.createdAt > c.lastNotifiedAt);

      if (!notifyA && !notifyB) continue;

      if (notifyA) {
        try {
          const [u] = await db
            .select({ email: user.email, name: user.name })
            .from(user)
            .where(eq(user.id, c.participantAUserId));
          if (u?.email) {
            await sendUnreadChatNotification({
              to: u.email,
              recipientName: u.name ?? "",
            });
            stats.sent += 1;
          }
        } catch (err) {
          console.error("[unread-chat-notifications] A error:", err);
          stats.failed += 1;
        }
      }

      if (notifyB) {
        try {
          const [u] = await db
            .select({ email: user.email, name: user.name })
            .from(user)
            .where(eq(user.id, c.participantBUserId));
          if (u?.email) {
            await sendUnreadChatNotification({
              to: u.email,
              recipientName: u.name ?? "",
            });
            stats.sent += 1;
          }
        } catch (err) {
          console.error("[unread-chat-notifications] B error:", err);
          stats.failed += 1;
        }
      }

      await db
        .update(chat)
        .set({ lastNotifiedAt: now })
        .where(eq(chat.id, c.id));
      stats.chatsTouched += 1;
    }

    return NextResponse.json({ ok: true, ...stats });
  } catch (err) {
    console.error("[unread-chat-notifications] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
