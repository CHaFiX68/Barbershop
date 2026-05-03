import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { booking, user } from "@/lib/db/schema";
import BookingCard from "@/components/bookings/booking-card";

export const dynamic = "force-dynamic";
export const metadata = { title: "Мої записи — BARBER&CO" };

export default async function MyBookingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/login?callbackUrl=/my-bookings");
  }

  const rows = await db
    .select({
      id: booking.id,
      barberName: user.name,
      serviceName: booking.serviceName,
      servicePrice: booking.servicePrice,
      startsAt: booking.startsAt,
      status: booking.status,
    })
    .from(booking)
    .innerJoin(user, eq(user.id, booking.barberUserId))
    .where(eq(booking.customerUserId, session.user.id))
    .orderBy(desc(booking.startsAt));

  const now = new Date();
  type Row = (typeof rows)[number];
  const upcoming: Row[] = [];
  const past: Row[] = [];
  for (const r of rows) {
    if (r.status === "active" && r.startsAt > now) {
      upcoming.push(r);
    } else {
      past.push(r);
    }
  }

  const isEmpty = rows.length === 0;

  return (
    <main className="min-h-screen bg-[var(--color-bg)]">
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h1
          className="font-display text-[var(--color-text)] mb-8"
          style={{ fontWeight: 600, fontSize: "clamp(28px, 5vw, 40px)" }}
        >
          Мої записи
        </h1>

        {isEmpty ? (
          <div className="text-center py-16 bg-[#FAF7F1] border border-[var(--color-line)] rounded-[12px]">
            <p
              className="text-[var(--color-text-muted)] italic mb-6"
              style={{ fontSize: "14px" }}
            >
              Поки записів немає.
            </p>
            <Link
              href="/booking"
              className="inline-flex items-center justify-center bg-[var(--color-text)] text-white px-6 py-2.5 rounded-[8px] text-[14px] hover:opacity-90 transition-opacity"
            >
              Записатись
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            <section className="flex flex-col gap-3">
              <h2
                className="text-[var(--color-text)]"
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  fontWeight: 500,
                }}
              >
                Майбутні
              </h2>
              {upcoming.length === 0 ? (
                <p className="italic text-[var(--color-text-muted)] text-[13px]">
                  Майбутніх записів немає.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {upcoming.map((r) => (
                    <BookingCard
                      key={r.id}
                      id={r.id}
                      barberName={r.barberName}
                      serviceName={r.serviceName}
                      servicePrice={r.servicePrice}
                      startsAt={r.startsAt.toISOString()}
                      status={r.status as "active" | "cancelled" | "completed"}
                      isUpcoming
                    />
                  ))}
                </div>
              )}
            </section>

            {past.length > 0 && (
              <section className="flex flex-col gap-3">
                <h2
                  className="text-[var(--color-text)]"
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    fontWeight: 500,
                  }}
                >
                  Минулі
                </h2>
                <div className="flex flex-col gap-3">
                  {past.map((r) => (
                    <BookingCard
                      key={r.id}
                      id={r.id}
                      barberName={r.barberName}
                      serviceName={r.serviceName}
                      servicePrice={r.servicePrice}
                      startsAt={r.startsAt.toISOString()}
                      status={r.status as "active" | "cancelled" | "completed"}
                      isUpcoming={false}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
