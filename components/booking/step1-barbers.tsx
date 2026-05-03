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
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {barbers.map((b) => (
        <article
          key={b.id}
          className="flex flex-col bg-[#FAF7F1] border border-[var(--color-line)] rounded-[12px] p-4"
        >
          <div className="relative aspect-square bg-[#F5F0E6] rounded-[12px] overflow-hidden mb-3 flex items-center justify-center">
            {b.landingImage ? (
              <Image
                src={b.landingImage}
                alt={b.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
              />
            ) : (
              <span
                className="font-display italic text-[var(--color-text-muted)]"
                style={{ fontSize: "64px" }}
              >
                {b.initials}
              </span>
            )}
          </div>
          <h3
            className="font-display text-center mb-3 text-[var(--color-text)]"
            style={{ fontSize: "20px", fontWeight: 500 }}
          >
            {b.name}
          </h3>
          <button
            type="button"
            onClick={() => onSelect(b.id)}
            className="w-full bg-[var(--color-text)] text-white px-4 py-2.5 rounded-[8px] text-[14px] font-medium hover:opacity-90 transition-opacity"
          >
            Вибрати
          </button>
        </article>
      ))}
    </section>
  );
}
