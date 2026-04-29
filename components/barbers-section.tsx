import { BARBERS } from "@/lib/data";
import SectionHeading from "./section-heading";
import BarberCard from "./barber-card";

export default function BarbersSection() {
  return (
    <section id="barbers" className="py-16 md:py-24 lg:py-32">
      <div className="max-w-[1536px] mx-auto px-6">
        <SectionHeading eyebrow="Команда" title="Наші барбери" />

        <div className="mt-16 md:mt-20 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {BARBERS.map((barber) => (
            <BarberCard key={barber.id} barber={barber} />
          ))}
        </div>
      </div>
    </section>
  );
}
