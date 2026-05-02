"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { DaySchedule, WeekSchedule } from "@/lib/db/schema";
import { DAY_KEYS } from "@/lib/schedule";
import EditableBio from "./editable-bio";
import LandingImageEditorModal from "./landing-image-editor";

const DAY_LABELS: Record<keyof WeekSchedule, string> = {
  mon: "Пн",
  tue: "Вт",
  wed: "Ср",
  thu: "Чт",
  fri: "Пт",
  sat: "Сб",
  sun: "Нд",
};

const DAY_FULL_LABELS: Record<keyof WeekSchedule, string> = {
  mon: "Понеділок",
  tue: "Вівторок",
  wed: "Середа",
  thu: "Четвер",
  fri: "П'ятниця",
  sat: "Субота",
  sun: "Неділя",
};

const TIME_OPTIONS: { value: number; label: string }[] = [];
for (let m = 0; m <= 1440; m += 15) {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  TIME_OPTIONS.push({
    value: m,
    label: `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`,
  });
}

function formatHourShort(minutes: number): string {
  return String(Math.floor(minutes / 60)).padStart(2, "0");
}

const DEFAULT_ENABLED_DAY: DaySchedule = {
  enabled: true,
  startMinutes: 600,
  endMinutes: 1260,
  breakStartMinutes: null,
  breakEndMinutes: null,
};

export type EditableServiceFull = {
  id: string;
  name: string;
  price: string;
  estimatedMinutes: number | null;
};

type Props = {
  userName: string;
  initials: string;
  bio: string;
  onBioChange: (v: string) => void;
  landingImage: string | null;
  onLandingImageChange: (url: string | null) => void;
  isActive: boolean;
  onIsActiveChange: (v: boolean) => void;
  services: EditableServiceFull[];
  onServicesChange: (services: EditableServiceFull[]) => void;
  schedule: WeekSchedule;
  onScheduleChange: (s: WeekSchedule) => void;
  isDirty: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  submitSuccess: boolean;
  onSubmit: () => void;
};

const MAX_SERVICES = 6;

function TimeSelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value, 10))}
      className="h-[32px] bg-white border border-[var(--color-line)] rounded-[6px] px-2 text-[12px] outline-none focus:border-[var(--color-text)]"
    >
      {TIME_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function FloatingPopup({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
  if (!mounted) return null;
  return createPortal(
    <div
      data-anketa-modal
      className="fixed inset-0 z-[120] pointer-events-none flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="pointer-events-auto bg-white border border-[var(--color-line)] rounded-[12px] shadow-2xl p-4 w-full max-w-[360px] flex flex-col gap-3">
        {children}
      </div>
    </div>,
    document.body
  );
}

export default function AnketaCardEditable(props: Props) {
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
  const [activeDayKey, setActiveDayKey] =
    useState<keyof WeekSchedule | null>(null);
  const [imageEditorOpen, setImageEditorOpen] = useState(false);

  const {
    userName,
    initials,
    bio,
    onBioChange,
    landingImage,
    onLandingImageChange,
    isActive,
    onIsActiveChange,
    services,
    onServicesChange,
    schedule,
    onScheduleChange,
    isDirty,
    isSubmitting,
    submitError,
    submitSuccess,
    onSubmit,
  } = props;

  const slots: (EditableServiceFull | null)[] = Array.from(
    { length: MAX_SERVICES },
    (_, i) => services[i] ?? null
  );

  const updateService = (id: string, patch: Partial<EditableServiceFull>) => {
    onServicesChange(
      services.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  };
  const removeService = (id: string) => {
    onServicesChange(services.filter((s) => s.id !== id));
    if (activeServiceId === id) setActiveServiceId(null);
  };
  const handleAddPlaceholderClick = () => {
    if (services.length >= MAX_SERVICES) return;
    const id = crypto.randomUUID();
    onServicesChange([
      ...services,
      { id, name: "", price: "", estimatedMinutes: null },
    ]);
    setActiveServiceId(id);
  };

  const updateDay = (
    key: keyof WeekSchedule,
    patch: Partial<DaySchedule>
  ) => {
    onScheduleChange({
      ...schedule,
      [key]: { ...schedule[key], ...patch },
    });
  };

  const handleDayClick = (key: keyof WeekSchedule) => {
    if (!schedule[key].enabled) {
      onScheduleChange({
        ...schedule,
        [key]: { ...DEFAULT_ENABLED_DAY },
      });
    }
    setActiveDayKey(key);
  };

  const activeDay = activeDayKey ? schedule[activeDayKey] : null;
  const activeService = activeServiceId
    ? services.find((s) => s.id === activeServiceId) ?? null
    : null;

  return (
    <div className="space-y-4">
      <article className="relative grid grid-cols-1 md:grid-cols-[200px_1fr_50px] gap-5 md:gap-6 bg-[#FAF7F1] border border-[var(--color-line)] rounded-[16px] p-5">
        <div className="col-span-full flex justify-end mb-2">
          <button
            type="button"
            onClick={() => onIsActiveChange(!isActive)}
            disabled={isSubmitting}
            className="flex items-center gap-2 disabled:opacity-50"
            title={isActive ? "Приймаю клієнтів" : "Не приймаю клієнтів"}
          >
            <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
              {isActive ? "Активний" : "Неактивний"}
            </span>
            <div
              className={`w-9 h-5 rounded-full transition-colors ${
                isActive ? "bg-[#1C1B19]" : "bg-[var(--color-line)]"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform mt-0.5 ${
                  isActive ? "translate-x-[18px]" : "translate-x-0.5"
                }`}
              />
            </div>
          </button>
        </div>

        <div className="flex flex-col">
          <h3 className="font-display text-[26px] font-medium text-center mb-3 text-[var(--color-text)]">
            {userName}
          </h3>
          <button
            type="button"
            onClick={() => setImageEditorOpen(true)}
            aria-label="Змінити фото"
            className="relative aspect-[4/5] bg-[#F5F0E6] rounded-[12px] overflow-hidden flex items-center justify-center mb-3 group cursor-pointer"
          >
            {landingImage ? (
              <Image
                src={landingImage}
                alt={userName}
                fill
                sizes="240px"
                className="object-cover"
              />
            ) : (
              <span
                className="font-display italic text-[var(--color-text-muted)]"
                style={{ fontSize: "80px" }}
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
          <EditableBio bio={bio} onChange={onBioChange} />
        </div>

        <div className="flex flex-col min-h-full md:border-r md:border-[var(--color-line)] md:pr-8">
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--color-text)] mb-3 text-center">
            Послуги
          </div>

          <div
            className="flex-1 grid text-[13px]"
            style={{
              gridTemplateColumns: "1fr 1px 80px 24px",
              columnGap: "0",
              gridAutoRows: "1fr",
            }}
          >
            {slots.map((slot, i) => {
              if (slot === null) {
                return (
                  <div key={`empty-${i}`} style={{ display: "contents" }}>
                    <button
                      type="button"
                      onClick={handleAddPlaceholderClick}
                      className="border-b border-[var(--color-line)] flex items-end py-2 pr-4 text-left text-[var(--color-text-muted)] italic hover:text-[var(--color-text)] hover:bg-black/5 transition-colors"
                    >
                      додати послугу
                    </button>
                    <div className="bg-[var(--color-line)]" />
                    <button
                      type="button"
                      onClick={handleAddPlaceholderClick}
                      className="border-b border-[var(--color-line)] flex items-end justify-end py-2 pl-1 text-[var(--color-text-muted)] italic hover:text-[var(--color-text)] hover:bg-black/5 transition-colors"
                    >
                      ціна
                    </button>
                    <div className="border-b border-[var(--color-line)]" />
                  </div>
                );
              }
              return (
                <div key={slot.id} style={{ display: "contents" }}>
                  <button
                    type="button"
                    onClick={() => setActiveServiceId(slot.id)}
                    className={`border-b border-[var(--color-line)] flex items-end py-2 pr-4 text-left hover:bg-black/5 transition-colors ${
                      activeServiceId === slot.id ? "bg-black/5" : ""
                    } ${slot.name === "" ? "text-[var(--color-text-muted)] italic" : ""}`}
                    title="Редагувати назву і час"
                  >
                    {slot.name || "додати послугу"}
                  </button>
                  <div className="bg-[var(--color-line)]" />
                  <div className="border-b border-[var(--color-line)] flex items-end justify-end py-1 pl-1">
                    <input
                      type="text"
                      value={slot.price}
                      onChange={(e) =>
                        updateService(slot.id, { price: e.target.value })
                      }
                      placeholder="ціна"
                      className="w-full bg-transparent text-right text-[13px] text-[var(--color-text-muted)] outline-none placeholder:text-[var(--color-text-muted)] placeholder:opacity-50"
                    />
                  </div>
                  <div className="border-b border-[var(--color-line)] flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => removeService(slot.id)}
                      aria-label="Видалити послугу"
                      className="text-[var(--color-text-muted)] hover:text-[#A03030] text-[14px] leading-none w-5 h-5 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3">
            {(submitSuccess || submitError) && (
              <div className="flex items-center justify-center gap-3 mb-2 text-[12px]">
                {submitSuccess && (
                  <span className="text-green-700">✓ Збережено</span>
                )}
                {submitError && (
                  <span className="text-[#A03030]">{submitError}</span>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={onSubmit}
              disabled={!isDirty || isSubmitting}
              className="w-full bg-[var(--color-text)] text-white px-4 py-2.5 rounded-[8px] text-[13px] font-medium hover:bg-transparent hover:text-[var(--color-text)] hover:border-[var(--color-text)] border border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Зберігаю..." : "Оновити"}
            </button>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="text-[9px] font-medium uppercase tracking-[0.15em] text-[var(--color-text)] mb-2.5 text-center">
            Графік
          </div>
          <div className="grid grid-cols-7 md:flex md:flex-col gap-1">
            {DAY_KEYS.map((dayKey) => {
              const day = schedule[dayKey];
              const enabled = day.enabled;
              const isActiveDay = activeDayKey === dayKey;
              return (
                <button
                  type="button"
                  key={dayKey}
                  onClick={() => handleDayClick(dayKey)}
                  className={`aspect-square rounded-[6px] flex flex-col items-center justify-center transition-all cursor-pointer ${
                    enabled
                      ? "bg-[var(--color-text)] text-white"
                      : "bg-[#EDEAE5] text-[var(--color-text-muted)] hover:bg-[#E0DAC9]"
                  } ${isActiveDay ? "ring-2 ring-[#C9B89A] ring-offset-1" : ""}`}
                >
                  <div
                    className={`text-[10px] ${enabled ? "font-medium" : ""}`}
                  >
                    {DAY_LABELS[dayKey]}
                  </div>
                  <div
                    className={`text-[8px] ${enabled ? "opacity-70" : ""}`}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {enabled
                      ? `${formatHourShort(day.startMinutes)}–${formatHourShort(day.endMinutes)}`
                      : "—"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </article>

      {activeService && (
        <FloatingPopup
          key={`service-${activeService.id}`}
          onClose={() => setActiveServiceId(null)}
        >
          <div className="flex items-center justify-between">
            <h4 className="font-display text-[15px] font-medium">
              Редагувати послугу
            </h4>
            <button
              type="button"
              onClick={() => setActiveServiceId(null)}
              aria-label="Закрити"
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-[16px]"
            >
              ×
            </button>
          </div>
          <label className="flex flex-col gap-1 text-[12px]">
            <span className="text-[var(--color-text-muted)] uppercase tracking-[0.1em] text-[10px]">
              Назва послуги
            </span>
            <input
              type="text"
              value={activeService.name}
              onChange={(e) =>
                updateService(activeService.id, { name: e.target.value })
              }
              maxLength={80}
              autoFocus
              className="bg-white border border-[var(--color-line)] rounded-[6px] px-3 py-2 text-[13px] outline-none focus:border-[var(--color-text)]"
            />
          </label>
          <label className="flex flex-col gap-1 text-[12px]">
            <span className="text-[var(--color-text-muted)] uppercase tracking-[0.1em] text-[10px]">
              Приблизний час (хвилин)
            </span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={
                activeService.estimatedMinutes !== null
                  ? String(activeService.estimatedMinutes)
                  : ""
              }
              placeholder="наприклад 30"
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, "");
                if (raw === "") {
                  updateService(activeService.id, { estimatedMinutes: null });
                  return;
                }
                const next = parseInt(raw, 10);
                if (Number.isNaN(next)) return;
                updateService(activeService.id, {
                  estimatedMinutes: Math.min(next, 600),
                });
              }}
              className="bg-white border border-[var(--color-line)] rounded-[6px] px-3 py-2 text-[13px] outline-none focus:border-[var(--color-text)]"
            />
            <span className="text-[10px] text-[var(--color-text-muted)] italic">
              Не показується клієнтам — використовується для бронювання.
            </span>
          </label>
          <button
            type="button"
            onClick={() => setActiveServiceId(null)}
            className="mt-4 w-full bg-[var(--color-text)] text-white px-4 py-2.5 rounded-[8px] text-[13px] font-medium hover:bg-transparent hover:text-[var(--color-text)] hover:border-[var(--color-text)] border border-transparent transition-colors"
          >
            Зберегти
          </button>
        </FloatingPopup>
      )}

      {activeDay && activeDayKey && (
        <FloatingPopup
          key={`day-${activeDayKey}`}
          onClose={() => setActiveDayKey(null)}
        >
          <div className="flex items-center justify-between">
            <h4 className="font-display text-[15px] font-medium">
              {DAY_FULL_LABELS[activeDayKey]}
            </h4>
            <button
              type="button"
              onClick={() => setActiveDayKey(null)}
              aria-label="Закрити"
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-[16px]"
            >
              ×
            </button>
          </div>

          <div className="flex items-center gap-3 text-[12px] flex-wrap">
            <span className="text-[var(--color-text-muted)]">З</span>
            <TimeSelect
              value={activeDay.startMinutes}
              onChange={(n) =>
                updateDay(activeDayKey, { startMinutes: n })
              }
            />
            <span className="text-[var(--color-text-muted)]">до</span>
            <TimeSelect
              value={activeDay.endMinutes}
              onChange={(n) => updateDay(activeDayKey, { endMinutes: n })}
            />
          </div>

          {activeDay.breakStartMinutes !== null &&
          activeDay.breakEndMinutes !== null ? (
            <div className="flex items-center gap-3 text-[12px] flex-wrap">
              <span className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
                перерва
              </span>
              <TimeSelect
                value={activeDay.breakStartMinutes}
                onChange={(n) =>
                  updateDay(activeDayKey, { breakStartMinutes: n })
                }
              />
              <span className="text-[var(--color-text-muted)]">—</span>
              <TimeSelect
                value={activeDay.breakEndMinutes}
                onChange={(n) =>
                  updateDay(activeDayKey, { breakEndMinutes: n })
                }
              />
              <button
                type="button"
                onClick={() =>
                  updateDay(activeDayKey, {
                    breakStartMinutes: null,
                    breakEndMinutes: null,
                  })
                }
                className="px-3 py-2 rounded-[8px] text-[12px] bg-[#F5F0E6] text-[var(--color-text)] hover:bg-[#EBE5D8] transition-colors border border-[var(--color-line)]"
              >
                Прибрати перерву
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() =>
                updateDay(activeDayKey, {
                  breakStartMinutes: 780,
                  breakEndMinutes: 840,
                })
              }
              className="self-start border border-[var(--color-line)] bg-transparent text-[12px] px-4 py-2 rounded-[8px] hover:bg-[#F5F0E6] transition-colors"
            >
              + Перерва
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              updateDay(activeDayKey, { enabled: false });
              setActiveDayKey(null);
            }}
            className="self-start px-3 py-2 rounded-[8px] text-[12px] bg-[#F9E8E3] text-[#A03030] hover:bg-[#F2D5CD] transition-colors border border-[#E5C8C0] mt-1"
          >
            Зробити вихідним
          </button>

          <button
            type="button"
            onClick={() => setActiveDayKey(null)}
            className="mt-4 w-full bg-[var(--color-text)] text-white px-4 py-2.5 rounded-[8px] text-[13px] font-medium hover:bg-transparent hover:text-[var(--color-text)] hover:border-[var(--color-text)] border border-transparent transition-colors"
          >
            Зберегти
          </button>
        </FloatingPopup>
      )}

      <LandingImageEditorModal
        isOpen={imageEditorOpen}
        onClose={() => setImageEditorOpen(false)}
        onSuccess={(url) => {
          onLandingImageChange(url);
          setImageEditorOpen(false);
        }}
      />
    </div>
  );
}
