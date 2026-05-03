import { NextResponse } from "next/server";
import { and, eq, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { booking, chat } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const expected = process.env.CRON_SECRET;
  if (!expected || token !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const completedBookings = await db
    .select({ id: booking.id })
    .from(booking)
    .where(and(eq(booking.status, "active"), lt(booking.endsAt, now)));

  let bookingsCompleted = 0;
  let chatsArchived = 0;

  for (const b of completedBookings) {
    await db
      .update(booking)
      .set({ status: "completed" })
      .where(and(eq(booking.id, b.id), eq(booking.status, "active")));
    bookingsCompleted++;

    const archived = await db
      .update(chat)
      .set({ status: "archived", archivedAt: now })
      .where(and(eq(chat.bookingId, b.id), eq(chat.status, "active")));
    void archived;
    chatsArchived++;
  }

  return NextResponse.json({
    ok: true,
    bookingsCompleted,
    chatsArchived,
    serverTime: now.toISOString(),
  });
}
