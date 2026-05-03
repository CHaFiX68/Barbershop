"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { HERO_CONTENT } from "@/lib/data";
import type { HeroSlideData } from "@/lib/hero-slides";
import {
  buildSchedule,
  computeOpenStatus,
  type OpenStatus,
  type ScheduleInput,
} from "@/lib/schedule";
import EditableText from "./editable-text";
import HeroSliderControls from "./hero/hero-slider-controls";

type Props = {
  titleLine1: string;
  titleLine2: string;
  tagline: string;
  slides: HeroSlideData[];
  isAdmin: boolean;
  scheduleEntries: ScheduleInput[];
  initialOpenStatus: OpenStatus;
};

function statusText(status: OpenStatus): string {
  switch (status.state) {
    case "open":
      return `Зараз відчинено · ${status.todayLabel}`;
    case "closed_today":
      return `Зараз зачинено · ${status.todayLabel}`;
    case "day_off":
      return "Сьогодні вихідний";
    default:
      return "Графік не задано";
  }
}

export default function HeroSlider({
  titleLine1,
  titleLine2,
  tagline,
  slides,
  isAdmin,
  scheduleEntries,
  initialOpenStatus,
}: Props) {
  const [current, setCurrent] = useState(0);
  const [openStatus, setOpenStatus] = useState<OpenStatus>(initialOpenStatus);
  const total = slides.length;

  useEffect(() => {
    const schedule = buildSchedule(scheduleEntries);
    const tick = () => setOpenStatus(computeOpenStatus(schedule));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [scheduleEntries]);
  const safeCurrent = total > 0 ? Math.min(current, total - 1) : 0;
  const showNav = total > 1;
  const currentSlideId = total > 0 ? slides[safeCurrent]?.id ?? null : null;

  useEffect(() => {
    if (total <= 1) return;
    const id = setInterval(() => {
      setCurrent((c) => (c + 1) % total);
    }, 6000);
    return () => clearInterval(id);
  }, [total]);

  useEffect(() => {
    if (current >= total && total > 0) {
      setCurrent(0);
    }
  }, [total, current]);

  const goPrev = () => setCurrent((c) => (c - 1 + total) % total);
  const goNext = () => setCurrent((c) => (c + 1) % total);
  const goTo = (i: number) => setCurrent(i);

  return (
    <section>
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 py-6">
       <div className="max-w-6xl mx-auto">
        <div className="relative">
        <div className="relative aspect-[16/8] min-h-[180px] bg-[#1C1B19] overflow-hidden rounded-[24px]">
          {total > 0 && (
            <div
              className="absolute inset-0 z-0 flex h-full w-full"
              style={{
                transform: `translateX(-${safeCurrent * 100}%)`,
                transition: "transform 0.6s cubic-bezier(0.65, 0, 0.35, 1)",
              }}
            >
              {slides.map((slide, i) => (
                <div
                  key={slide.id}
                  className="shrink-0 w-full h-full relative"
                  aria-hidden="true"
                >
                  <Image
                    src={slide.imageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 1536px) 100vw, 1536px"
                    className="object-cover"
                    quality={95}
                    priority={i === 0}
                  />
                </div>
              ))}
            </div>
          )}

          <div
            className="absolute inset-0 z-10"
            style={{ background: "rgba(28, 27, 25, 0.55)" }}
            aria-hidden="true"
          />

          <div
            className="absolute top-6 sm:top-8 left-6 sm:left-12 z-30 flex items-center gap-2.5 pointer-events-none"
            style={{
              fontSize: "10px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(237,234,229,0.7)",
            }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor:
                  openStatus.state === "open" ? "#7BB389" : "#D87070",
              }}
              aria-hidden="true"
            />
            {statusText(openStatus)}
          </div>
          {total > 0 && (
            <>
              <div
                className="hidden md:block absolute top-6 sm:top-8 right-6 sm:right-12 z-30 font-display pointer-events-none"
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.15em",
                  color: "rgba(237,234,229,0.5)",
                }}
                aria-hidden="true"
              >
                — {String(safeCurrent + 1).padStart(2, "0")} /{" "}
                {String(total).padStart(2, "0")}
              </div>
              <div
                className="md:hidden absolute bottom-4 right-4 z-30 font-display pointer-events-none"
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.15em",
                  color: "rgba(237,234,229,0.7)",
                }}
                aria-hidden="true"
              >
                — {String(safeCurrent + 1).padStart(2, "0")} /{" "}
                {String(total).padStart(2, "0")}
              </div>
            </>
          )}

          <div className="absolute inset-0 z-20 flex flex-col items-start justify-center text-left text-white px-4 sm:px-12 md:px-16 lg:px-20 pt-16 md:pt-0 pointer-events-none">
            <h1
              className="font-display max-w-2xl pointer-events-auto"
              style={{
                fontWeight: 600,
                fontSize: "clamp(34px, 6vw, 80px)",
                lineHeight: 1.05,
              }}
            >
              <EditableText
                contentKey="hero.title.line1"
                initialValue={titleLine1}
                as="span"
                className="block"
                maxLength={60}
              />
              <EditableText
                contentKey="hero.title.line2"
                initialValue={titleLine2}
                as="span"
                className="block"
                maxLength={60}
              />
            </h1>
            <p
              className="mt-6 max-w-md text-white/85 pointer-events-auto"
              style={{ fontSize: "14px", lineHeight: 1.6 }}
            >
              <EditableText
                contentKey="hero.tagline"
                initialValue={tagline}
                as="span"
                multiline
                maxLength={200}
              />
            </p>
            <a
              href={HERO_CONTENT.ctaHref}
              className="hidden md:inline-flex mt-8 pointer-events-auto items-center justify-center bg-[#EDEAE5] text-[#1C1B19] border border-[#EDEAE5] px-5 py-2.5 transition-colors hover:bg-transparent hover:text-[#EDEAE5] rounded-[8px]"
              style={{ fontSize: "14px", fontWeight: 500 }}
            >
              {HERO_CONTENT.ctaLabel}
            </a>
          </div>

          {showNav && (
            <>
              <button
                type="button"
                onClick={goPrev}
                aria-label="Попередній слайд"
                className="absolute top-1/2 -translate-y-1/2 left-5 sm:left-8 z-30 pointer-events-auto w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-transparent text-white border border-white/40 hover:bg-white hover:text-black hover:border-white transition-colors cursor-pointer"
                style={{ borderRadius: "9999px" }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M9 1L3 7l6 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="square"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Наступний слайд"
                className="absolute top-1/2 -translate-y-1/2 right-5 sm:right-8 z-30 pointer-events-auto w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-transparent text-white border border-white/40 hover:bg-white hover:text-black hover:border-white transition-colors cursor-pointer"
                style={{ borderRadius: "9999px" }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M5 1l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="square"
                  />
                </svg>
              </button>

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
                {slides.map((slide, i) => {
                  const active = i === safeCurrent;
                  return (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => goTo(i)}
                      aria-label={`Слайд ${i + 1}`}
                      aria-current={active ? "true" : "false"}
                      className="block transition-all duration-300"
                      style={{
                        width: active ? "28px" : "8px",
                        height: active ? "8px" : "8px",
                        backgroundColor: active
                          ? "#ffffff"
                          : "rgba(255,255,255,0.4)",
                      }}
                    />
                  );
                })}
              </div>
            </>
          )}

          <HeroSliderControls
            isAdmin={isAdmin}
            currentSlideId={currentSlideId}
            hasSlides={total > 0}
          />
        </div>

        <div className="md:hidden flex justify-center py-6">
          <a
            href={HERO_CONTENT.ctaHref}
            className="inline-flex items-center justify-center bg-white border border-[var(--color-line)] text-[var(--color-text)] px-6 py-3 rounded-[8px] text-[14px] font-medium hover:bg-[#F5F0E6] transition-colors"
          >
            {HERO_CONTENT.ctaLabel}
          </a>
        </div>
        </div>
       </div>
      </div>
    </section>
  );
}
