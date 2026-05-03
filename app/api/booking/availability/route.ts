import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, eq, gte, lt } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { barberProfile, booking, service } from "@/lib/db/schema";
import { normalizeWeekSchedule } from "@/lib/schedule";
import {
  BOOKING_DAYS_AHEAD,
  generateDaySlots,
  isSlotAvailable,
  localToUTC,
  slotsForService,
  todayInTZ,
} from "@/lib/booking-slots";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const barberId = url.searchParams.get("barberId");
  const serviceId = url.searchParams.get("serviceId");
  const dateStr = url.searchParams.get("date");

  if (!barberId || !serviceId || !dateStr) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  const todayStr = todayInTZ();
  const today = new Date(todayStr + "T00:00:00Z");
  const reqDate = new Date(dateStr + "T00:00:00Z");
  const maxDate = new Date(today.getTime() + BOOKING_DAYS_AHEAD * 86_400_000);
  if (reqDate < today || reqDate > maxDate) {
    return NextResponse.json(
      { error: "Дата поза допустимим діапазоном" },
      { status: 400 }
    );
  }

  const [barber] = await db
    .select({
      userId: barberProfile.userId,
      schedule: barberProfile.schedule,
      isActive: barberProfile.isActive,
    })
    .from(barberProfile)
    .where(eq(barberProfile.userId, barberId));

  if (!barber || !barber.isActive) {
    return NextResponse.json({ error: "Barber not found" }, { status: 404 });
  }

  const schedule = normalizeWeekSchedule(barber.schedule);

  const [svc] = await db
    .select()
    .from(service)
    .where(and(eq(service.id, serviceId), eq(service.barberUserId, barberId)));

  if (!svc) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }
  if (svc.estimatedMinutes == null) {
    return NextResponse.json(
      { error: "Барбер не вказав тривалість послуги" },
      { status: 400 }
    );
  }

  const slotsNeeded = slotsForService(svc.estimatedMinutes);

  const dayStartUTC = localToUTC(dateStr, "00:00");
  const slots = generateDaySlots(dayStartUTC, schedule);

  if (slots.length === 0) {
    return NextResponse.json({ slots: [] });
  }

  const dayEndUTC = new Date(dayStartUTC.getTime() + 24 * 3_600_000);

  const existing = await db
    .select({
      startsAt: booking.startsAt,
      endsAt: booking.endsAt,
    })
    .from(booking)
    .where(
      and(
        eq(booking.barberUserId, barberId),
        eq(booking.status, "active"),
        gte(booking.startsAt, dayStartUTC),
        lt(booking.startsAt, dayEndUTC)
      )
    );

  const result = slots.map((s) => {
    const slotStart = localToUTC(dateStr, s.startTime);
    const available = isSlotAvailable(slotStart, slotsNeeded, schedule, existing);
    return { time: s.startTime, available };
  });

  return NextResponse.json({ slots: result });
}
