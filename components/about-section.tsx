import { getContentMap } from "@/lib/content";
import EditableText from "./editable-text";
import SectionHeading from "./section-heading";

const ABOUT_DEFAULTS = {
  "about.title": "Наша історія",
  "about.quote":
    "«Ми не просто стрижемо — ми створюємо ритуал, у якому кожен клієнт почувається на своєму місці.»",
  "about.body":
    "BARBER&CO — це місце, де класичне ремесло барберів зустрічає сучасний підхід. Ми відкрились у 2015 році, і відтоді стрижка тут — це не поспіх, а 45 хвилин уваги до кожної деталі.",
};

export default async function AboutSection() {
  const content = await getContentMap(ABOUT_DEFAULTS);

  return (
    <section
      id="about"
      className="py-12 md:py-16 lg:py-20 border-t border-[var(--color-line)]"
    >
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            eyebrow="Про нас"
            title={content["about.title"]}
            align="left"
            number="02"
            titleContentKey="about.title"
            titleMaxLength={80}
          />

          <div className="mt-12 max-w-3xl text-left">
            <p
              className="font-display italic leading-relaxed"
              style={{ fontSize: "clamp(17px, 2vw, 24px)" }}
            >
              <EditableText
                contentKey="about.quote"
                initialValue={content["about.quote"]}
                as="span"
                multiline
                maxLength={400}
              />
            </p>
            <p
              className="mt-6 text-[var(--color-text-muted)] leading-relaxed"
              style={{ fontSize: "14px" }}
            >
              <EditableText
                contentKey="about.body"
                initialValue={content["about.body"]}
                as="span"
                multiline
                maxLength={600}
              />
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
