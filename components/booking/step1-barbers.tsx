"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { BarberPublic } from "@/lib/barbers";

type Props = {
  barbers: BarberPublic[];
  onSelect: (userId: string) => void;
};

export default function Step1Barbers({ barbers, onSelect }: Props) {
  const t = useTranslations("booking");
  if (barbers.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-[var(--color-text-muted)] italic text-[14px] mb-6">
          {t("noBarbers")}
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center bg-[var(--color-action-bg)] text-[var(--color-action-text)] px-6 py-2.5 rounded-[8px] text-[14px] hover:opacity-90 transition-opacity"
        >
          ← {t("back")}
        </Link>
      </div>
    );
  }

  return (
    <section className={`flex flex-wrap items-center justify-center gap-3 md:gap-4 py-12 h-full mx-auto ${barbers.length === 2 || barbers.length === 4 ? "max-w-[576px]" : "max-w-[872px]"}`}>
      {barbers.map((b) => (
        <button
          key={b.id}
          type="button"
          onClick={() => onSelect(b.id)}
          className="block bg-[var(--color-surface)] border-[0.5px] border-[var(--color-line)] rounded-[10px] md:rounded-[12px] p-2.5 md:p-3.5 max-w-45 md:max-w-72 mx-auto transition-all duration-300 hover:scale-105 hover:ring-2 hover:ring-[var(--color-text)] hover:shadow-[0_8px_30px_rgba(28,27,25,0.25)]"
        >
          <div className="relative w-40 md:w-62.5 aspect-[3/4] mx-auto bg-[var(--color-surface-2)] rounded-[8px] md:rounded-[10px] overflow-hidden flex items-center justify-center">
            {b.landingImage ? (
              <Image
                src={b.landingImage}
                alt={b.name}
                fill
                sizes="(min-width: 768px) 250px, 160px"
                className="object-cover"
              />
            ) : (
              <span className="font-display italic text-[var(--color-text-muted)] text-[60px] md:text-[80px]">
                {b.initials}
              </span>
            )}
          </div>
          <h3 className="font-display text-sm md:text-xl text-center mt-2 md:mt-3 text-[var(--color-text)]">
            {b.name}
          </h3>
          {b.bio && (
            <p className="font-display italic text-xs md:text-sm text-center mt-1 md:mt-2 text-[var(--color-text-muted)] line-clamp-2">
              {b.bio}
            </p>
          )}
        </button>
      ))}
    </section>
  );
}
