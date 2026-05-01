"use client";

import { useEffect, useState } from "react";
import { HERO_CONTENT, SLIDES, type Slide } from "@/lib/data";
import EditableText from "./editable-text";

const PATTERN_CLASS: Record<Slide["pattern"], string> = {
  diagonal: "pattern-diagonal",
  dots: "pattern-dots",
  grid: "pattern-grid",
  cross: "pattern-cross",
  stripes: "pattern-stripes",
};

type Props = {
  titleLine1: string;
  titleLine2: string;
  tagline: string;
};

export default function HeroSlider({
  titleLine1,
  titleLine2,
  tagline,
}: Props) {
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
    <section>
      <div className="max-w-[1536px] mx-auto px-6 pt-6">
       <div className="max-w-6xl mx-auto">
        <div className="relative">
        <div className="relative aspect-[16/8] bg-[#1C1B19] overflow-hidden rounded-[24px]">
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
              style={{ backgroundColor: "#7BB389" }}
              aria-hidden="true"
            />
            Сьогодні відкрито · 10:00 — 21:00
          </div>
          <div
            className="absolute top-6 sm:top-8 right-6 sm:right-12 z-30 font-display pointer-events-none"
            style={{
              fontSize: "11px",
              letterSpacing: "0.15em",
              color: "rgba(237,234,229,0.5)",
            }}
            aria-hidden="true"
          >
            — 01
          </div>

          <div className="absolute inset-0 z-20 flex flex-col items-start justify-center text-left text-white px-8 sm:px-12 md:px-16 lg:px-20 pointer-events-none">
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
              className="mt-8 pointer-events-auto inline-flex items-center justify-center bg-[#EDEAE5] text-[#1C1B19] border border-[#EDEAE5] px-5 py-2.5 transition-colors hover:bg-transparent hover:text-[#EDEAE5] rounded-[8px]"
              style={{ fontSize: "14px", fontWeight: 500 }}
            >
              {HERO_CONTENT.ctaLabel}
            </a>
          </div>

          <button
            type="button"
            onClick={goPrev}
            aria-label="Попередній слайд"
            className="absolute top-1/2 -translate-y-1/2 left-4 sm:left-8 z-30 pointer-events-auto w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-transparent text-white border border-white/40 hover:bg-white hover:text-black hover:border-white transition-colors cursor-pointer"
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
            className="absolute top-1/2 -translate-y-1/2 right-4 sm:right-8 z-30 pointer-events-auto w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-transparent text-white border border-white/40 hover:bg-white hover:text-black hover:border-white transition-colors cursor-pointer"
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
       </div>
      </div>
    </section>
  );
}
