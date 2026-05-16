import { getTranslations } from "next-intl/server";
import { getContent } from "@/lib/content";
import EditableText from "./editable-text";

export default async function Footer() {
  const t = await getTranslations("footer");
  const copyright = await getContent("footer.copyright", t("copyright"));
  return (
    <footer className="border-t border-[var(--color-line)] py-6 mt-auto">
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6">
        <div className="max-w-6xl mx-auto text-center">
          <p
            className="text-[var(--color-text-muted)]"
            style={{ fontSize: "13px" }}
          >
            <EditableText
              contentKey="footer.copyright"
              initialValue={copyright}
              as="span"
              maxLength={200}
            />
          </p>
          <div className="flex items-center justify-center gap-3.5 mt-4">
            <span
              className="h-px w-12 bg-[var(--color-bronze)]"
              aria-hidden="true"
            />
            <a
              href="https://tessel.studio/uk"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              style={{
                fontSize: "11px",
                letterSpacing: "2.5px",
                fontWeight: 500,
              }}
            >
              BUILT BY TESSEL.STUDIO
              <span
                className="text-[var(--color-danger)]"
                aria-hidden="true"
              >
                &rarr;
              </span>
            </a>
            <span
              className="h-px w-12 bg-[var(--color-bronze)]"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
