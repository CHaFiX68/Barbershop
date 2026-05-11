type Props = {
  label: string;
  error?: string;
} & React.ComponentProps<"input">;

export default function AuthInput({ label, error, name, id, ...rest }: Props) {
  const inputId = id ?? name;
  return (
    <div className="mb-5">
      <label
        htmlFor={inputId}
        className="block mb-2 text-[var(--color-text-muted)]"
        style={{
          fontSize: "13px",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        {...rest}
        className="auth-static-input w-full px-4 py-3 bg-white border border-[#D5D0C8] rounded-[8px] outline-none transition-colors focus:border-[#1C1B19] text-[#1C1B19] caret-[#1C1B19] placeholder:text-[#1C1B19]/50"
        style={{
          fontSize: "15px",
          cursor: "text",
          caretColor: "#1C1B19",
          color: "#1C1B19",
          WebkitTextFillColor: "#1C1B19",
        }}
      />
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
