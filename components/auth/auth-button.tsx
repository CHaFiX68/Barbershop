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
      className={`w-full bg-black text-white border border-transparent rounded-[8px] px-6 py-3 font-medium text-sm transition-colors ${
        isDisabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-transparent hover:text-black hover:border-black"
      }`}
    >
      {loading ? "Зачекай..." : children}
    </button>
  );
}
