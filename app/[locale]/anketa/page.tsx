import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { getBarberSelfProfile } from "@/lib/barber-self";
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

  const data = await getBarberSelfProfile(session.user.id);

  if (!data) {
    redirect("/");
  }

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
          initialPhone={data.profile.phone}
          initialBio={data.profile.bio}
          initialLandingImage={data.profile.landingImage}
          initialIsActive={data.profile.isActive}
          initialServices={data.services}
          initialSchedule={data.profile.schedule}
          initialHasPending={data.hasPendingChanges}
        />
      </div>
    </div>
  );
}
