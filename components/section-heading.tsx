type Props = {
  eyebrow: string;
  title: string;
  align?: "center" | "left";
};

export default function SectionHeading({ eyebrow, title, align = "center" }: Props) {
  const alignClass = align === "center" ? "text-center items-center" : "text-left items-start";
  return (
    <div className={`flex flex-col ${alignClass}`}>
      <span
        className="text-[var(--color-text-muted)]"
        style={{
          fontSize: "12px",
          letterSpacing: "0.3em",
          textTransform: "uppercase",
        }}
      >
        {eyebrow}
      </span>
      <h2
        className="font-display mt-4 leading-[1.1]"
        style={{ fontWeight: 600, fontSize: "clamp(40px, 6vw, 64px)" }}
      >
        {title}
      </h2>
      <span
        className="block mt-6 h-px bg-[var(--color-text)]"
        style={{ width: "48px" }}
      />
    </div>
  );
}
