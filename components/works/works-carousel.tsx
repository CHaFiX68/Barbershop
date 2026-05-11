"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useConfirm } from "@/lib/confirm-context";
import type { WorkPhotoData } from "@/lib/works";

type Props = {
  works: WorkPhotoData[];
  isAdmin: boolean;
};

export default function WorksCarousel({ works, isAdmin }: Props) {
  const [visibleCount, setVisibleCount] = useState(3);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [index, setIndex] = useState(3);
  const [animate, setAnimate] = useState(true);
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const confirm = useConfirm();
  const t = useTranslations("sections.works");

  // Responsive visibleCount + reset index до позиції перших справжніх плиток.
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const c = w >= 768 ? 3 : w >= 640 ? 2 : 1;
      setVisibleCount(c);
      setIndex(c);
      setAnimate(false);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Re-enable animation after silent reset.
  useEffect(() => {
    if (!animate) {
      const id = requestAnimationFrame(() => setAnimate(true));
      return () => cancelAnimationFrame(id);
    }
  }, [animate]);

  const total = works.length;

  // Розширений масив із клонами по visibleCount з обох боків — для безшовного loop.
  // Реальні плитки лежать в індексах [visibleCount, visibleCount + total).
  const extended = useMemo(() => {
    if (total === 0 || total <= visibleCount) return works;
    return [
      ...works.slice(-visibleCount),
      ...works,
      ...works.slice(0, visibleCount),
    ];
  }, [works, visibleCount, total]);

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: t("deleteConfirmTitle"),
      message: t("deleteConfirmMessage"),
      confirmLabel: t("deleteConfirmLabel"),
      danger: true,
    });
    if (!ok) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/works/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert("Не вдалось видалити");
    } finally {
      setBusyId(null);
    }
  };

  // Empty state
  if (total === 0) {
    return (
      <p className="italic text-[var(--color-text-muted)] text-[14px] text-center py-12">
        {isAdmin ? t("emptyAdmin") : t("emptyPublic")}
      </p>
    );
  }

  // Якщо плиток мало — статичний грід без карусель
  if (total <= visibleCount) {
    return (
      <div
        className={`grid gap-3 md:gap-4 ${
          visibleCount === 3
            ? "grid-cols-3"
            : visibleCount === 2
              ? "grid-cols-2"
              : "grid-cols-1"
        }`}
      >
        {works.map((w) => (
          <Tile
            key={w.id}
            work={w}
            isAdmin={isAdmin}
            busy={busyId === w.id}
            onDelete={handleDelete}
          />
        ))}
      </div>
    );
  }

  const goPrev = () => {
    setAnimate(true);
    setIndex((i) => i - 1);
  };
  const goNext = () => {
    setAnimate(true);
    setIndex((i) => i + 1);
  };

  const handleAnimationComplete = () => {
    if (index >= visibleCount + total) {
      setAnimate(false);
      setIndex(index - total);
    } else if (index < visibleCount) {
      setAnimate(false);
      setIndex(index + total);
    }
  };

  // Кожна плитка — width = 100 / extended.length % від motion.div
  // motion.div ширина = 100% * extended.length / visibleCount від parent overflow-hidden
  const motionWidthPct = (100 * extended.length) / visibleCount;
  const tileWidthPct = 100 / extended.length;
  const xOffsetPct = -(index * tileWidthPct);

  const transition =
    reducedMotion || !animate
      ? { duration: 0 }
      : { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const };

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <motion.div
          className="flex"
          style={{ width: `${motionWidthPct}%` }}
          animate={{ x: `${xOffsetPct}%` }}
          transition={transition}
          onAnimationComplete={handleAnimationComplete}
        >
          {extended.map((w, i) => (
            <div
              key={`${w.id}-${i}`}
              className="shrink-0 px-1.5 md:px-2"
              style={{ width: `${tileWidthPct}%` }}
            >
              <Tile
                work={w}
                isAdmin={isAdmin}
                busy={busyId === w.id}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </motion.div>
      </div>

      <button
        type="button"
        onClick={goPrev}
        aria-label={t("prevAria")}
        className="absolute top-1/2 -translate-y-1/2 -left-3 md:-left-5 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-[var(--color-surface)] border border-[var(--color-line)] hover:bg-[var(--color-action-bg)] hover:text-[var(--color-action-text)] hover:border-[var(--color-text)] transition-colors rounded-full shadow-md cursor-pointer z-10"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            d="M15 18l-6-6 6-6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <button
        type="button"
        onClick={goNext}
        aria-label={t("nextAria")}
        className="absolute top-1/2 -translate-y-1/2 -right-3 md:-right-5 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-[var(--color-surface)] border border-[var(--color-line)] hover:bg-[var(--color-action-bg)] hover:text-[var(--color-action-text)] hover:border-[var(--color-text)] transition-colors rounded-full shadow-md cursor-pointer z-10"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            d="M9 18l6-6-6-6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

type TileProps = {
  work: WorkPhotoData;
  isAdmin: boolean;
  busy: boolean;
  onDelete: (id: string) => void;
};

function Tile({ work, isAdmin, busy, onDelete }: TileProps) {
  const t = useTranslations("sections.works");
  return (
    <div className="flex flex-col">
      <div className="relative group aspect-square overflow-hidden rounded-[12px] bg-[var(--color-surface-2)]">
        <Image
          src={work.imageUrl}
          alt={work.caption ?? ""}
          fill
          sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
        {isAdmin && (
          <button
            type="button"
            onClick={() => onDelete(work.id)}
            disabled={busy}
            aria-label={t("deleteAria")}
            title={t("deleteAria")}
            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-white/95 hover:bg-white text-[var(--color-danger)] rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
      {work.caption && (
        <p className="font-display text-[26px] font-medium text-center mt-3 text-[var(--color-text)] truncate px-2">
          {work.caption}
        </p>
      )}
    </div>
  );
}
