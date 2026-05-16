"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { BarberPublic } from "@/lib/barbers";
import { useCachedFetch } from "@/lib/use-cached-fetch";
import Step1Barbers from "./step1-barbers";
import Step2Services from "./step2-services";
import Step3Time from "./step3-time";
import StepSuccess from "./step-success";

type SuccessInfo = {
  bookingId: string;
  barberName: string;
  serviceName: string;
  date: Date;
  time: string;
};

type Flow =
  | { kind: 1 }
  | { kind: 2 }
  | { kind: 3 }
  | { kind: "success"; info: SuccessInfo };

type Direction = "forward" | "backward";

type BarberInfo = {
  userId: string;
  name: string;
  bio: string | null;
  landingImage: string | null;
};

export type BookingServiceItem = {
  id: string;
  name: string;
  price: string;
  estimatedMinutes: number | null;
};

type BarberDataResp = { barber: BarberInfo; services: BookingServiceItem[] };

type StepLabelKey = "step1Label" | "step2Label" | "step3Label";
const STEPS: { num: 1 | 2 | 3; labelKey: StepLabelKey }[] = [
  { num: 1, labelKey: "step1Label" },
  { num: 2, labelKey: "step2Label" },
  { num: 3, labelKey: "step3Label" },
];

type Props = {
  barbers: BarberPublic[];
  initialBarberId: string | null;
  initialServiceId: string | null;
  onSuccess?: () => void;
};

