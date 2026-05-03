import Link from "next/link";

const WEEKDAY_FULL = [
  "Неділя",
  "Понеділок",
  "Вівторок",
  "Середа",
  "Четвер",
  "П'ятниця",
  "Субота",
];
const MONTH_GENITIVE = [
  "січня",
  "лютого",
  "березня",
  "квітня",
  "травня",
  "червня",
  "липня",
  "серпня",
  "вересня",
  "жовтня",
  "листопада",
  "грудня",
];

function formatDayLong(d: Date): string {
  return `${WEEKDAY_FULL[d.getDay()]}, ${d.getDate()} ${MONTH_GENITIVE[d.getMonth()]}`;
}

type Props = {
  barberName: string;
  serviceName: string;
  date: Date;
  time: string;
};

export default function StepSuccess({
  barberName,
  serviceName,
  date,
  time,
}: Props) {
  return (
    <div className="text-center py-12 max-w-[560px] mx-auto">
      <div
        className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
        style={{ background: "#F5F0E6" }}
      >
        <svg
          className="w-10 h-10 text-[#C9B89A]"
          viewBox="0 0 48 48"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <circle cx="24" cy="24" r="20" />
          <path
            d="M16 24l6 6 12-14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h2
        className="font-display text-[var(--color-text)] mb-3"
        style={{ fontWeight: 500, fontSize: "clamp(24px, 4vw, 32px)" }}
      >
        Дякуємо! Ваш запис створено
      </h2>
      <p
        className="text-[var(--color-text)] mb-2 leading-relaxed"
        style={{ fontSize: "14px" }}
      >
        Ми чекаємо вас {formatDayLong(date)} о {time} у {barberName} на «
        {serviceName}».
      </p>
      <p
        className="text-[var(--color-text-muted)] italic mb-8 leading-relaxed"
        style={{ fontSize: "13px" }}
      >
        Якщо плани зміняться — ви можете скасувати запис у розділі «Мої записи».
      </p>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <Link
          href="/my-bookings"
          className="inline-flex items-center justify-center bg-[var(--color-text)] text-white px-6 py-2.5 rounded-[8px] text-[14px] hover:opacity-90 transition-opacity"
        >
          Мої записи
        </Link>
        <Link
          href="/"
          className="text-[#C9B89A] hover:text-[var(--color-text)] text-[14px] hover:underline transition-colors px-3 py-2"
        >
          На головну
        </Link>
      </div>
    </div>
  );
}
