"use client";

import Image from "next/image";
import Link from "next/link";
import type { BarberPublic } from "@/lib/barbers";

type Props = {
  barbers: BarberPublic[];
  onSelect: (userId: string) => void;
};

export default function Step1Barbers({ barbers, onSelect }: Props) {
  if (barbers.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-[var(--color-text-muted)] italic text-[14px] mb-6">
          Поки немає активних барберів.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center bg-[var(--color-text)] text-[var(--color-bg)] px-6 py-2.5 rounded-[8px] text-[14px] hover:opacity-90 transition-opacity"
        >
          ← На головну
        </Link>
      </div>
    );
  }

  return (
    <section className="flex flex-wrap items-center justify-center gap-3 py-12 h-full">
      {barbers.map((b) => (
        <button
          key={b.id}
          type="button"
          onClick={() => onSelect(b.id)}
          className="block bg-[#FAF7F1] rounded-[10px] md:rounded-[12px] p-2.5 md:p-3.5 max-w-45 md:max-w-72 mx-auto transition-all duration-300 hover:scale-105 hover:ring-2 hover:ring-[#1C1B19] hover:shadow-[0_8px_30px_rgba(28,27,25,0.25)]"
        >
          <div className="relative w-40 h-40 md:w-62.5 md:h-62.5 mx-auto bg-[#F5F0E6] rounded-[8px] md:rounded-[10px] overflow-hidden flex items-center justify-center">
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
          <h3 className="font-display text-sm md:text-xl text-center mt-2 md:mt-3 text-[#1C1B19]">
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
