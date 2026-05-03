"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { BarberPublic } from "@/lib/barbers";
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

const STEPS: { num: 1 | 2 | 3; label: string }[] = [
  { num: 1, label: "Барбер" },
  { num: 2, label: "Послуга" },
  { num: 3, label: "Час" },
];

type Props = {
  barbers: BarberPublic[];
  initialBarberId: string | null;
  initialServiceId: string | null;
};

export default function BookingFlow({
  barbers,
  initialBarberId,
  initialServiceId,
}: Props) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const [direction, setDirection] = useState<Direction>("forward");

  const validInitialBarberId =
    initialBarberId && barbers.some((b) => b.id === initialBarberId)
      ? initialBarberId
      : null;

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

  const [barberData, setBarberData] = useState<BarberDataResp | null>(null);
  const [barberLoading, setBarberLoading] = useState(false);
  const [barberError, setBarberError] = useState<string | null>(null);

  const selectedBarberPublic = useMemo(
    () =>
      selectedBarberId
        ? barbers.find((b) => b.id === selectedBarberId) ?? null
        : null,
    [barbers, selectedBarberId]
  );

  useEffect(() => {
    if (initialBarberId && !validInitialBarberId) {
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", pathname);
      }
    }
  }, [initialBarberId, validInitialBarberId, pathname]);

  useEffect(() => {
    if (!selectedBarberId) {
      setBarberData(null);
      setBarberError(null);
      return;
    }
    let cancelled = false;
    setBarberLoading(true);
    setBarberError(null);
    fetch(`/api/booking/barber/${selectedBarberId}`)
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(json?.error || "Не вдалось завантажити барбера");
        }
        return json as BarberDataResp;
      })
      .then((data) => {
        if (!cancelled) setBarberData(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setBarberError(err.message);
      })
      .finally(() => {
        if (!cancelled) setBarberLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedBarberId]);

  const updateUrl = useCallback(
    (barberId: string | null, serviceId: string | null) => {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams();
      if (barberId) params.set("barber", barberId);
      if (serviceId) params.set("service", serviceId);
      const qs = params.toString();
      const newUrl = qs ? `${pathname}?${qs}` : pathname;
      window.history.replaceState(null, "", newUrl);
    },
    [pathname]
  );

  // Validate initial service against barber data once loaded — drop to step 2 if invalid
  useEffect(() => {
    if (step !== 3 || !barberData || !selectedServiceId) return;
    const svc = barberData.services.find((s) => s.id === selectedServiceId);
    if (!svc || svc.estimatedMinutes == null) {
      setDirection("backward");
      setSelectedServiceId(null);
      setFlow({ kind: 2 });
      updateUrl(selectedBarberId, null);
    }
  }, [step, barberData, selectedServiceId, selectedBarberId, updateUrl]);

  const handleBarberSelect = useCallback(
    (userId: string) => {
      setDirection("forward");
      setSelectedBarberId(userId);
      setSelectedServiceId(null);
      setFlow({ kind: 2 });
      updateUrl(userId, null);
    },
    [updateUrl]
  );

  const handleServiceSelect = useCallback(
    (serviceId: string) => {
      setDirection("forward");
      setSelectedServiceId(serviceId);
      setFlow({ kind: 3 });
      updateUrl(selectedBarberId, serviceId);
    },
    [selectedBarberId, updateUrl]
  );

  const handleBackToBarbers = useCallback(() => {
    setDirection("backward");
    setSelectedBarberId(null);
    setSelectedServiceId(null);
    setFlow({ kind: 1 });
    updateUrl(null, null);
  }, [updateUrl]);

  const handleBackToServices = useCallback(() => {
    setDirection("backward");
    setSelectedServiceId(null);
    setFlow({ kind: 2 });
    updateUrl(selectedBarberId, null);
  }, [selectedBarberId, updateUrl]);

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
          x: dir === "forward" ? 60 : -60,
          opacity: 0,
        }),
        center: { x: 0, opacity: 1 },
        exit: (dir: Direction) => ({
          x: dir === "forward" ? -60 : 60,
          opacity: 0,
        }),
      };

  const transitionConfig = reducedMotion
    ? { duration: 0 }
    : { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const };

  return (
    <div className="flex flex-col gap-8">
      {step !== "success" && (
        <header>
          <h1
            className="font-display text-[var(--color-text)] mb-6"
            style={{ fontWeight: 600, fontSize: "clamp(28px, 5vw, 40px)" }}
          >
            Запис на стрижку
          </h1>
          <ol className="flex items-center gap-2 sm:gap-4 flex-wrap">
            {STEPS.map((s, idx) => {
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
                          ? "text-[#C9B89A] hover:text-[var(--color-text)] cursor-pointer"
                          : "text-[var(--color-text-muted)] cursor-default"
                    }`}
                    style={{ letterSpacing: "0.15em" }}
                    aria-current={isCurrent ? "step" : undefined}
                  >
                    {s.num}. {s.label}
                  </button>
                  {idx < STEPS.length - 1 && (
                    <span
                      aria-hidden="true"
                      className={`text-[11px] ${
                        isFuture
                          ? "text-[var(--color-text-muted)]"
                          : "text-[#C9B89A]"
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

      <div className="overflow-x-hidden">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={String(step)}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transitionConfig}
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
                onBack={handleBackToBarbers}
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
                  onBack={handleBackToServices}
                  onSuccess={handleSuccess}
                />
              ) : (
                <div className="bg-[#FAF7F1] border border-[var(--color-line)] rounded-[12px] p-8 animate-pulse h-[300px]" />
              ))}

            {flow.kind === "success" && (
              <StepSuccess
                barberName={flow.info.barberName}
                serviceName={flow.info.serviceName}
                date={flow.info.date}
                time={flow.info.time}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
