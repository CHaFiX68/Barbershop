"use client";

import { Link } from "@/i18n/navigation";

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
  return (
    <Link
      href={`?auth=${mode}`}
      scroll={false}
      className={className}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}
