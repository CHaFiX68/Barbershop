import type { BarberPublic } from "@/lib/barbers";
import BarberPublicCard from "./barber-public-card";

type Props = {
  barber: BarberPublic;
};

export default function BarberCard({ barber }: Props) {
  return (
    <BarberPublicCard
      name={barber.name}
      bio={barber.bio}
      landingImage={barber.landingImage}
      initials={barber.initials}
      services={barber.services}
      schedule={barber.schedule}
      ctaHref={`/booking?barber=${barber.id}`}
    />
  );
}
