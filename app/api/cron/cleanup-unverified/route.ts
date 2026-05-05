import { NextResponse } from "next/server";
import { and, eq, lt, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { booking, user, verification } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Stale unverified accounts (older than 10 minutes, never verified)
    const userCutoff = new Date(Date.now() - 10 * 60 * 1000);
    const deletedUsers = await db
      .delete(user)
      .where(and(eq(user.emailVerified, false), lt(user.createdAt, userCutoff)))
      .returning({ id: user.id, email: user.email });

    // 2. Expired verification codes
    const deletedVerifications = await db
      .delete(verification)
      .where(lt(verification.expiresAt, new Date()))
      .returning({ id: verification.id });

    // 3. Old finished bookings (cancelled/completed) older than 14 days from
    // endsAt. Bookings with status='active' are never auto-deleted (manual
    // cancel only). Chats reference booking via FK with onDelete:set null,
    // so chat survives.
    const bookingCutoff = new Date(
      Date.now() - 14 * 24 * 60 * 60 * 1000
    );
    const deletedBookings = await db
      .delete(booking)
      .where(
        and(ne(booking.status, "active"), lt(booking.endsAt, bookingCutoff))
      )
      .returning({ id: booking.id });

    console.log(
      `[cron-cleanup] users=${deletedUsers.length} verifications=${deletedVerifications.length} bookings=${deletedBookings.length}`
    );

    return NextResponse.json({
      ok: true,
      deletedUsers: deletedUsers.length,
      deletedVerifications: deletedVerifications.length,
      deletedBookings: deletedBookings.length,
    });
  } catch (err) {
    console.error("GET /api/cron/cleanup-unverified error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
