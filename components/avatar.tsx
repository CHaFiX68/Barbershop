"use client";

import Image from "next/image";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
  onClick?: () => void;
}

export default function Avatar({
  src,
  name,
  size = 32,
  className = "",
  onClick,
}: AvatarProps) {
  const initial = name?.[0]?.toUpperCase() ?? "?";
  const fontSize = Math.round(size * 0.4);
  const interactive = onClick
    ? "cursor-pointer hover:opacity-80 transition-opacity"
    : "";

  return (
    <div
      className={`relative bg-[var(--color-text)] text-[var(--color-bg)] rounded-[6px] flex items-center justify-center font-medium overflow-hidden flex-shrink-0 ${interactive} ${className}`}
      style={{ width: size, height: size, fontSize }}
      onClick={onClick}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}
