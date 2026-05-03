import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { booking, user } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      id: booking.id,
      barberUserId: booking.barberUserId,
      barberName: user.name,
      serviceName: booking.serviceName,
      servicePrice: booking.servicePrice,
      estimatedMinutes: booking.estimatedMinutes,
      bufferMinutes: booking.bufferMinutes,
      startsAt: booking.startsAt,
      endsAt: booking.endsAt,
      status: booking.status,
    })
    .from(booking)
    .innerJoin(user, eq(user.id, booking.barberUserId))
    .where(eq(booking.customerUserId, session.user.id))
    .orderBy(desc(booking.startsAt));

  return NextResponse.json({
    bookings: rows.map((r) => ({
      ...r,
      startsAt: r.startsAt.toISOString(),
      endsAt: r.endsAt.toISOString(),
    })),
  });
}
