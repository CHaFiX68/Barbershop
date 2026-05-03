"use client";

import type { WeekSchedule } from "@/lib/db/schema";
import BarberPublicCard from "../barber-public-card";

type Service = { name: string; price: string };

type Props = {
  name: string;
  phone: string | null;
  bio: string | null;
  landingImage: string | null;
  schedule: WeekSchedule;
  services: Service[];
};

export default function BarberPreview({
  name,
  phone,
  bio,
  landingImage,
  schedule,
  services,
}: Props) {
  return (
    <BarberPublicCard
      name={name}
      phone={phone}
      bio={bio}
      landingImage={landingImage}
      services={services}
      schedule={schedule}
    />
  );
}
