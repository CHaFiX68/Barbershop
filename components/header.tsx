"use client";

import { useEffect, useState } from "react";
import HeaderAuth from "./header-auth";
import EditableText from "./editable-text";

type NavItem = {
  href: string;
  label: string;
  contentKey: string;
};

type Props = {
  navItems: NavItem[];
};

export default function Header({ navItems }: Props) {
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
    <header className="sticky top-0 z-40 bg-[#EDEAE5]/85 backdrop-blur-[8px] border-b border-[var(--color-line)]">
      <div className="max-w-[1536px] mx-auto px-6">
       <div className="max-w-6xl mx-auto h-16 md:h-20 flex items-center justify-between">
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
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="nav-link text-sm tracking-wide"
            >
              <EditableText
                contentKey={item.contentKey}
                initialValue={item.label}
                as="span"
                maxLength={30}
              />
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
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-[var(--color-bg)] flex flex-col">
          <div className="max-w-[1536px] mx-auto px-6 w-full border-b border-[var(--color-line)]">
           <div className="max-w-6xl mx-auto h-16 flex items-center justify-between">
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
          </div>
          <nav className="flex-1 flex flex-col items-center justify-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={close}
                className="font-display text-3xl"
                style={{ fontWeight: 600 }}
              >
                <EditableText
                  contentKey={item.contentKey}
                  initialValue={item.label}
                  as="span"
                  maxLength={30}
                />
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
