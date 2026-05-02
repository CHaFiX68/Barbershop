"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { WeekSchedule } from "@/lib/db/schema";
import { DEFAULT_SCHEDULE } from "@/lib/schedule";
import ActiveToggle from "./active-toggle";
import EditableBio from "./editable-bio";
import EditableServiceRow, {
  type EditableService,
} from "./editable-service-row";
import LandingImageEditorModal from "./landing-image-editor";

const TOTAL_ROWS = 7;

type Props = {
  userName: string;
  initials: string;
  initialBio: string;
  initialLandingImage: string | null;
  initialIsActive: boolean;
  initialServices: EditableService[];
  initialHasPending?: boolean;
  onPendingChange?: (v: boolean) => void;
  schedule?: WeekSchedule;
  initialSchedule?: WeekSchedule;
  onScheduleSnapshotReset?: () => void;
};

type InitialSnapshot = {
  bio: string;
  isActive: boolean;
  landingImage: string | null;
  services: { name: string; price: string }[];
};

export default function EditableBarberCard({
  userName,
  initials,
  initialBio,
  initialLandingImage,
  initialIsActive,
  initialServices,
  initialHasPending,
  onPendingChange,
  schedule,
  initialSchedule,
  onScheduleSnapshotReset,
}: Props) {
  const [bio, setBio] = useState(initialBio);
  const [isActive, setIsActive] = useState(initialIsActive);
  const [landingImage, setLandingImage] = useState<string | null>(
    initialLandingImage
  );
  const [services, setServices] = useState<EditableService[]>(initialServices);
  const [isAvatarEditorOpen, setIsAvatarEditorOpen] = useState(false);

  const [initial, setInitial] = useState<InitialSnapshot>({
    bio: initialBio,
    isActive: initialIsActive,
    landingImage: initialLandingImage,
    services: initialServices.map((s) => ({ name: s.name, price: s.price })),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [hasPending, setHasPending] = useState<boolean>(
    initialHasPending ?? false
  );
  void hasPending;

  const isDirty = useMemo(() => {
    if (bio !== initial.bio) return true;
    if (isActive !== initial.isActive) return true;
    if (landingImage !== initial.landingImage) return true;
    if (services.length !== initial.services.length) return true;
    for (let i = 0; i < services.length; i++) {
      if (services[i].name !== initial.services[i].name) return true;
      if (services[i].price !== initial.services[i].price) return true;
    }
    if (
      schedule &&
      initialSchedule &&
      JSON.stringify(schedule) !== JSON.stringify(initialSchedule)
    ) {
      return true;
    }
    return false;
  }, [bio, isActive, landingImage, services, schedule, initialSchedule, initial]);

  const placeholderCount = Math.max(0, TOTAL_ROWS - services.length);

  const toggleActive = () => {
    setIsActive((v) => !v);
  };

  const handleLandingImageUploaded = (url: string) => {
    setLandingImage(url);
    setIsAvatarEditorOpen(false);
  };

  const addService = () => {
    if (services.length >= TOTAL_ROWS) return;
    setServices((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: "Нова послуга",
        price: "0",
      },
    ]);
  };

  const updateService = (
    id: string,
    field: "name" | "price",
    value: string
  ) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const deleteService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

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
      console.log("[EDITABLE-CARD] submitting:", {
        bio: trimmedBio || null,
        isActive,
        landingImage,
        schedule: submitSchedule,
        services: trimmedServices,
      });
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
      console.log("[EDITABLE-CARD] PUT response:", data);
      setSubmitSuccess(true);
      setInitial({
        bio,
        isActive,
        landingImage,
        services: services.map((s) => ({ name: s.name, price: s.price })),
      });
      onScheduleSnapshotReset?.();
      if (data.status === "pending") {
        setHasPending(true);
        onPendingChange?.(true);
      }
      setTimeout(() => setSubmitSuccess(false), 2000);
    } catch (err) {
      console.log("[EDITABLE-CARD] PUT failed:", err);
      setSubmitError("Не вдалося зберегти. Спробуйте ще раз.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <article className="relative bg-white border border-[var(--color-line)] rounded-[16px] p-5 sm:p-7 grid grid-cols-12 gap-5 sm:gap-7">
      <ActiveToggle
        isActive={isActive}
        onChange={toggleActive}
        disabled={isSubmitting}
      />

      <div className="col-span-12 md:col-span-5 flex flex-col gap-4 pt-8 md:pt-0">
        <div className="text-center">
          <h3 className="font-display text-sm sm:text-base font-medium leading-snug">
            {userName}
          </h3>
        </div>

        <button
          type="button"
          onClick={() => setIsAvatarEditorOpen(true)}
          className="relative w-full aspect-[3/4] bg-[#F5F0E8] border border-[#EAE3D5] rounded-[12px] overflow-hidden cursor-pointer group"
          aria-label="Змінити фото на лендингу"
        >
          {landingImage ? (
            <Image
              src={landingImage}
              alt={userName}
              fill
              sizes="(max-width: 768px) 100vw, 320px"
              className="object-cover"
            />
          ) : (
            <span
              className="absolute inset-0 flex items-center justify-center font-display italic text-[#C9B89A] leading-none"
              style={{ fontSize: "clamp(48px, 5vw, 88px)" }}
            >
              {initials}
            </span>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors">
            <span className="opacity-0 group-hover:opacity-100 text-white text-[12px] bg-black/60 px-3 py-1 rounded-full transition-opacity">
              Змінити фото
            </span>
          </div>
        </button>

        <EditableBio bio={bio} onChange={setBio} />
      </div>

      <div className="col-span-12 md:col-span-7 flex flex-col">
        <p
          className="text-center text-[var(--color-text)]"
          style={{
            fontSize: "10px",
            fontWeight: 500,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          Послуги
        </p>

        <div className="mt-3">
          {services.map((s) => (
            <EditableServiceRow
              key={s.id}
              service={s}
              onUpdate={(field, value) => updateService(s.id, field, value)}
              onDelete={() => deleteService(s.id)}
            />
          ))}
          {Array.from({ length: placeholderCount }).map((_, i) => (
            <div
              key={`placeholder-${i}`}
              className="border-b border-[var(--color-line)] py-2.5"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1px 96px auto",
                gap: "12px",
                alignItems: "center",
              }}
              aria-hidden="true"
            >
              <span className="block px-1 text-[13px]">&nbsp;</span>
              <div
                style={{
                  width: "1px",
                  height: "20px",
                  background: "var(--color-line)",
                  justifySelf: "center",
                }}
              />
              <span className="block px-1 text-[13px]">&nbsp;</span>
              <span>&nbsp;</span>
            </div>
          ))}
        </div>

        <div className="flex-1 min-h-8" aria-hidden="true" />

        <div className="flex items-center justify-between gap-4 mt-4">
          <button
            type="button"
            onClick={addService}
            disabled={services.length >= TOTAL_ROWS || isSubmitting}
            className="border border-[var(--color-line)] bg-transparent text-[14px] text-[var(--color-text)] px-6 py-2.5 rounded-[8px] hover:bg-[#F5F0E6] transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            + Додати послугу
          </button>

          <div className="flex items-center gap-3">
            {submitSuccess && (
              <span className="text-[12px] text-green-700">✓ Збережено</span>
            )}
            {submitError && (
              <span className="text-[12px] text-[#A03030]">{submitError}</span>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isDirty || isSubmitting}
              className="bg-black text-white border border-transparent px-6 py-2.5 rounded-[8px] text-[14px] transition-colors hover:bg-transparent hover:text-black hover:border-black disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black disabled:hover:text-white disabled:hover:border-transparent"
            >
              {isSubmitting ? "Зберігаю..." : "Оновити анкету"}
            </button>
          </div>
        </div>
      </div>

      <LandingImageEditorModal
        isOpen={isAvatarEditorOpen}
        onClose={() => setIsAvatarEditorOpen(false)}
        onSuccess={handleLandingImageUploaded}
      />
    </article>
  );
}
