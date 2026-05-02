import Link from "next/link";

export const metadata = { title: "Букінг — BARBER&CO" };

export default function BookingPage() {
  return (
    <div className="max-w-[1536px] mx-auto px-6 py-16 sm:py-24">
      <div className="max-w-md mx-auto text-center">
        <p
          className="text-[var(--color-text-muted)] mb-3"
          style={{
            fontSize: "10px",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
          }}
        >
          Букінг
        </p>
        <h1
          className="font-display mb-6"
          style={{ fontWeight: 600, fontSize: "clamp(28px, 5vw, 42px)" }}
        >
          Букінг скоро з'явиться
        </h1>
        <p
          className="text-[var(--color-text-muted)] mb-8 leading-relaxed"
          style={{ fontSize: "14px" }}
        >
          Ми готуємо онлайн-запис. Поки що — телефонуйте або пишіть у соц-мережі.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center bg-[var(--color-text)] text-[var(--color-bg)] px-6 py-2.5 rounded-[8px] text-[14px] hover:opacity-90 transition-opacity"
        >
          ← На головну
        </Link>
      </div>
    </div>
  );
}