export default function BookingFlow({
  barbers,
  initialBarberId,
  initialServiceId,
  onSuccess,
}: Props) {
  const t = useTranslations("booking");
  const reducedMotion = useReducedMotion();
  const [direction, setDirection] = useState<Direction>("forward");

  const validInitialBarberId =
    initialBarberId && barbers.some((b) => b.id === initialBarberId)
      ? initialBarberId
      : null;

  // Step 1 is skipped only when initialBarberId came via URL (?barber=X) —
  // i.e. the user clicked a specific barber card. A bare /booking entry
  // (header "Букінг") always shows step 1 even with a single active barber,
  // so the user can see who they're booking with.
  const initialFlow: Flow = validInitialBarberId
    ? initialServiceId
      ? { kind: 3 }
      : { kind: 2 }
    : { kind: 1 };

  const [flow, setFlow] = useState<Flow>(initialFlow);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(
    validInitialBarberId
  );
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    validInitialBarberId ? initialServiceId : null
  );

  const step = flow.kind;

  const [barberError, setBarberError] = useState<string | null>(null);
  const [availableDates, setAvailableDates] = useState<Set<string> | null>(
    null
  );

  const {
    data: barberData,
    loading: barberLoading,
    error: barberFetchError,
  } = useCachedFetch<BarberDataResp>(
    selectedBarberId ? `barber-detail:${selectedBarberId}` : "",
    () =>
      fetch(`/api/booking/barber/${selectedBarberId}`).then(async (res) => {
        const json = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(json?.error || t("errorGeneric"));
        }
        return json as BarberDataResp;
      }),
    selectedBarberId !== null
  );
  useEffect(() => {
    setBarberError(barberFetchError);
  }, [barberFetchError]);

  const selectedBarberPublic = useMemo(
    () =>
      selectedBarberId
        ? barbers.find((b) => b.id === selectedBarberId) ?? null
        : null,
    [barbers, selectedBarberId]
  );


  useEffect(() => {
    if (!selectedBarberId || !selectedServiceId) {
      setAvailableDates(null);
      return;
    }
    let cancelled = false;
    const todayDt = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const from = fmt(todayDt);
    const to = fmt(new Date(todayDt.getTime() + 30 * 86_400_000));
    fetch(
      `/api/booking/availability/month?barberId=${selectedBarberId}&serviceId=${selectedServiceId}&from=${from}&to=${to}`
    )
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as { availableDates: string[] };
      })
      .then((data) => {
        if (cancelled || !data) return;
        setAvailableDates(new Set(data.availableDates));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [selectedBarberId, selectedServiceId]);

  // Validate initial service against barber data once loaded — drop to step 2 if invalid
  useEffect(() => {
    if (step !== 3 || !barberData || !selectedServiceId) return;
    const svc = barberData.services.find((s) => s.id === selectedServiceId);
    if (!svc || svc.estimatedMinutes == null) {
      setDirection("backward");
      setSelectedServiceId(null);
      setFlow({ kind: 2 });
    }
  }, [step, barberData, selectedServiceId]);

  const handleBarberSelect = useCallback((userId: string) => {
    setDirection("forward");
    setSelectedBarberId(userId);
    setSelectedServiceId(null);
    setFlow({ kind: 2 });
  }, []);

  const handleServiceSelect = useCallback((serviceId: string) => {
    setDirection("forward");
    setSelectedServiceId(serviceId);
    setFlow({ kind: 3 });
  }, []);

  const handleBackToBarbers = useCallback(() => {
    setDirection("backward");
    setSelectedBarberId(null);
    setSelectedServiceId(null);
    setFlow({ kind: 1 });
  }, []);

  const handleBackToServices = useCallback(() => {
    setDirection("backward");
    setSelectedServiceId(null);
    setFlow({ kind: 2 });
  }, []);

  const handleStepClick = (target: 1 | 2 | 3) => {
    if (typeof step !== "number" || target >= step) return;
    if (target === 1) handleBackToBarbers();
    else if (target === 2) handleBackToServices();
  };

  const handleSuccess = useCallback(
    (bookingId: string, date: Date, time: string) => {
      // Defensive: build SuccessInfo from whatever we have, fall back to placeholders.
      // This guarantees we always advance to "success" step on a successful API
      // response — never leaves the user stuck on step 3 with no feedback.
      const svc = barberData?.services.find((s) => s.id === selectedServiceId);
      const info: SuccessInfo = {
        bookingId,
        barberName: barberData?.barber.name ?? "",
        serviceName: svc?.name ?? "",
        date,
        time,
      };
      setDirection("forward");
      setFlow({ kind: "success", info });
    },
    [barberData, selectedServiceId]
  );

  const selectedService =
    selectedServiceId && barberData
      ? barberData.services.find((s) => s.id === selectedServiceId) ?? null
      : null;

  const slideVariants = reducedMotion
    ? {
        enter: { opacity: 0 },
        center: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        enter: (dir: Direction) => ({
          x: dir === "forward" ? 24 : -24,
          opacity: 0,
        }),
        center: { x: 0, opacity: 1 },
        exit: (dir: Direction) => ({
          x: dir === "forward" ? -24 : 24,
          opacity: 0,
        }),
      };

  const transitionConfig = reducedMotion
    ? { duration: 0 }
    : { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const };

  if (barbers.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-[var(--color-text-muted)] italic text-[14px] mb-2">
          {t("noBarbers")}
        </p>
      </div>
    );
  }

  // Hide step 1 from breadcrumb when user arrived via a deep-link with a
  // pre-selected barber AND has already moved past step 1. If the user
  // returns to step 1 (e.g. via "↻ Змінити" pill), show the full 3-step
  // breadcrumb so the active step matches what's displayed.
  const skippedBarberStep = !!validInitialBarberId && step !== 1;
  const visibleSteps = skippedBarberStep
    ? STEPS.filter((s) => s.num !== 1)
    : STEPS;

  return (
    <div className="flex flex-col gap-3 flex-1 min-h-0">
      {step !== "success" && (
        <header>
          {(step === 3 || (step === 2 && !validInitialBarberId)) && (
            <button
              type="button"
              onClick={
                step === 3 ? handleBackToServices : handleBackToBarbers
              }
              aria-label={t("back")}
              className="inline-flex items-center gap-1.5 px-2 py-1 -ml-2 mb-1 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              <span className="text-base leading-none">←</span>
              <span>{t("back")}</span>
            </button>
          )}
          <ol className="flex items-center gap-2 sm:gap-4 flex-wrap">
            {visibleSteps.map((s, idx) => {
              const displayNumber = idx + 1;
              const isCurrent = s.num === step;
              const isPast = typeof step === "number" && s.num < step;
              const isFuture = typeof step === "number" && s.num > step;
              const clickable = isPast;
              return (
                <li key={s.num} className="flex items-center gap-2 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => clickable && handleStepClick(s.num)}
                    disabled={!clickable}
                    className={`text-[12px] sm:text-[13px] uppercase transition-colors ${
                      isCurrent
                        ? "font-semibold text-[var(--color-text)]"
                        : isPast
                          ? "text-[var(--color-bronze)] hover:text-[var(--color-text)] cursor-pointer"
                          : "text-[var(--color-text-muted)] cursor-default"
                    }`}
                    style={{ letterSpacing: "0.15em" }}
                    aria-current={isCurrent ? "step" : undefined}
                  >
                    {displayNumber}. {t(s.labelKey)}
                  </button>
                  {idx < visibleSteps.length - 1 && (
                    <span
                      aria-hidden="true"
                      className={`text-[11px] ${
                        isFuture
                          ? "text-[var(--color-text-muted)]"
                          : "text-[var(--color-bronze)]"
                      }`}
                    >
                      →
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </header>
      )}

      {(step === 2 || step === 3) && selectedBarberPublic && (
        <div className="flex items-center justify-center">
          <div
            className="flex items-center gap-2 pl-1.5 pr-3 py-1 bg-[var(--color-surface)] rounded-full"
            style={{
              borderWidth: "0.5px",
              borderStyle: "solid",
              borderColor: "var(--color-line)",
            }}
          >
            {selectedBarberPublic.landingImage ? (
              <Image
                src={selectedBarberPublic.landingImage}
                alt=""
                width={28}
                height={28}
                sizes="28px"
                className="w-7 h-7 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center text-[11px] font-display italic text-[var(--color-text-muted)] shrink-0">
                {selectedBarberPublic.initials}
              </div>
            )}
            <span className="font-display text-[14px] text-[var(--color-text)]">
              {selectedBarberPublic.name}
            </span>
            {barbers.length > 1 && (
              <button
                type="button"
                onClick={handleBackToBarbers}
                className="ml-1 text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              >
                ↻ {t("change")}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="relative overflow-x-hidden flex-1 min-h-0 w-full">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={String(step)}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transitionConfig}
            className="h-full w-full"
          >
            {step === 1 && (
              <Step1Barbers barbers={barbers} onSelect={handleBarberSelect} />
            )}

            {step === 2 && selectedBarberId && (
              <Step2Services
                barberData={barberData}
                loading={barberLoading}
                error={barberError}
                onSelect={handleServiceSelect}
                onBack={
                  barbers.length > 1 ? handleBackToBarbers : undefined
                }
              />
            )}

            {step === 3 &&
              (selectedBarberId &&
              selectedServiceId &&
              selectedBarberPublic &&
              selectedService &&
              selectedService.estimatedMinutes != null ? (
                <Step3Time
                  barberId={selectedBarberId}
                  serviceId={selectedServiceId}
                  serviceName={selectedService.name}
                  servicePrice={selectedService.price}
                  estimatedMinutes={selectedService.estimatedMinutes}
                  schedule={selectedBarberPublic.schedule}
                  availableDates={availableDates}
                  onBack={handleBackToServices}
                  onSuccess={handleSuccess}
                />
              ) : (
                <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[12px] p-8 animate-pulse h-[300px]" />
              ))}

            {flow.kind === "success" && (
              <StepSuccess
                barberName={flow.info.barberName}
                serviceName={flow.info.serviceName}
                date={flow.info.date}
                time={flow.info.time}
                onClose={onSuccess}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
