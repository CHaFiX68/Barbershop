"use client";

import Link from "next/link";

type Props = {
  mode: "login" | "register";
  className?: string;
  children: React.ReactNode;
};

export default function AuthModalTrigger({
  mode,
  className,
  children,
}: Props) {
  return (
    <Link href={`?auth=${mode}`} scroll={false} className={className}>
      {children}
    </Link>
  );
}
