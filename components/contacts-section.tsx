import { CONTACTS, SCHEDULE, SOCIALS } from "@/lib/data";
import SectionHeading from "./section-heading";

function ContactRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline gap-6 py-4 border-b border-[var(--color-line)]">
      <span
        className="shrink-0 text-[var(--color-text-muted)]"
        style={{
          width: "100px",
          fontSize: "11px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: "15px", lineHeight: 1.5 }}>{children}</span>
    </div>
  );
}

export default function ContactsSection() {
  return (
    <section
      id="contacts"
      className="py-16 md:py-24 lg:py-32 border-t border-[var(--color-line)]"
    >
      <div className="max-w-[1536px] mx-auto px-6">
       <div className="max-w-6xl mx-auto">
        <SectionHeading eyebrow="Знайти нас" title="Контакти" align="left" />

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          <div className="flex flex-col">
            <h3
              className="font-display"
              style={{ fontWeight: 600, fontSize: "24px" }}
            >
              Зв&apos;язатись
            </h3>
            <div className="mt-6">
              {CONTACTS.map((c) => (
                <ContactRow key={c.label} label={c.label}>
                  {c.href ? (
                    <a href={c.href} className="nav-link">
                      {c.value}
                    </a>
                  ) : (
                    c.value
                  )}
                </ContactRow>
              ))}
              <ContactRow label="Соцмережі">
                <span className="inline-flex items-center gap-3">
                  {SOCIALS.map((s, i) => (
                    <span
                      key={s.label}
                      className="inline-flex items-center gap-3"
                    >
                      <a href={s.href} className="nav-link">
                        {s.value}
                      </a>
                      {i < SOCIALS.length - 1 && (
                        <span className="text-[var(--color-text-muted)]">·</span>
                      )}
                    </span>
                  ))}
                </span>
              </ContactRow>
            </div>

            <h3
              className="font-display mt-10"
              style={{ fontWeight: 600, fontSize: "24px" }}
            >
              Графік роботи
            </h3>
            <ul className="mt-6">
              {SCHEDULE.map((row, i) => {
                const isLast = i === SCHEDULE.length - 1;
                return (
                  <li
                    key={row.day}
                    className={`flex items-baseline justify-between gap-4 py-2.5 ${
                      isLast ? "" : "border-b border-[var(--color-line)]"
                    }`}
                  >
                    <span style={{ fontSize: "14px" }}>{row.day}</span>
                    <span
                      className={
                        row.closed ? "text-[var(--color-text-muted)]" : ""
                      }
                      style={{ fontSize: "14px" }}
                    >
                      {row.day === "Нд" ? row.time.toLowerCase() : row.time}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="w-full h-full overflow-hidden border border-[var(--color-line)] min-h-[320px] lg:min-h-[400px] rounded-[16px]">
            <iframe
              src="https://maps.google.com/maps?q=Khreshchatyk+22+Kyiv&t=&z=15&ie=UTF8&iwloc=&output=embed"
              className="w-full h-full min-h-[320px] lg:min-h-[400px] border-0 block"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen={false}
              title="BARBER&CO — місцезнаходження на карті"
            />
          </div>
        </div>
       </div>
      </div>
    </section>
  );
}
