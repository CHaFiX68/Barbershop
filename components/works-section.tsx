import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getWorkPhotos } from "@/lib/works";
import SectionHeading from "./section-heading";
import WorksCarousel from "./works/works-carousel";
import WorksControls from "./works/works-controls";

export default async function WorksSection() {
  const t = await getTranslations("sections.works");
  const [works, session] = await Promise.all([
    getWorkPhotos(),
    auth.api.getSession({ headers: await headers() }),
  ]);
  const title = t("title");
  const isAdmin = session?.user?.role === "admin";

  return (
    <section
      id="works"
      className="py-6 md:py-8 border-t border-[var(--color-line)] scroll-mt-16 md:scroll-mt-20"
    >
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center gap-4 relative">
            <SectionHeading
              eyebrow={t("eyebrow")}
              title={title}
              align="center"
              number="02"
            />
            {isAdmin && (
              <div className="absolute top-0 right-0">
                <WorksControls />
              </div>
            )}
          </div>
          <div className="mt-6 md:mt-8 w-[60%] sm:w-full max-w-[920px] mx-auto px-2">
            <WorksCarousel works={works} isAdmin={isAdmin} />
          </div>
        </div>
      </div>
    </section>
  );
}
