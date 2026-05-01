import EditableText from "./editable-text";

type Props = {
  eyebrow: string;
  title: string;
  align?: "center" | "left";
  number?: string;
  titleContentKey?: string;
  titleMaxLength?: number;
};

export default function SectionHeading({
  eyebrow,
  title,
  align = "center",
  number,
  titleContentKey,
  titleMaxLength,
}: Props) {
  const alignClass =
    align === "center" ? "text-center items-center" : "text-left items-start";
  return (
    <div className={`flex flex-col ${alignClass}`}>
      {number ? (
        <div
          className="hidden lg:block font-display text-[11px] tracking-[0.2em] text-[var(--color-text-muted)] mb-3"
          aria-hidden="true"
        >
          — {number}
        </div>
      ) : null}
      <span
        className="text-[var(--color-text-muted)]"
        style={{
          fontSize: "10px",
          letterSpacing: "0.3em",
          textTransform: "uppercase",
        }}
      >
        {eyebrow}
      </span>
      <h2
        className="font-display mt-4 leading-[1.1]"
        style={{ fontWeight: 600, fontSize: "clamp(34px, 5vw, 54px)" }}
      >
        {titleContentKey ? (
          <EditableText
            contentKey={titleContentKey}
            initialValue={title}
            as="span"
            maxLength={titleMaxLength ?? 120}
          />
        ) : (
          title
        )}
      </h2>
      <span
        className="block mt-6 h-px bg-[var(--color-text)]"
        style={{ width: "40px" }}
      />
    </div>
  );
}
