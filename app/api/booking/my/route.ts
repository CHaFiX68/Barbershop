import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, asc, eq, gt, lt, ne, or } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { booking, user } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const customerId = session.user.id;

  const cols = {
    id: booking.id,
    barberUserId: booking.barberUserId,
    barberName: user.name,
    serviceName: booking.serviceName,
    servicePrice: booking.servicePrice,
    estimatedMinutes: booking.estimatedMinutes,
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    status: booking.status,
  };

  const [active, history] = await Promise.all([
    db
      .select(cols)
      .from(booking)
      .innerJoin(user, eq(user.id, booking.barberUserId))
      .where(
        and(
          eq(booking.customerUserId, customerId),
          eq(booking.status, "active"),
          gt(booking.endsAt, now)
        )
      )
      .orderBy(booking.startsAt),
    db
      .select(cols)
      .from(booking)
      .innerJoin(user, eq(user.id, booking.barberUserId))
      .where(
        and(
          eq(booking.customerUserId, customerId),
          or(
            ne(booking.status, "active"),
            lt(booking.endsAt, now)
          )
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
    history: history.map(serialize),
  });
}
