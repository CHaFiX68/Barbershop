import SectionHeading from "./section-heading";

export default function AboutSection() {
  return (
    <section
      id="about"
      className="py-12 md:py-16 lg:py-20 border-t border-[var(--color-line)]"
    >
      <div className="max-w-[1536px] mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            eyebrow="Про нас"
            title="Наша історія"
            align="left"
            number="02"
          />

          <div className="mt-12 max-w-3xl text-left">
            <p
              className="font-display italic leading-relaxed"
              style={{ fontSize: "clamp(17px, 2vw, 24px)" }}
            >
              «Ми не просто стрижемо — ми створюємо ритуал, у якому кожен клієнт
              почувається на своєму місці.»
            </p>
            <p
              className="mt-6 text-[var(--color-text-muted)] leading-relaxed"
              style={{ fontSize: "14px" }}
            >
              BARBER&amp;CO — це місце, де класичне ремесло барберів зустрічає
              сучасний підхід. Ми відкрились у 2015 році, і відтоді стрижка тут —
              це не поспіх, а 45 хвилин уваги до кожної деталі.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
