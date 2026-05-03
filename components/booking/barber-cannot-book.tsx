import Link from "next/link";

export default function BarberCannotBook() {
  return (
    <div className="max-w-[640px] mx-auto px-6 py-16 sm:py-24 text-center">
      <h1
        className="font-display mb-6 text-[var(--color-text)]"
        style={{ fontWeight: 600, fontSize: "clamp(28px, 5vw, 42px)" }}
      >
        Барбери не можуть бронювати у себе
      </h1>
      <p
        className="text-[var(--color-text-muted)] mb-8 leading-relaxed"
        style={{ fontSize: "14px" }}
      >
        Цей кабінет створений для стрижки клієнтів. Якщо ви бажаєте записатись
        до іншого барбера — створіть окремий обліковий запис клієнта.
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
