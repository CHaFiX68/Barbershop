import crypto from "crypto";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, eq, gte, lt } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { barberProfile, booking, chat, service } from "@/lib/db/schema";
import { normalizeWeekSchedule } from "@/lib/schedule";
import {
  isSlotAvailable,
  localToUTC,
  slotsForService,
} from "@/lib/booking-slots";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  barberId: z.string().min(1),
  serviceId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
});

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customerUserId = session.user.id;
    const body = await request.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const { barberId, serviceId, date, time } = parsed.data;

    if (customerUserId === barberId) {
      return NextResponse.json(
        { error: "Не можна бронювати у себе" },
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
      .where(
        and(eq(service.id, serviceId), eq(service.barberUserId, barberId))
      );

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
    const startsAt = localToUTC(date, time);
    const endsAt = new Date(
      startsAt.getTime() + svc.estimatedMinutes * 60_000
    );

    const dayStart = localToUTC(date, "00:00");
    const dayEnd = new Date(dayStart.getTime() + 24 * 3_600_000);

    const existing = await db
      .select({ startsAt: booking.startsAt, endsAt: booking.endsAt })
      .from(booking)
      .where(
        and(
          eq(booking.barberUserId, barberId),
          eq(booking.status, "active"),
          gte(booking.startsAt, dayStart),
          lt(booking.startsAt, dayEnd)
        )
      );

    if (!isSlotAvailable(startsAt, slotsNeeded, schedule, existing)) {
      return NextResponse.json(
        { error: "Слот вже зайнятий, оновіть сторінку" },
        { status: 409 }
      );
    }

    const id = crypto.randomUUID();
    await db.insert(booking).values({
      id,
      customerUserId,
      barberUserId: barberId,
      serviceId,
      serviceName: svc.name,
      servicePrice: svc.price,
      estimatedMinutes: svc.estimatedMinutes,
      bufferMinutes: 0,
      startsAt,
      endsAt,
      status: "active",
    });

    // Auto-create booking chat (Neon HTTP has no transactions; sequential
    // insert. If this fails, booking exists without chat — chat creation
    // can be retried by a background job or first message attempt.)
    try {
      await db.insert(chat).values({
        id: crypto.randomUUID(),
        type: "booking",
        status: "active",
        bookingId: id,
        participantAUserId: customerUserId,
        participantBUserId: barberId,
      });
    } catch (chatErr) {
      console.error("[BOOKING-CREATE] chat insert failed (non-fatal):", chatErr);
    }

    return NextResponse.json({
      id,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      status: "active",
    });
  } catch (err) {
    console.error("[BOOKING-CREATE] error:", err);
    return NextResponse.json(
      { error: "Сталася помилка при збереженні. Спробуйте ще раз." },
      { status: 500 }
    );
  }
}
