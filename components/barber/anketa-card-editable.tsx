"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { DaySchedule, WeekSchedule } from "@/lib/db/schema";
import { DAY_KEYS } from "@/lib/schedule";
import { useConfirm } from "@/lib/confirm-context";
import { useModalStack } from "@/lib/modal-stack-context";
import EditableBio from "./editable-bio";
import EditablePhone from "./editable-phone";
import LandingImageEditorModal from "./landing-image-editor";
import CloseButton from "@/components/ui/close-button";

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
  phone: string;
  onPhoneChange: (v: string) => void;
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
      className="h-[32px] bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[6px] px-2 text-[12px] outline-none focus:border-[var(--color-text)]"
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
  id,
  onClose,
  children,
}: {
  id: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const { zIndex } = useModalStack(id, true, onClose);
  if (!mounted) return null;
  return createPortal(
    <motion.div
      data-anketa-modal
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]"
      style={{ zIndex }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        className="bg-[var(--color-bg)]/85 backdrop-blur-[8px] border border-[var(--color-line)] rounded-[12px] shadow-2xl p-4 w-full max-w-[360px] flex flex-col gap-3"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </motion.div>,
    document.body
  );
}

export default function AnketaCardEditable(props: Props) {
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
  const [activeDayKey, setActiveDayKey] =
    useState<keyof WeekSchedule | null>(null);
  const [imageEditorOpen, setImageEditorOpen] = useState(false);
  const confirm = useConfirm();
  const t = useTranslations("anketa");

  const DAY_LABELS: Record<keyof WeekSchedule, string> = {
    mon: t("weekdaysShort.mon"),
    tue: t("weekdaysShort.tue"),
    wed: t("weekdaysShort.wed"),
    thu: t("weekdaysShort.thu"),
    fri: t("weekdaysShort.fri"),
    sat: t("weekdaysShort.sat"),
    sun: t("weekdaysShort.sun"),
  };
  const DAY_FULL_LABELS: Record<keyof WeekSchedule, string> = {
    mon: t("weekdaysFull.mon"),
    tue: t("weekdaysFull.tue"),
    wed: t("weekdaysFull.wed"),
    thu: t("weekdaysFull.thu"),
    fri: t("weekdaysFull.fri"),
    sat: t("weekdaysFull.sat"),
    sun: t("weekdaysFull.sun"),
  };

  const {
    userName,
    initials,
    phone,
    onPhoneChange,
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

  const updateService = (id: string, patch: Partial<EditableServiceFull>) => {
    onServicesChange(
      services.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  };
  const removeService = async (id: string) => {
    const ok = await confirm({
      title: t("removeServiceConfirmTitle"),
      message: t("removeServiceConfirmMessage"),
      confirmLabel: t("removeService"),
      danger: true,
    });
    if (!ok) return;
    onServicesChange(services.filter((s) => s.id !== id));
    if (activeServiceId === id) setActiveServiceId(null);
  };
  const handleAddNewService = () => {
    if (services.length >= MAX_SERVICES) return;
    const id = crypto.randomUUID();
    onServicesChange([
      ...services,
      { id, name: "", price: "", estimatedMinutes: 60 },
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
  const handleCloseServicePopup = () => {
    if (activeService && activeService.name.trim() === "") {
      onServicesChange(services.filter((s) => s.id !== activeService.id));
    }
    setActiveServiceId(null);
  };
  const hasPhone = !!phone.trim();
  const toggleDisabled = isSubmitting || !hasPhone;
  const toggleTitle = !hasPhone
    ? t("addPhoneFirst")
    : isActive
      ? t("acceptingClients")
      : t("notAcceptingClients");

  return (
    <div className="space-y-4">
      <article className="relative grid grid-cols-1 md:grid-cols-[160px_1fr] md:items-start gap-5 md:gap-6 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[16px] p-5">
        <div className="col-span-full flex items-center justify-end gap-3 mb-2">
          {!hasPhone && (
            <span className="italic text-[11px] text-[var(--color-danger)]">
              {t("addPhoneFirst")}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              if (!hasPhone) return;
              onIsActiveChange(!isActive);
            }}
            disabled={toggleDisabled}
            className="flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title={toggleTitle}
          >
            <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
              {isActive ? t("active") : t("inactive")}
            </span>
            <div
              className={`relative w-9 h-5 rounded-full border-2 border-[#1C1B19] transition-colors ${
                isActive ? "bg-[var(--color-action-bg)]" : "bg-[var(--color-line)]"
              }`}
            >
              <div
                className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full transition-[left] ${
                  isActive
                    ? "bg-[var(--color-action-text)] left-[14px]"
                    : "bg-[var(--color-surface)] left-0"
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
            aria-label={t("editPhoto")}
            className="relative aspect-[4/5] w-full max-h-[240px] md:max-h-none bg-[var(--color-surface-2)] rounded-[12px] overflow-hidden flex items-center justify-center mb-3 group cursor-pointer"
          >
            {landingImage ? (
              <Image
                src={landingImage}
                alt={userName}
                fill
                sizes="(max-width: 768px) 100vw, 200px"
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
                {t("editPhoto")}
              </span>
            </div>
          </button>
          <EditablePhone phone={phone} onChange={onPhoneChange} />
          <div className="mt-2">
            <EditableBio bio={bio} onChange={onBioChange} />
          </div>
        </div>

        <div className="flex flex-col">
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--color-text)] mb-3 text-center">
            {t("servicesTitle")}
          </div>

          <div className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {services.map((service) => (
                <motion.button
                  key={service.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{
                    opacity: 0,
                    scale: 0.92,
                    height: 0,
                    marginTop: 0,
                    paddingTop: 0,
                    paddingBottom: 0,
                  }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  type="button"
                  onClick={() => setActiveServiceId(service.id)}
                  className="flex items-center justify-between p-3 md:p-4 rounded-[10px] border-[var(--color-line)] bg-[var(--color-surface)] text-left transition-all hover:bg-[var(--color-surface)] hover:border-[var(--color-text)] overflow-hidden"
                  style={{ borderWidth: "0.5px" }}
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <div className="text-[14px] md:text-[15px] text-[var(--color-text)] mb-0.5 break-words">
                      {service.name || t("untitled")}
                    </div>
                    <div className="text-[11px] md:text-[12px] text-[var(--color-text-muted)]">
                      {service.estimatedMinutes
                        ? `~${service.estimatedMinutes} ${t("minutesShort")}`
                        : t("durationNotSet")}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[13px] md:text-[14px] font-medium text-[var(--color-text)] whitespace-nowrap">
                      {service.price ? service.price : "—"}
                    </div>
                  </div>
                </motion.button>
              ))}

              {services.length < MAX_SERVICES && (
                <motion.button
                  key="add-service-cta"
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{
                    opacity: 0,
                    scale: 0.95,
                    height: 0,
                    marginTop: 0,
                    paddingTop: 0,
                    paddingBottom: 0,
                  }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  type="button"
                  onClick={handleAddNewService}
                  className="w-full p-3 md:p-4 border border-dashed border-[var(--color-bronze)] rounded-[10px] text-[var(--color-text-muted)] italic text-[13px] md:text-[14px] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] hover:border-[var(--color-text)] transition-all overflow-hidden"
                >
                  + {t("addService")}
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-3">
            {(submitSuccess || submitError) && (
              <div className="flex items-center justify-center gap-3 mb-2 text-[12px]">
                {submitSuccess && (
                  <span className="text-green-700">✓ {t("saved")}</span>
                )}
                {submitError && (
                  <span className="text-[var(--color-danger)]">{submitError}</span>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={onSubmit}
              disabled={!isDirty || isSubmitting}
              className="w-full bg-[var(--color-action-bg)] text-[var(--color-action-text)] px-4 py-2.5 rounded-[8px] text-[13px] font-medium hover:bg-transparent hover:text-[var(--color-text)] hover:border-[var(--color-text)] border border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? t("saving") : t("save")}
            </button>
          </div>
        </div>

      </article>

      <div className="mt-6 md:mt-8">
        <p
          className="text-center mb-3"
          style={{
            fontSize: "10px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            fontWeight: 500,
            color: "var(--color-text)",
          }}
        >
          {t("scheduleTitle")}
        </p>
        <div className="grid grid-cols-7 gap-1.5 md:gap-2">
          {DAY_KEYS.map((dayKey) => {
            const day = schedule[dayKey];
            const enabled = day.enabled;
            const isActiveDay = activeDayKey === dayKey;
            return (
              <button
                type="button"
                key={dayKey}
                onClick={() => handleDayClick(dayKey)}
                className={`aspect-square md:aspect-auto md:h-15 rounded-[8px] flex flex-col items-center justify-center transition-all cursor-pointer ${
                  enabled
                    ? "bg-[var(--color-action-bg)] text-[var(--color-action-text)]"
                    : "bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[#F2EDE3]"
                } ${isActiveDay ? "ring-2 ring-[var(--color-bronze)] ring-offset-1" : ""}`}
              >
                <div
                  className={`text-[11px] md:text-[13px] ${enabled ? "font-medium" : ""}`}
                >
                  {DAY_LABELS[dayKey]}
                </div>
                <div
                  className={`text-[9px] md:text-[12px] ${enabled ? "opacity-70" : ""}`}
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

      <AnimatePresence>
      {activeService && (
        <FloatingPopup
          key={`service-${activeService.id}`}
          id="anketa-service-popup"
          onClose={handleCloseServicePopup}
        >
          <div className="flex items-center justify-between">
            <h4 className="font-display text-[15px] font-medium">
              {t("editService")}
            </h4>
            <CloseButton onClick={handleCloseServicePopup} />
          </div>
          <label className="flex flex-col gap-1 text-[12px]">
            <span className="text-[var(--color-text-muted)] uppercase tracking-[0.1em] text-[10px]">
              {t("serviceName")}
            </span>
            <input
              type="text"
              value={activeService.name}
              onChange={(e) =>
                updateService(activeService.id, { name: e.target.value })
              }
              maxLength={80}
              autoFocus
              className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[6px] px-3 py-2 text-[13px] outline-none focus:border-[var(--color-text)]"
            />
          </label>
          <label className="flex flex-col gap-1 text-[12px]">
            <span className="text-[var(--color-text-muted)] uppercase tracking-[0.1em] text-[10px]">
              {t("servicePrice")}
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={activeService.price}
              onChange={(e) =>
                updateService(activeService.id, { price: e.target.value })
              }
              placeholder="0"
              className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[6px] px-3 py-2 text-[13px] outline-none focus:border-[var(--color-text)]"
            />
          </label>
          <div className="flex flex-col gap-1">
            <span
              className="text-[var(--color-text)] uppercase text-[10px]"
              style={{ letterSpacing: "0.2em", fontWeight: 500 }}
            >
              {t("serviceDuration")}
            </span>
            <div className="grid grid-cols-4 gap-2 mt-1">
              {([30, 60, 90, 120] as const).map((m) => {
                const active = activeService.estimatedMinutes === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() =>
                      updateService(activeService.id, { estimatedMinutes: m })
                    }
                    className={`py-2 px-1 rounded-[8px] text-xs transition-colors ${
                      active
                        ? "bg-[var(--color-action-bg)] text-[var(--color-action-text)] border border-[var(--color-text)]"
                        : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-line)] hover:border-[var(--color-text)]"
                    }`}
                    style={!active ? { borderWidth: "0.5px" } : undefined}
                  >
                    {m} min
                  </button>
                );
              })}
            </div>
            {activeService.estimatedMinutes !== null &&
              ![30, 60, 90, 120].includes(activeService.estimatedMinutes) && (
                <span className="text-[11px] text-[var(--color-text-muted)] italic mt-1">
                  {activeService.estimatedMinutes} min
                </span>
              )}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <button
              type="button"
              onClick={() => removeService(activeService.id)}
              className="col-span-1 px-3 py-2.5 rounded-[8px] text-[13px] border border-[var(--color-danger)] text-[var(--color-danger)] bg-transparent hover:bg-[var(--color-danger)]/5 transition-colors"
              style={{ borderWidth: "0.5px" }}
            >
              {t("removeService")}
            </button>
            <button
              type="button"
              onClick={() => setActiveServiceId(null)}
              className="col-span-2 bg-[var(--color-action-bg)] text-[var(--color-action-text)] px-4 py-2.5 rounded-[8px] text-[13px] font-medium hover:bg-transparent hover:text-[var(--color-text)] hover:border-[var(--color-text)] border border-transparent transition-colors"
            >
              {t("save")}
            </button>
          </div>
        </FloatingPopup>
      )}
      </AnimatePresence>

      <AnimatePresence>
      {activeDay && activeDayKey && (
        <FloatingPopup
          key={`day-${activeDayKey}`}
          id="anketa-day-popup"
          onClose={() => setActiveDayKey(null)}
        >
          <div className="flex items-center justify-between">
            <h4 className="font-display text-[15px] font-medium">
              {DAY_FULL_LABELS[activeDayKey]}
            </h4>
            <CloseButton onClick={() => setActiveDayKey(null)} />
          </div>

          <div className="flex items-center gap-3 text-[12px] flex-wrap">
            <span className="text-[var(--color-text-muted)]">{t("fromTime")}</span>
            <TimeSelect
              value={activeDay.startMinutes}
              onChange={(n) =>
                updateDay(activeDayKey, { startMinutes: n })
              }
            />
            <span className="text-[var(--color-text-muted)]">{t("toTime")}</span>
            <TimeSelect
              value={activeDay.endMinutes}
              onChange={(n) => updateDay(activeDayKey, { endMinutes: n })}
            />
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {activeDay.breakStartMinutes !== null &&
            activeDay.breakEndMinutes !== null ? (
              <motion.div
                key="break-set"
                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -4 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-3 text-[12px] flex-wrap"
              >
                <span className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
                  {t("breakLabel")}
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
                <motion.button
                  type="button"
                  onClick={() =>
                    updateDay(activeDayKey, {
                      breakStartMinutes: null,
                      breakEndMinutes: null,
                    })
                  }
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="px-3 py-2 rounded-[8px] text-[12px] bg-[var(--color-surface-2)] text-[var(--color-text)] hover:bg-[var(--color-surface)] hover:border-[var(--color-text)] transition-colors border border-[var(--color-line)]"
                >
                  {t("removeBreak")}
                </motion.button>
              </motion.div>
            ) : (
              <motion.button
                key="break-add"
                type="button"
                onClick={() =>
                  updateDay(activeDayKey, {
                    breakStartMinutes: 780,
                    breakEndMinutes: 840,
                  })
                }
                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -4 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="self-start border border-[var(--color-line)] bg-transparent text-[12px] px-4 py-2 rounded-[8px] hover:bg-[var(--color-surface-2)] transition-colors"
              >
                + {t("breakLabel")}
              </motion.button>
            )}
          </AnimatePresence>

          <motion.button
            type="button"
            onClick={() => {
              updateDay(activeDayKey, { enabled: false });
              setActiveDayKey(null);
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="self-start px-3 py-2 rounded-[8px] text-[12px] bg-[var(--color-surface-2)] text-[var(--color-danger)] hover:bg-[var(--color-surface)] hover:border-[var(--color-danger)] transition-colors border border-[var(--color-line)] mt-1"
          >
            {t("dayClosed")}
          </motion.button>

          <button
            type="button"
            onClick={() => setActiveDayKey(null)}
            className="mt-4 w-full bg-[var(--color-action-bg)] text-[var(--color-action-text)] px-4 py-2.5 rounded-[8px] text-[13px] font-medium hover:bg-transparent hover:text-[var(--color-text)] hover:border-[var(--color-text)] border border-transparent transition-colors"
          >
            {t("save")}
          </button>
        </FloatingPopup>
      )}
      </AnimatePresence>

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
