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
      className="py-12 md:py-16 border-t border-[var(--color-line)]"
    >
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6">
        <SectionHeading
          eyebrow="Команда"
          title={title}
          number="01"
          titleContentKey="barbers.title"
          titleMaxLength={60}
        />

        {barbers.length > 0 ? (
          barbers.length === 1 ? (
            <div className="mt-6 md:mt-8 max-w-45 mx-auto pt-2 pb-2">
              <BarberCard barber={barbers[0]} />
            </div>
          ) : barbers.length <= 4 ? (
            <div className="mt-6 md:mt-8 max-w-200 mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2 pb-2">
              {barbers.map((barber) => (
                <BarberCard key={barber.id} barber={barber} />
              ))}
            </div>
          ) : (
            <div className="mt-6 md:mt-8 max-w-250 mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-2 pb-2">
              {barbers.map((barber) => (
                <BarberCard key={barber.id} barber={barber} />
              ))}
            </div>
          )
        ) : (
          <div className="mt-6 md:mt-8 text-center py-16 px-6">
            <p className="text-[var(--color-text-muted)] italic text-[15px] max-w-md mx-auto">
              Скоро тут будуть наші майстри. Слідкуйте за оновленнями.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
