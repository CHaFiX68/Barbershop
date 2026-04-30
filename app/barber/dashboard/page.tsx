import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { barberProfile, service, user } from "@/lib/db/schema";
import EditableBarberCard from "@/components/barber/editable-barber-card";

export const dynamic = "force-dynamic";
export const metadata = { title: "Панель барбера — BARBER&CO" };

function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default async function BarberDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/?auth=login");

  const [currentUser] = await db
    .select()
    .from(user)
    .where(eq(user.id, session.user.id));

  if (
    !currentUser ||
    (currentUser.role !== "barber" && currentUser.role !== "admin")
  ) {
    redirect("/");
  }

  const [profile] = await db
    .select()
    .from(barberProfile)
    .where(eq(barberProfile.userId, session.user.id));

  if (!profile) {
    redirect("/");
  }

  const services = await db
    .select()
    .from(service)
    .where(eq(service.barberUserId, session.user.id))
    .orderBy(asc(service.orderIndex));

  return (
    <div className="max-w-[1536px] mx-auto px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <h1
          className="font-display mb-2"
          style={{ fontWeight: 600, fontSize: "28px" }}
        >
          Моя анкета
        </h1>
        <p
          className="mb-8 text-[var(--color-text-muted)]"
          style={{ fontSize: "13px" }}
        >
          Клікни на будь-яке поле щоб редагувати. Збереження автоматичне.
        </p>

        <div className="max-w-2xl">
          <EditableBarberCard
            userName={currentUser.name}
            initials={computeInitials(currentUser.name)}
            initialBio={profile.bio ?? ""}
            initialLandingImage={profile.landingImage}
            initialIsActive={profile.isActive}
            initialServices={services.map((s) => ({
              id: s.id,
              name: s.name,
              price: s.price,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
