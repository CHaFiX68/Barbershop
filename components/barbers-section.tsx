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
      className="py-12 md:py-16 lg:py-20 border-t border-[var(--color-line)]"
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
            <div className="mt-16 md:mt-20 max-w-[640px] mx-auto">
              <BarberCard barber={barbers[0]} />
            </div>
          ) : (
            <div className="mt-16 md:mt-20 max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
              {barbers.map((barber) => (
                <BarberCard key={barber.id} barber={barber} />
              ))}
            </div>
          )
        ) : (
          <div className="mt-16 md:mt-20 text-center py-16 px-6">
            <p className="text-[var(--color-text-muted)] italic text-[15px] max-w-md mx-auto">
              Скоро тут будуть наші майстри. Слідкуйте за оновленнями.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
