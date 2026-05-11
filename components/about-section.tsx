import { getTranslations } from "next-intl/server";
import { getContentMap } from "@/lib/content";
import EditableText from "./editable-text";

export default async function AboutSection() {
  const t = await getTranslations("sections.about");
  const title = t("title");
  const content = await getContentMap({
    "about.quote": t("tagline"),
    "about.body": t("body"),
  });

  return (
    <section
      id="about"
      className="py-12 md:py-16 lg:py-20 border-t border-[var(--color-line)] scroll-mt-16 md:scroll-mt-20"
    >
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col text-left items-start">
            <div
              className="hidden lg:block font-display text-[11px] tracking-[0.2em] text-[var(--color-text-muted)] mb-3"
              aria-hidden="true"
            >
              — 03
            </div>
            <span
              className="text-[var(--color-text-muted)]"
              style={{
                fontSize: "10px",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
              }}
            >
              {t("eyebrow")}
            </span>
            <h2
              className="font-display mt-4 leading-[1.1]"
              style={{ fontWeight: 600, fontSize: "clamp(29px, 4.25vw, 46px)" }}
            >
              {title}
            </h2>
            <span
              className="block mt-6 h-px bg-[var(--color-text)]"
              style={{ width: "40px" }}
            />
          </div>

          <div className="mt-12 max-w-3xl text-left">
            <p
              className="font-display italic leading-relaxed"
              style={{ fontSize: "clamp(15px, 1.7vw, 20px)" }}
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
              style={{ fontSize: "13px" }}
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
