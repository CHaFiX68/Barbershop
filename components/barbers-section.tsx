import { getTranslations } from "next-intl/server";
import { getBarbers } from "@/lib/barbers";
import SectionHeading from "./section-heading";
import BarberCard from "./barber-card";

export default async function BarbersSection() {
  const t = await getTranslations("sections.barbers");
  const barbers = await getBarbers();
  const title = t("title");

  return (
    <section
      id="barbers"
      className="pt-6 md:pt-8 pb-12 md:pb-16 border-t border-[var(--color-line)] scroll-mt-16 md:scroll-mt-20"
    >
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6">
        <div className="max-w-[1400px] mx-auto">
          <SectionHeading
            eyebrow={t("eyebrow")}
            title={title}
            number="01"
            align="center"
          />

          {barbers.length > 0 ? (
            <div className="mt-12 md:mt-16 flex flex-wrap justify-center gap-3 md:gap-4 pt-2 pb-2">
              {barbers.map((barber) => (
                <BarberCard key={barber.id} barber={barber} />
              ))}
            </div>
          ) : (
            <div className="mt-12 md:mt-16 text-center py-16 px-6">
              <p className="text-[var(--color-text-muted)] italic text-[15px] max-w-md mx-auto">
                {t("empty")}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
