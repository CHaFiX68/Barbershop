import { getContent } from "@/lib/content";
import EditableText from "./editable-text";

const FOOTER_COPYRIGHT_DEFAULT = "© 2026 BARBER&CO. Всі права захищені.";

export default async function Footer() {
  const copyright = await getContent(
    "footer.copyright",
    FOOTER_COPYRIGHT_DEFAULT
  );
  return (
    <footer className="border-t border-[var(--color-line)] py-6 mt-auto">
      <div className="max-w-[1536px] mx-auto px-6">
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
        </div>
      </div>
    </footer>
  );
}
