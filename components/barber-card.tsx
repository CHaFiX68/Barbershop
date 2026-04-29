import type { Barber } from "@/lib/data";

const TOTAL_ROWS = 6;

type Props = {
  barber: Barber;
};

export default function BarberCard({ barber }: Props) {
  return (
    <article className="bg-white border border-[var(--color-line)] p-6 sm:p-8 grid grid-cols-1 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-6 sm:gap-8 rounded-[16px]">
      <div className="flex h-full flex-col">
        <div className="text-center">
          <h3 className="font-display text-sm sm:text-base font-medium leading-snug">
            {barber.name}
          </h3>
        </div>

        <div
          className="mt-3 flex-1 min-h-0 w-full bg-[#F5F0E8] border border-[#EAE3D5] rounded-[12px] overflow-hidden flex items-center justify-center"
          aria-hidden="true"
        >
          <span
            className="font-display italic text-[#C9B89A] leading-none max-w-full inline-block"
            style={{ fontSize: "clamp(48px, 5vw, 88px)" }}
          >
            {barber.initials}
          </span>
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
          {barber.services.map((service) => (
            <li
              key={service.id}
              className="flex justify-between items-center py-3 border-b border-[var(--color-line)]"
            >
              <span style={{ fontSize: "13px" }}>{service.name}</span>
              <span
                className="shrink-0 border-l border-[var(--color-line)] pl-4 ml-4"
                style={{ fontSize: "13px", fontWeight: 500 }}
              >
                {service.priceUah} грн
              </span>
            </li>
          ))}
          {Array.from({
            length: Math.max(0, TOTAL_ROWS - barber.services.length),
          }).map((_, i) => (
            <li
              key={`placeholder-${i}`}
              className="flex justify-between items-center py-3 border-b border-[var(--color-line)]"
              aria-hidden="true"
            >
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
