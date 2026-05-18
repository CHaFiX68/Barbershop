import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { barberProfile, service, user } from "@/lib/db/schema";
import { normalizeWeekSchedule } from "@/lib/schedule";
import AnketaEditor from "@/components/barber/anketa-editor";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "anketa" });
  return { title: t("metaTitle") };
}

function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default async function AnketaPage() {
  const t = await getTranslations("anketa");
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
    <div className="max-w-[1536px] mx-auto px-4 sm:px-6 py-8 sm:py-16">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors mb-6"
        >
          <span aria-hidden="true">←</span>
          <span>{t("back")}</span>
        </Link>

        <h1
          className="font-display mb-2"
          style={{ fontWeight: 600, fontSize: "28px" }}
        >
          {t("pageHeading")}
        </h1>
        <p
          className="mb-8 text-[var(--color-text-muted)]"
          style={{ fontSize: "13px" }}
        >
          {t("editHint")}
        </p>

        <AnketaEditor
          userName={currentUser.name}
          initials={computeInitials(currentUser.name)}
          initialPhone={profile.phone ?? ""}
          initialBio={profile.bio ?? ""}
          initialLandingImage={profile.landingImage}
          initialIsActive={profile.isActive}
          initialServices={services.map((s) => ({
            id: s.id,
            name: s.name,
            price: s.price,
            estimatedMinutes: s.estimatedMinutes,
          }))}
          initialSchedule={normalizeWeekSchedule(profile.schedule)}
        />
      </div>
    </div>
  );
}
