import { getContent } from "@/lib/content";
import { getBarbers } from "@/lib/barbers";
import SectionHeading from "./section-heading";
import BarberCard from "./barber-card";

export default async function BarbersSection() {
  const [barbers, title] = await Promise.all([
    getBarbers(),
    getContent("barbers.title", "Наші барбери"),
  ]);

  return (
    <section
      id="barbers"
      className="pt-6 md:pt-8 pb-12 md:pb-16 border-t border-[var(--color-line)] scroll-mt-16 md:scroll-mt-20"
    >
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6">
        <SectionHeading
          eyebrow="Команда"
          title={title}
          number="01"
          titleContentKey="barbers.title"
          titleMaxLength={60}
          showTitle={false}
        />

        {barbers.length > 0 ? (
          <div className="mt-10 md:mt-12 flex flex-wrap justify-center gap-3 md:gap-4 pt-2 pb-2 max-w-7xl mx-auto">
            {barbers.map((barber) => (
              <BarberCard key={barber.id} barber={barber} />
            ))}
          </div>
        ) : (
          <div className="mt-10 md:mt-12 text-center py-16 px-6">
            <p className="text-[var(--color-text-muted)] italic text-[15px] max-w-md mx-auto">
              Скоро тут будуть наші майстри. Слідкуйте за оновленнями.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
