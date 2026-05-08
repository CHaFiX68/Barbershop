import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { aliasedTable, desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { booking, user } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [currentUser] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id));
  if (!currentUser || currentUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const customer = aliasedTable(user, "customer_user");
  const barber = aliasedTable(user, "barber_user");

  const rows = await db
    .select({
      id: booking.id,
      serviceName: booking.serviceName,
      servicePrice: booking.servicePrice,
      startsAt: booking.startsAt,
      endsAt: booking.endsAt,
      status: booking.status,
      customerUserId: booking.customerUserId,
      customerName: customer.name,
      customerEmail: customer.email,
      barberUserId: booking.barberUserId,
      barberName: barber.name,
      barberEmail: barber.email,
    })
    .from(booking)
    .innerJoin(customer, eq(customer.id, booking.customerUserId))
    .innerJoin(barber, eq(barber.id, booking.barberUserId))
    .orderBy(desc(booking.startsAt));

  return NextResponse.json({
    bookings: rows.map((r) => ({
      ...r,
      startsAt: r.startsAt.toISOString(),
      endsAt: r.endsAt.toISOString(),
    })),
  });
}
