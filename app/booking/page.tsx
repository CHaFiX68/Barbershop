import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getBarbers } from "@/lib/barbers";
import BookingFlow from "@/components/booking/booking-flow";
import BarberCannotBook from "@/components/booking/barber-cannot-book";

export const dynamic = "force-dynamic";
export const metadata = { title: "Запис — BARBER&CO" };

type SearchParams = Promise<{
  barber?: string;
  service?: string;
}>;

function buildCallbackUrl(sp: { barber?: string; service?: string }): string {
  const params = new URLSearchParams();
  if (sp.barber) params.set("barber", sp.barber);
  if (sp.service) params.set("service", sp.service);
  const qs = params.toString();
  return qs ? `/booking?${qs}` : "/booking";
}

export default async function BookingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    const callbackUrl = buildCallbackUrl(sp);
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  if (session.user.role === "barber") {
    return (
      <main className="min-h-screen bg-[var(--color-bg)]">
        <BarberCannotBook />
      </main>
    );
  }

  const barbers = await getBarbers();

  return (
    <main className="min-h-screen bg-[var(--color-bg)]">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <BookingFlow
          barbers={barbers}
          initialBarberId={sp.barber ?? null}
          initialServiceId={sp.service ?? null}
        />
      </div>
    </main>
  );
}
