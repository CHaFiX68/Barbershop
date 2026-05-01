import { getContentMap } from "@/lib/content";
import { SOCIALS } from "@/lib/data";
import EditableText from "./editable-text";
import SectionHeading from "./section-heading";

const CONTACTS_DEFAULTS = {
  "contacts.title": "Контакти",
  "contacts.subhead.contact": "Зв'язатись",
  "contacts.subhead.hours": "Графік роботи",
  "contacts.address": "вул. Хрещатик, 22, Київ",
  "contacts.phone": "+38 (000) 000 00 00",
  "contacts.email": "hello@barberco.ua",
  "contacts.hours.weekdays.day": "Пн — Пт",
  "contacts.hours.weekdays.time": "10:00 — 21:00",
  "contacts.hours.sat.day": "Сб",
  "contacts.hours.sat.time": "10:00 — 20:00",
  "contacts.hours.sun.day": "Нд",
  "contacts.hours.sun.time": "Вихідний",
};

function ContactRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline gap-6 py-3 border-b border-[var(--color-line)]">
      <span
        className="shrink-0 text-[var(--color-text-muted)]"
        style={{
          width: "100px",
          fontSize: "10px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: "13px", lineHeight: 1.5 }}>{children}</span>
    </div>
  );
}

export default async function ContactsSection() {
  const c = await getContentMap(CONTACTS_DEFAULTS);

  const phoneHref = `tel:+${c["contacts.phone"].replace(/\D/g, "")}`;
  const emailHref = `mailto:${c["contacts.email"]}`;

  const scheduleRows = [
    {
      dayKey: "contacts.hours.weekdays.day",
      timeKey: "contacts.hours.weekdays.time",
      closed: false,
    },
    {
      dayKey: "contacts.hours.sat.day",
      timeKey: "contacts.hours.sat.time",
      closed: false,
    },
    {
      dayKey: "contacts.hours.sun.day",
      timeKey: "contacts.hours.sun.time",
      closed: true,
    },
  ];

  return (
    <section
      id="contacts"
      className="py-12 md:py-16 lg:py-20 border-t border-[var(--color-line)]"
    >
      <div className="max-w-[1536px] mx-auto px-6">
       <div className="max-w-6xl mx-auto">
        <SectionHeading
          eyebrow="Знайти нас"
          title={c["contacts.title"]}
          align="left"
          number="03"
          titleContentKey="contacts.title"
          titleMaxLength={60}
        />

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          <div className="flex flex-col">
            <h3
              className="font-display"
              style={{ fontWeight: 600, fontSize: "20px" }}
            >
              <EditableText
                contentKey="contacts.subhead.contact"
                initialValue={c["contacts.subhead.contact"]}
                as="span"
                maxLength={40}
              />
            </h3>
            <div className="mt-6">
              <ContactRow label="Адреса">
                <EditableText
                  contentKey="contacts.address"
                  initialValue={c["contacts.address"]}
                  as="span"
                  maxLength={120}
                />
              </ContactRow>
              <ContactRow label="Телефон">
                <a href={phoneHref} className="nav-link">
                  <EditableText
                    contentKey="contacts.phone"
                    initialValue={c["contacts.phone"]}
                    as="span"
                    maxLength={50}
                  />
                </a>
              </ContactRow>
              <ContactRow label="Email">
                <a href={emailHref} className="nav-link">
                  <EditableText
                    contentKey="contacts.email"
                    initialValue={c["contacts.email"]}
                    as="span"
                    maxLength={80}
                  />
                </a>
              </ContactRow>
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
              style={{ fontWeight: 600, fontSize: "20px" }}
            >
              <EditableText
                contentKey="contacts.subhead.hours"
                initialValue={c["contacts.subhead.hours"]}
                as="span"
                maxLength={40}
              />
            </h3>
            <ul className="mt-6">
              {scheduleRows.map((row, i) => {
                const isLast = i === scheduleRows.length - 1;
                return (
                  <li
                    key={row.dayKey}
                    className={`flex items-baseline justify-between gap-4 py-2 ${
                      isLast ? "" : "border-b border-[var(--color-line)]"
                    }`}
                  >
                    <span style={{ fontSize: "13px" }}>
                      <EditableText
                        contentKey={row.dayKey}
                        initialValue={c[row.dayKey]}
                        as="span"
                        maxLength={20}
                      />
                    </span>
                    <span
                      className={
                        row.closed ? "text-[var(--color-text-muted)]" : ""
                      }
                      style={{ fontSize: "13px" }}
                    >
                      <EditableText
                        contentKey={row.timeKey}
                        initialValue={c[row.timeKey]}
                        as="span"
                        maxLength={40}
                      />
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="w-full h-full overflow-hidden border border-[var(--color-line)] min-h-[272px] lg:min-h-[340px] rounded-[16px]">
            <iframe
              src="https://maps.google.com/maps?q=Khreshchatyk+22+Kyiv&t=&z=15&ie=UTF8&iwloc=&output=embed"
              className="w-full h-full min-h-[272px] lg:min-h-[340px] border-0 block"
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
