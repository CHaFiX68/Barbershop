"use client";

import type { WeekSchedule } from "@/lib/db/schema";
import BarberPublicCard from "../barber-public-card";

type Service = { name: string; price: string };

type Props = {
  name: string;
  bio: string | null;
  landingImage: string | null;
  schedule: WeekSchedule;
  services: Service[];
};

export default function BarberPreview({
  name,
  bio,
  landingImage,
  schedule,
  services,
}: Props) {
  return (
    <BarberPublicCard
      name={name}
      bio={bio}
      landingImage={landingImage}
      services={services}
      schedule={schedule}
    />
  );
}
