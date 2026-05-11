import { NextResponse } from "next/server";
import { and, eq, gte, isNull, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { booking, user } from "@/lib/db/schema";
import {
  sendBookingReminder24h,
  sendBookingReminder1h,
} from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const stats = { sent24h: 0, sent1h: 0, failed24h: 0, failed1h: 0 };

    // === 24h reminder window: 23h45m – 24h15m від now ===
    const win24Start = new Date(
      now.getTime() + 23 * 60 * 60 * 1000 + 45 * 60 * 1000
    );
    const win24End = new Date(
      now.getTime() + 24 * 60 * 60 * 1000 + 15 * 60 * 1000
    );

    const bookings24h = await db
      .select()
      .from(booking)
      .where(
        and(
          eq(booking.status, "active"),
          isNull(booking.reminder24hSentAt),
          gte(booking.startsAt, win24Start),
          lt(booking.startsAt, win24End)
        )
      );

    for (const b of bookings24h) {
      try {
        const [customer] = await db
          .select({ email: user.email, name: user.name })
          .from(user)
          .where(eq(user.id, b.customerUserId));

        const [barber] = await db
          .select({ name: user.name })
          .from(user)
          .where(eq(user.id, b.barberUserId));

        if (!customer?.email) continue;

        const locale = (b.locale === "sv" ? "sv" : "en") as "en" | "sv";
        const dateTimeFormatted = new Intl.DateTimeFormat(locale, {
          weekday: "long",
          day: "numeric",
          month: "long",
          hour: "2-digit",
          minute: "2-digit",
        }).format(b.startsAt);

        await sendBookingReminder24h(
          customer.email,
          customer.name || "",
          barber?.name || "",
          b.serviceName,
          dateTimeFormatted,
          locale
        );

        await db
          .update(booking)
          .set({ reminder24hSentAt: new Date() })
          .where(eq(booking.id, b.id));

        stats.sent24h++;
      } catch (e) {
        console.error(`[cron/reminders] 24h failed for booking ${b.id}:`, e);
        stats.failed24h++;
      }
    }

    // === 1h reminder window: 45m – 1h15m від now ===
    const win1Start = new Date(now.getTime() + 45 * 60 * 1000);
    const win1End = new Date(
      now.getTime() + 60 * 60 * 1000 + 15 * 60 * 1000
    );

    const bookings1h = await db
      .select()
      .from(booking)
      .where(
        and(
          eq(booking.status, "active"),
          isNull(booking.reminder1hSentAt),
          gte(booking.startsAt, win1Start),
          lt(booking.startsAt, win1End)
        )
      );

    for (const b of bookings1h) {
      try {
        const [customer] = await db
          .select({ email: user.email, name: user.name })
          .from(user)
          .where(eq(user.id, b.customerUserId));

        const [barber] = await db
          .select({ name: user.name })
          .from(user)
          .where(eq(user.id, b.barberUserId));

        if (!customer?.email) continue;

        const locale = (b.locale === "sv" ? "sv" : "en") as "en" | "sv";
        const timeFormatted = new Intl.DateTimeFormat(locale, {
          hour: "2-digit",
          minute: "2-digit",
        }).format(b.startsAt);

        await sendBookingReminder1h(
          customer.email,
          customer.name || "",
          barber?.name || "",
          b.serviceName,
          timeFormatted,
          locale
        );

        await db
          .update(booking)
          .set({ reminder1hSentAt: new Date() })
          .where(eq(booking.id, b.id));

        stats.sent1h++;
      } catch (e) {
        console.error(`[cron/reminders] 1h failed for booking ${b.id}:`, e);
        stats.failed1h++;
      }
    }

    return NextResponse.json({ ok: true, ...stats });
  } catch (err) {
    console.error("[cron/booking-reminders] error:", err);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}
