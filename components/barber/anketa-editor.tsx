"use client";

import { useMemo, useState } from "react";
import type { WeekSchedule } from "@/lib/db/schema";
import { DEFAULT_SCHEDULE } from "@/lib/schedule";
import AnketaCardEditable, {
  type EditableServiceFull,
} from "./anketa-card-editable";

type InitialService = { id: string; name: string; price: string };

type Props = {
  userName: string;
  initials: string;
  initialBio: string;
  initialLandingImage: string | null;
  initialIsActive: boolean;
  initialServices: InitialService[];
  initialSchedule: WeekSchedule;
  initialHasPending?: boolean;
  onPendingChange?: (v: boolean) => void;
};

type InitialSnapshot = {
  bio: string;
  isActive: boolean;
  landingImage: string | null;
  services: { name: string; price: string }[];
  schedule: WeekSchedule;
};

export default function AnketaEditor({
  userName,
  initials,
  initialBio,
  initialLandingImage,
  initialIsActive,
  initialServices,
  initialSchedule,
  onPendingChange,
}: Props) {
  const [bio, setBio] = useState(initialBio);
  const [isActive, setIsActive] = useState(initialIsActive);
  const [landingImage, setLandingImage] = useState<string | null>(
    initialLandingImage
  );
  const [services, setServices] = useState<EditableServiceFull[]>(
    initialServices.map((s) => ({
      id: s.id,
      name: s.name,
      price: s.price,
      estimatedMinutes: null,
    }))
  );
  const [schedule, setSchedule] = useState<WeekSchedule>(initialSchedule);

  const [snapshot, setSnapshot] = useState<InitialSnapshot>({
    bio: initialBio,
    isActive: initialIsActive,
    landingImage: initialLandingImage,
    services: initialServices.map((s) => ({ name: s.name, price: s.price })),
    schedule: initialSchedule,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const isDirty = useMemo(() => {
    if (bio !== snapshot.bio) return true;
    if (isActive !== snapshot.isActive) return true;
    if (landingImage !== snapshot.landingImage) return true;
    if (services.length !== snapshot.services.length) return true;
    for (let i = 0; i < services.length; i++) {
      if (services[i].name !== snapshot.services[i].name) return true;
      if (services[i].price !== snapshot.services[i].price) return true;
    }
    if (JSON.stringify(schedule) !== JSON.stringify(snapshot.schedule)) {
      return true;
    }
    return false;
  }, [bio, isActive, landingImage, services, schedule, snapshot]);

  const handleSubmit = async () => {
    if (!isDirty || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      const trimmedBio = bio.trim();
      const trimmedServices = services.map((s) => ({
        name: s.name.trim(),
        price: s.price.trim(),
      }));
      const submitSchedule = schedule ?? DEFAULT_SCHEDULE;
      const res = await fetch("/api/barber/anketa", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: trimmedBio || null,
          landingImage,
          isActive,
          schedule: submitSchedule,
          services: trimmedServices,
        }),
      });
      if (!res.ok) throw new Error("Submit failed");
      const data = (await res.json()) as {
        ok?: boolean;
        status?: "approved" | "pending";
      };
      setSubmitSuccess(true);
      setSnapshot({
        bio,
        isActive,
        landingImage,
        services: services.map((s) => ({ name: s.name, price: s.price })),
        schedule,
      });
      if (data.status === "pending") {
        onPendingChange?.(true);
      }
      setTimeout(() => setSubmitSuccess(false), 2000);
    } catch (err) {
      console.log("[ANKETA-EDITOR] PUT failed:", err);
      setSubmitError("Не вдалося зберегти. Спробуйте ще раз.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnketaCardEditable
      userName={userName}
      initials={initials}
      bio={bio}
      onBioChange={setBio}
      landingImage={landingImage}
      onLandingImageChange={setLandingImage}
      isActive={isActive}
      onIsActiveChange={setIsActive}
      services={services}
      onServicesChange={setServices}
      schedule={schedule}
      onScheduleChange={setSchedule}
      isDirty={isDirty}
      isSubmitting={isSubmitting}
      submitError={submitError}
      submitSuccess={submitSuccess}
      onSubmit={handleSubmit}
    />
  );
}
