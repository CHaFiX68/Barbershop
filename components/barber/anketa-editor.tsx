"use client";

import { useMemo, useState } from "react";
import type { WeekSchedule } from "@/lib/db/schema";
import { DEFAULT_SCHEDULE } from "@/lib/schedule";
import AnketaCardEditable, {
  type EditableServiceFull,
} from "./anketa-card-editable";

type InitialService = {
  id: string;
  name: string;
  price: string;
  estimatedMinutes?: number | null;
};

type Props = {
  userName: string;
  initials: string;
  initialPhone: string;
  initialBio: string;
  initialLandingImage: string | null;
  initialIsActive: boolean;
  initialServices: InitialService[];
  initialSchedule: WeekSchedule;
  initialHasPending?: boolean;
  onPendingChange?: (v: boolean) => void;
};

type InitialSnapshot = {
  phone: string;
  bio: string;
  isActive: boolean;
  landingImage: string | null;
  services: {
    name: string;
    price: string;
    estimatedMinutes: number | null;
  }[];
  schedule: WeekSchedule;
};

export default function AnketaEditor({
  userName,
  initials,
  initialPhone,
  initialBio,
  initialLandingImage,
  initialIsActive,
  initialServices,
  initialSchedule,
  onPendingChange,
}: Props) {
  const [phone, setPhone] = useState(initialPhone);
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
      estimatedMinutes: s.estimatedMinutes ?? null,
    }))
  );
  const [schedule, setSchedule] = useState<WeekSchedule>(initialSchedule);

  const [snapshot, setSnapshot] = useState<InitialSnapshot>({
    phone: initialPhone,
    bio: initialBio,
    isActive: initialIsActive,
    landingImage: initialLandingImage,
    services: initialServices.map((s) => ({
      name: s.name,
      price: s.price,
      estimatedMinutes: s.estimatedMinutes ?? null,
    })),
    schedule: initialSchedule,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const isDirty = useMemo(() => {
    if (phone !== snapshot.phone) return true;
    if (bio !== snapshot.bio) return true;
    if (isActive !== snapshot.isActive) return true;
    if (landingImage !== snapshot.landingImage) return true;
    if (services.length !== snapshot.services.length) return true;
    for (let i = 0; i < services.length; i++) {
      if (services[i].name !== snapshot.services[i].name) return true;
      if (services[i].price !== snapshot.services[i].price) return true;
      if (
        services[i].estimatedMinutes !== snapshot.services[i].estimatedMinutes
      )
        return true;
    }
    if (JSON.stringify(schedule) !== JSON.stringify(snapshot.schedule)) {
      return true;
    }
    return false;
  }, [phone, bio, isActive, landingImage, services, schedule, snapshot]);

  const handleSubmit = async () => {
    if (!isDirty || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      const trimmedPhone = phone.trim();
      const trimmedBio = bio.trim();
      const trimmedServices = services.map((s) => ({
        name: s.name.trim(),
        price: s.price.trim(),
        estimatedMinutes: s.estimatedMinutes,
      }));
      const submitSchedule = schedule ?? DEFAULT_SCHEDULE;
      const res = await fetch("/api/barber/anketa", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: trimmedPhone || null,
          bio: trimmedBio || null,
          landingImage,
          isActive,
          schedule: submitSchedule,
          services: trimmedServices,
        }),
      });
      if (!res.ok) {
        let message = "Submit failed";
        try {
          const errBody = (await res.json()) as { error?: string };
          if (errBody?.error) message = errBody.error;
        } catch {}
        throw new Error(message);
      }
      const data = (await res.json()) as {
        ok?: boolean;
        status?: "approved" | "pending";
      };
      setSubmitSuccess(true);
      setSnapshot({
        phone,
        bio,
        isActive,
        landingImage,
        services: services.map((s) => ({
          name: s.name,
          price: s.price,
          estimatedMinutes: s.estimatedMinutes,
        })),
        schedule,
      });
      if (data.status === "pending") {
        onPendingChange?.(true);
      }
      setTimeout(() => setSubmitSuccess(false), 2000);
    } catch (err) {
      console.log("[ANKETA-EDITOR] PUT failed:", err);
      const fallback = "Не вдалося зберегти. Спробуйте ще раз.";
      setSubmitError(err instanceof Error && err.message ? err.message : fallback);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnketaCardEditable
      userName={userName}
      initials={initials}
      phone={phone}
      onPhoneChange={setPhone}
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
