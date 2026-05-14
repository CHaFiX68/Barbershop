"use client";

import { useEffect, useState } from "react";

export default function LavaBackground() {
  const [pattern, setPattern] = useState<number>(1);

  useEffect(() => {
    setPattern(Math.floor(Math.random() * 4) + 1);
  }, []);

  return (
    <div className="lava-bg" data-pattern={pattern} aria-hidden="true">
      <div className="lava-blob lava-b1" />
      <div className="lava-blob lava-b2" />
      <div className="lava-blob lava-b3" />
      <div className="lava-blob lava-b4" />
      <div className="lava-blob lava-b5" />
      <div className="lava-blob lava-b6" />
    </div>
  );
}
