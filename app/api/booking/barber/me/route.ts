import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, desc, eq, gt } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { booking, user } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "barber") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const barberUserId = session.user.id;

  const [upcoming, history] = await Promise.all([
    db
      .select({
        id: booking.id,
        customerUserId: booking.customerUserId,
        customerName: user.name,
        customerEmail: user.email,
        serviceName: booking.serviceName,
        servicePrice: booking.servicePrice,
        estimatedMinutes: booking.estimatedMinutes,
        startsAt: booking.startsAt,
        endsAt: booking.endsAt,
        status: booking.status,
      })
      .from(booking)
      .innerJoin(user, eq(user.id, booking.customerUserId))
      .where(
        and(
          eq(booking.barberUserId, barberUserId),
          eq(booking.status, "active"),
          gt(booking.startsAt, now)
        )
      )
      .orderBy(booking.startsAt),
    db
      .select({
        id: booking.id,
        customerUserId: booking.customerUserId,
        customerName: user.name,
        customerEmail: user.email,
        serviceName: booking.serviceName,
        servicePrice: booking.servicePrice,
        estimatedMinutes: booking.estimatedMinutes,
        startsAt: booking.startsAt,
        endsAt: booking.endsAt,
        status: booking.status,
      })
      .from(booking)
      .innerJoin(user, eq(user.id, booking.customerUserId))
      .where(eq(booking.barberUserId, barberUserId))
      .orderBy(desc(booking.startsAt)),
  ]);

  const upcomingIds = new Set(upcoming.map((r) => r.id));
  const historyFiltered = history.filter((r) => !upcomingIds.has(r.id));

  const serialize = (r: (typeof upcoming)[number]) => ({
    ...r,
    startsAt: r.startsAt.toISOString(),
    endsAt: r.endsAt.toISOString(),
  });

  return NextResponse.json({
    upcoming: upcoming.map(serialize),
    history: historyFiltered.map(serialize),
  });
}
