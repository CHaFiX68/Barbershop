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
        className="w-full px-4 py-3 bg-white border border-[var(--color-line)] rounded-[8px] outline-none transition-colors focus:border-black"
        style={{ fontSize: "15px" }}
      />
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
