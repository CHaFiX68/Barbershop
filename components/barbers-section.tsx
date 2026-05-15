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
      className="pt-3 md:pt-4 pb-6 md:pb-8 border-t border-[var(--color-line)] scroll-mt-16 md:scroll-mt-20"
    >
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            eyebrow={t("eyebrow")}
            title={title}
            number="01"
            align="center"
          />

          {barbers.length > 0 ? (
            <div className={`mt-6 md:mt-8 flex flex-wrap justify-center gap-3 md:gap-4 pt-2 pb-2 mx-auto ${barbers.length === 2 || barbers.length === 4 ? "max-w-[576px]" : "max-w-[872px]"}`}>
              {barbers.map((barber) => (
                <BarberCard key={barber.id} barber={barber} />
              ))}
            </div>
          ) : (
            <div className="mt-6 md:mt-8 text-center py-16 px-6">
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
