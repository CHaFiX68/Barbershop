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
    <section className="flex flex-wrap justify-center gap-3 pt-2 pb-2">
      {barbers.map((b) => (
        <button
          key={b.id}
          type="button"
          onClick={() => onSelect(b.id)}
          className="block bg-[#FAF7F1] rounded-[10px] p-2.5 max-w-45 mx-auto transition-all duration-300 hover:scale-105 hover:ring-2 hover:ring-[#1C1B19] hover:shadow-[0_8px_30px_rgba(28,27,25,0.25)]"
        >
          <h3 className="font-display text-sm text-center mb-1 text-[#1C1B19]">
            {b.name}
          </h3>
          <div className="relative w-40 h-40 mx-auto mb-2 bg-[#F5F0E6] rounded-[8px] overflow-hidden flex items-center justify-center">
            {b.landingImage ? (
              <Image
                src={b.landingImage}
                alt={b.name}
                fill
                sizes="160px"
                className="object-cover"
              />
            ) : (
              <span
                className="font-display italic text-[var(--color-text-muted)]"
                style={{ fontSize: "60px" }}
              >
                {b.initials}
              </span>
            )}
          </div>
          {b.phone && (
            <p className="text-center text-[10px] text-[#1C1B19] mb-0.5">
              {b.phone}
            </p>
          )}
          {b.bio && (
            <p className="text-center text-[10px] italic text-[#7A736A]">
              {b.bio}
            </p>
          )}
        </button>
      ))}
    </section>
  );
}
