"use client";

import { useEffect, useState } from "react";
import { HERO_CONTENT, SLIDES, type Slide } from "@/lib/data";

const PATTERN_CLASS: Record<Slide["pattern"], string> = {
  diagonal: "pattern-diagonal",
  dots: "pattern-dots",
  grid: "pattern-grid",
  cross: "pattern-cross",
  stripes: "pattern-stripes",
};

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const total = SLIDES.length;

  useEffect(() => {
    const id = setInterval(() => {
      setCurrent((c) => (c + 1) % total);
    }, 6000);
    return () => clearInterval(id);
  }, [total]);

  const goPrev = () => setCurrent((c) => (c - 1 + total) % total);
  const goNext = () => setCurrent((c) => (c + 1) % total);
  const goTo = (i: number) => setCurrent(i);

  return (
    <section className="pt-8 md:pt-12">
      <div className="max-w-[1536px] mx-auto px-6">
        <div
          className="relative overflow-hidden bg-black rounded-[24px]"
          style={{ aspectRatio: "16 / 8", maxHeight: "75vh" }}
        >
          <div
            className="absolute inset-0 z-0 flex h-full w-full"
            style={{
              transform: `translateX(-${current * 100}%)`,
              transition: "transform 0.6s cubic-bezier(0.65, 0, 0.35, 1)",
            }}
          >
            {SLIDES.map((slide) => (
              <div
                key={slide.id}
                className={`shrink-0 w-full h-full ${PATTERN_CLASS[slide.pattern]}`}
                aria-hidden="true"
              />
            ))}
          </div>

          <div className="absolute inset-0 z-10 bg-black/55" aria-hidden="true" />

          <div className="absolute inset-0 z-20 flex flex-col items-start justify-center text-left text-white px-8 sm:px-12 md:px-16 lg:px-20 pointer-events-none">
            <h1
              className="font-display max-w-2xl"
              style={{
                fontWeight: 600,
                fontSize: "clamp(40px, 7vw, 96px)",
                lineHeight: 1.05,
              }}
            >
              <span className="block">{HERO_CONTENT.titleLine1}</span>
              <span className="block">{HERO_CONTENT.titleLine2}</span>
            </h1>
            <p
              className="mt-6 max-w-md text-white/85"
              style={{ fontSize: "16px", lineHeight: 1.6 }}
            >
              {HERO_CONTENT.tagline}
            </p>
            <a
              href={HERO_CONTENT.ctaHref}
              className="mt-8 pointer-events-auto inline-flex items-center justify-center bg-white text-black border border-white px-6 py-3 transition-colors hover:bg-transparent hover:text-white rounded-[8px]"
              style={{ fontSize: "14px", fontWeight: 500 }}
            >
              {HERO_CONTENT.ctaLabel}
            </a>
          </div>

          <button
            type="button"
            onClick={goPrev}
            aria-label="Попередній слайд"
            className="absolute top-1/2 -translate-y-1/2 left-4 sm:left-8 z-30 pointer-events-auto w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center bg-transparent text-white border border-white/40 hover:bg-white hover:text-black hover:border-white transition-colors cursor-pointer"
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
            className="absolute top-1/2 -translate-y-1/2 right-4 sm:right-8 z-30 pointer-events-auto w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center bg-transparent text-white border border-white/40 hover:bg-white hover:text-black hover:border-white transition-colors cursor-pointer"
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
            {SLIDES.map((slide, i) => {
              const active = i === current;
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
        </div>
      </div>
    </section>
  );
}
