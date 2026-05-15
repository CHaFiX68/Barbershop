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

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function diffDays(fromStr: string, toStr: string): number {
  const [fy, fm, fd] = fromStr.split("-").map(Number);
  const [ty, tm, td] = toStr.split("-").map(Number);
  const a = Date.UTC(fy, fm - 1, fd);
  const b = Date.UTC(ty, tm - 1, td);
  return Math.round((b - a) / 86_400_000);
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const barberId = url.searchParams.get("barberId");
  const serviceId = url.searchParams.get("serviceId");
  const fromStr = url.searchParams.get("from");
  const toStr = url.searchParams.get("to");

  if (!barberId || !serviceId || !fromStr || !toStr) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fromStr) || !/^\d{4}-\d{2}-\d{2}$/.test(toStr)) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  const totalDays = diffDays(fromStr, toStr);
  if (totalDays < 0 || totalDays > BOOKING_DAYS_AHEAD + 7) {
    return NextResponse.json({ error: "Range too wide" }, { status: 400 });
  }

  const todayStr = todayInTZ();
  const maxStr = addDays(todayStr, BOOKING_DAYS_AHEAD);

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
      { error: "Service has no duration" },
      { status: 400 }
    );
  }

  const slotsNeeded = slotsForService(svc.estimatedMinutes);

  const rangeStartUTC = localToUTC(fromStr, "00:00");
  const rangeEndUTC = new Date(
    localToUTC(toStr, "00:00").getTime() + 24 * 3_600_000
  );

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
        gte(booking.startsAt, rangeStartUTC),
        lt(booking.startsAt, rangeEndUTC)
      )
    );

  const now = new Date();
  const availableDates: string[] = [];

  for (let i = 0; i <= totalDays; i++) {
    const dateStr = addDays(fromStr, i);
    if (dateStr < todayStr || dateStr > maxStr) continue;

    const dayStartUTC = localToUTC(dateStr, "00:00");
    const slots = generateDaySlots(dayStartUTC, schedule);
    if (slots.length === 0) continue;

    const dayEndUTC = new Date(dayStartUTC.getTime() + 24 * 3_600_000);
    const dayBookings = existing.filter(
      (b) => b.startsAt >= dayStartUTC && b.startsAt < dayEndUTC
    );

    let hasFree = false;
    for (const s of slots) {
      const slotStart = localToUTC(dateStr, s.startTime);
      if (isSlotAvailable(slotStart, slotsNeeded, schedule, dayBookings, now)) {
        hasFree = true;
        break;
      }
    }

    if (hasFree) availableDates.push(dateStr);
  }

  return NextResponse.json({ availableDates });
}
