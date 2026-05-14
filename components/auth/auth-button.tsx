"use client";

type Props = {
  children: React.ReactNode;
  type?: "submit" | "button";
  disabled?: boolean;
  loading?: boolean;
};

export default function AuthButton({
  children,
  type = "button",
  disabled,
  loading,
}: Props) {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`w-full bg-[#1C1B19] text-[#FAF7F1] rounded-[8px] px-6 py-3.5 font-medium text-sm transition-colors ${
        isDisabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-[#2C2A27]"
      }`}
    >
      {loading ? "Зачекай..." : children}
    </button>
  );
}
