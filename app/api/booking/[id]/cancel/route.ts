import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { booking, chat } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [row] = await db.select().from(booking).where(eq(booking.id, id));
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (row.customerUserId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (row.status !== "active") {
    return NextResponse.json(
      { error: "Booking already cancelled" },
      { status: 400 }
    );
  }
  if (row.startsAt <= new Date()) {
    return NextResponse.json(
      { error: "Cannot cancel past bookings" },
      { status: 400 }
    );
  }

  await db
    .update(booking)
    .set({ status: "cancelled", cancelledAt: new Date() })
    .where(eq(booking.id, id));

  // Archive associated booking chat (best-effort, non-fatal)
  try {
    await db
      .update(chat)
      .set({ status: "archived", archivedAt: new Date() })
      .where(and(eq(chat.bookingId, id), eq(chat.status, "active")));
  } catch (chatErr) {
    console.error("[BOOKING-CANCEL] chat archive failed:", chatErr);
  }

  return NextResponse.json({ id, status: "cancelled" });
}
