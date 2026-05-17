"use client";

type Props = {
  mode: "login" | "register";
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
};

export default function AuthModalTrigger({
  mode,
  className,
  onClick,
  children,
}: Props) {
  const handleClick = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("auth", mode);
    window.history.pushState(null, "", `${url.pathname}${url.search}`);
    onClick?.();
  };
  return (
    <button type="button" onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
