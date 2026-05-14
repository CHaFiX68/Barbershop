import { getTranslations } from "next-intl/server";
import { getContent } from "@/lib/content";
import EditableText from "./editable-text";

export default async function Footer() {
  const t = await getTranslations("footer");
  const copyright = await getContent("footer.copyright", t("copyright"));
  return (
    <footer className="border-t border-[var(--color-line)] py-6 mt-auto">
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6">
        <div className="max-w-[1400px] mx-auto text-center">
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
        </div>
      </div>
    </footer>
  );
}
