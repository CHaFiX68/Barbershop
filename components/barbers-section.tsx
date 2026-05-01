import { getContent } from "@/lib/content";
import { getBarbers } from "@/lib/barbers";
import SectionHeading from "./section-heading";
import BarberCard from "./barber-card";

export default async function BarbersSection() {
  const [barbers, title] = await Promise.all([
    getBarbers(),
    getContent("barbers.title", "Наші барбери"),
  ]);

  if (barbers.length === 0) return null;

  return (
    <section
      id="barbers"
      className="py-12 md:py-16 lg:py-20 border-t border-[var(--color-line)]"
    >
      <div className="max-w-[1536px] mx-auto px-6">
        <SectionHeading
          eyebrow="Команда"
          title={title}
          number="01"
          titleContentKey="barbers.title"
          titleMaxLength={60}
        />

        <div className="mt-16 md:mt-20 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {barbers.map((barber) => (
            <BarberCard key={barber.id} barber={barber} />
          ))}
        </div>
      </div>
    </section>
  );
}
