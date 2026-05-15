import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, asc, eq, gt, lt, ne } from "drizzle-orm";
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

  const cols = {
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
  };

  const [active, pending, history] = await Promise.all([
    db
      .select(cols)
      .from(booking)
      .innerJoin(user, eq(user.id, booking.customerUserId))
      .where(
        and(
          eq(booking.barberUserId, barberUserId),
          eq(booking.status, "active"),
          gt(booking.endsAt, now)
        )
      )
      .orderBy(booking.startsAt),
    db
      .select(cols)
      .from(booking)
      .innerJoin(user, eq(user.id, booking.customerUserId))
      .where(
        and(
          eq(booking.barberUserId, barberUserId),
          eq(booking.status, "active"),
          lt(booking.endsAt, now)
        )
      )
      .orderBy(asc(booking.startsAt)),
    db
      .select(cols)
      .from(booking)
      .innerJoin(user, eq(user.id, booking.customerUserId))
      .where(
        and(
          eq(booking.barberUserId, barberUserId),
          ne(booking.status, "active")
        )
      )
      .orderBy(asc(booking.startsAt)),
  ]);

  const serialize = (r: (typeof active)[number]) => ({
    ...r,
    startsAt: r.startsAt.toISOString(),
    endsAt: r.endsAt.toISOString(),
  });

  return NextResponse.json({
    active: active.map(serialize),
    pending: pending.map(serialize),
    history: history.map(serialize),
  });
}
