import Image from "next/image";
import type { BarberPublic } from "@/lib/barbers";

const TOTAL_ROWS = 6;

type Props = {
  barber: BarberPublic;
};

export default function BarberCard({ barber }: Props) {
  const services = barber.services.slice(0, TOTAL_ROWS);
  const placeholderCount = Math.max(0, TOTAL_ROWS - services.length);

  return (
    <article className="bg-white border border-[var(--color-line)] p-5 sm:p-7 grid grid-cols-1 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-5 sm:gap-7 rounded-[16px]">
      <div className="flex h-full flex-col">
        <div className="text-center">
          <h3 className="font-display text-sm sm:text-base font-medium leading-snug">
            {barber.name}
          </h3>
        </div>

        <div
          className="mt-3 flex-1 min-h-0 w-full bg-[#F5F0E8] border border-[#EAE3D5] rounded-[12px] overflow-hidden flex items-center justify-center relative"
          aria-hidden="true"
        >
          {barber.landingImage ? (
            <Image
              src={barber.landingImage}
              alt={barber.name}
              fill
              sizes="(max-width: 1024px) 100vw, 480px"
              className="object-cover"
            />
          ) : (
            <span
              className="font-display italic text-[#C9B89A] leading-none max-w-full inline-block"
              style={{ fontSize: "clamp(48px, 5vw, 88px)" }}
            >
              {barber.initials}
            </span>
          )}
        </div>

        <p className="mt-3 text-center italic text-[13px] leading-relaxed text-[var(--color-text-muted)]">
          {barber.bio}
        </p>
      </div>

      <div className="flex flex-col">
        <p
          className="text-center text-[var(--color-text-muted)]"
          style={{
            fontSize: "10px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          Послуги
        </p>

        <ul className="mt-3">
          {services.map((s, i) => (
            <li
              key={`svc-${i}`}
              className="border-b border-[var(--color-line)] py-2.5"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1px 96px",
                gap: "12px",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "13px" }}>{s.name}</span>
              <div
                style={{
                  width: "1px",
                  height: "20px",
                  background: "var(--color-line)",
                  justifySelf: "center",
                }}
                aria-hidden="true"
              />
              <span style={{ fontSize: "13px", fontWeight: 500 }}>
                {s.price}
              </span>
            </li>
          ))}
          {Array.from({ length: placeholderCount }).map((_, i) => (
            <li
              key={`placeholder-${i}`}
              className="border-b border-[var(--color-line)] py-2.5"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1px 96px",
                gap: "12px",
                alignItems: "center",
              }}
              aria-hidden="true"
            >
              <span style={{ fontSize: "13px" }}>&nbsp;</span>
              <div
                style={{
                  width: "1px",
                  height: "20px",
                  background: "var(--color-line)",
                  justifySelf: "center",
                }}
              />
              <span style={{ fontSize: "13px" }}>&nbsp;</span>
            </li>
          ))}
        </ul>

        <div className="flex-1 min-h-8" aria-hidden="true" />

        <a
          href="#booking"
          className="self-center inline-flex items-center justify-center bg-black text-white border border-transparent px-6 py-2.5 transition-colors hover:bg-transparent hover:text-black hover:border-black rounded-[8px]"
          style={{ fontSize: "14px" }}
        >
          Записатись
        </a>
      </div>
    </article>
  );
}
