"use client";

import { useEffect, useState } from "react";
import { NAV_ITEMS } from "@/lib/data";
import HeaderAuth from "./header-auth";

export default function Header() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[var(--color-line)]">
      <div className="max-w-[1536px] mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
        <a
          href="#"
          aria-label="BARBER&CO"
          className="font-display text-xl md:text-2xl tracking-tight"
          style={{ fontWeight: 600 }}
        >
          BARBER<span className="font-display font-normal mx-[1px]">&amp;</span>
          CO
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="nav-link text-sm tracking-wide"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:block">
          <HeaderAuth />
        </div>

        <button
          type="button"
          aria-label="Відкрити меню"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="md:hidden inline-flex flex-col gap-[5px] p-2 rounded-[8px]"
        >
          <span className="block w-6 h-px bg-[var(--color-text)]" />
          <span className="block w-6 h-px bg-[var(--color-text)]" />
          <span className="block w-6 h-px bg-[var(--color-text)]" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="max-w-[1536px] mx-auto px-6 h-16 w-full flex items-center justify-between border-b border-[var(--color-line)]">
            <span
              className="font-display text-xl tracking-tight"
              style={{ fontWeight: 600 }}
            >
              BARBER<span className="font-normal mx-[1px]">&amp;</span>CO
            </span>
            <button
              type="button"
              aria-label="Закрити меню"
              onClick={close}
              className="p-2 relative w-10 h-10 rounded-[8px]"
            >
              <span className="absolute left-1/2 top-1/2 w-6 h-px bg-[var(--color-text)] -translate-x-1/2 -translate-y-1/2 rotate-45" />
              <span className="absolute left-1/2 top-1/2 w-6 h-px bg-[var(--color-text)] -translate-x-1/2 -translate-y-1/2 -rotate-45" />
            </button>
          </div>
          <nav className="flex-1 flex flex-col items-center justify-center gap-8">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={close}
                className="font-display text-3xl"
                style={{ fontWeight: 600 }}
              >
                {item.label}
              </a>
            ))}
            <div className="mt-4" onClick={close}>
              <HeaderAuth />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
