"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "lava-pattern";

export default function LavaBackground() {
  const [pattern, setPattern] = useState<number>(1);
  const pathname = usePathname();

  useEffect(() => {
    // Read what the user saw last time (persists across F5 within tab session).
    const stored = Number(sessionStorage.getItem(STORAGE_KEY)) || 0;
    let next = Math.floor(Math.random() * 4) + 1;
    while (next === stored) {
      next = Math.floor(Math.random() * 4) + 1;
    }
    sessionStorage.setItem(STORAGE_KEY, String(next));
    setPattern(next);
  }, [pathname]);

  return (
    <div className="lava-bg" data-pattern={pattern} aria-hidden="true">
      <div className="lava-blob lava-b1" />
      <div className="lava-blob lava-b2" />
      <div className="lava-blob lava-b3" />
      <div className="lava-blob lava-b4" />
      <div className="lava-blob lava-b5" />
      <div className="lava-blob lava-b6" />
      <div className="lava-blob lava-b7" />
      <div className="lava-blob lava-b8" />
      <div className="lava-blob lava-b9" />
      <div className="lava-blob lava-b10" />
      <div className="lava-blob lava-b11" />
      <div className="lava-blob lava-b12" />
      <div className="lava-blob lava-b13" />
      <div className="lava-blob lava-b14" />
      <div className="lava-blob lava-b15" />
    </div>
  );
}
