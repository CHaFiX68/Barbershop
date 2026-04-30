"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ActiveToggle from "./active-toggle";
import EditableBio from "./editable-bio";
import EditableServiceRow, {
  type EditableService,
} from "./editable-service-row";
import LandingImageEditorModal from "./landing-image-editor";

const TOTAL_ROWS = 6;

type Props = {
  userName: string;
  initials: string;
  initialBio: string;
  initialLandingImage: string | null;
  initialIsActive: boolean;
  initialServices: EditableService[];
};

export default function EditableBarberCard({
  userName,
  initials,
  initialBio,
  initialLandingImage,
  initialIsActive,
  initialServices,
}: Props) {
  const router = useRouter();
  const [bio, setBio] = useState(initialBio);
  const [isActive, setIsActive] = useState(initialIsActive);
  const [landingImage, setLandingImage] = useState<string | null>(
    initialLandingImage
  );
  const [services, setServices] = useState<EditableService[]>(initialServices);
  const [isAvatarEditorOpen, setIsAvatarEditorOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const placeholderCount = Math.max(0, TOTAL_ROWS - services.length);

  const saveBio = async (next: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/barber/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio: next }),
      });
      if (!res.ok) throw new Error("Failed");
      setBio(next);
      router.refresh();
    } catch (err) {
      console.error("saveBio failed:", err);
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async () => {
    const next = !isActive;
    setIsActive(next);
    try {
      const res = await fetch("/api/barber/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: next }),
      });
      if (!res.ok) throw new Error("Failed");
      router.refresh();
    } catch (err) {
      console.error("toggleActive failed:", err);
      setIsActive(!next);
    }
  };

  const handleLandingImageUploaded = (url: string) => {
    setLandingImage(url);
    setIsAvatarEditorOpen(false);
    router.refresh();
  };

  const addService = async () => {
    if (services.length >= TOTAL_ROWS || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/barber/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Нова послуга", price: "0" }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as { id: string };
      setServices((prev) => [
        ...prev,
        { id: data.id, name: "Нова послуга", price: "0" },
      ]);
      router.refresh();
    } catch (err) {
      console.error("addService failed:", err);
    } finally {
      setBusy(false);
    }
  };

  const updateService = async (
    id: string,
    field: "name" | "price",
    value: string
  ) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
    try {
      const res = await fetch("/api/barber/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, [field]: value }),
      });
      if (!res.ok) throw new Error("Failed");
      router.refresh();
    } catch (err) {
      console.error("updateService failed:", err);
    }
  };

  const deleteService = async (id: string) => {
    const previous = services;
    setServices((prev) => prev.filter((s) => s.id !== id));
    try {
      const res = await fetch("/api/barber/services", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed");
      router.refresh();
    } catch (err) {
      console.error("deleteService failed:", err);
      setServices(previous);
    }
  };

  return (
    <article className="relative bg-white border border-[var(--color-line)] rounded-[16px] p-5 sm:p-7 grid grid-cols-12 gap-5 sm:gap-7">
      <ActiveToggle isActive={isActive} onChange={toggleActive} disabled={busy} />

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

        <EditableBio bio={bio} onSave={saveBio} />
      </div>

      <div className="col-span-12 md:col-span-7 flex flex-col">
        <p
          className="text-center text-[var(--color-text-muted)]"
          style={{
            fontSize: "10px",
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

        <div className="self-center flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.refresh()}
            disabled={busy}
            className="inline-flex items-center justify-center bg-black text-white border border-transparent px-6 py-2.5 transition-colors hover:bg-transparent hover:text-black hover:border-black rounded-[8px] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontSize: "14px" }}
          >
            Оновити анкету
          </button>
          <button
            type="button"
            onClick={addService}
            disabled={services.length >= TOTAL_ROWS || busy}
            aria-label="Додати послугу"
            title="Додати послугу"
            className="inline-flex items-center justify-center w-10 h-10 bg-black text-white rounded-[8px] transition-colors hover:bg-transparent hover:text-black border border-transparent hover:border-black disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black disabled:hover:text-white disabled:hover:border-transparent"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M8 3v10M3 8h10" />
            </svg>
          </button>
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
