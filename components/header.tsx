"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import HeaderAuth from "./header-auth";
import EditableText from "./editable-text";
import type { InitialSession } from "./profile-dropdown";

const HIDE_HEADER_PATHS = new Set(["/login", "/register"]);

type NavItem = {
  href: string;
  label: string;
  contentKey: string;
};

type Props = {
  navItems: NavItem[];
  initialSession?: InitialSession;
};

export default function Header({ navItems, initialSession = null }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const hidden = HIDE_HEADER_PATHS.has(pathname ?? "");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previous;
      };
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const close = () => setOpen(false);

  if (hidden) return null;

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#EDEAE5]/85 backdrop-blur-[8px] border-b border-[var(--color-line)]">
        <div className="max-w-[1536px] mx-auto px-4 sm:px-6">
         <div className="max-w-6xl mx-auto h-16 md:h-20 flex items-center justify-between">
          <Link
            href="/"
            aria-label="BARBER&CO — на головну"
            className="font-display text-xl md:text-2xl tracking-tight"
            style={{ fontWeight: 600 }}
          >
            BARBER<span className="font-display font-normal mx-[1px]">&amp;</span>
            CO
          </Link>

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

          <div className="flex items-center gap-2">
            <HeaderAuth initialSession={initialSession} />
            <button
              type="button"
              aria-label="Відкрити меню"
              aria-expanded={open}
              onClick={() => setOpen(true)}
              className="md:hidden inline-flex flex-col gap-[5px] p-2 rounded-[8px] hover:bg-black/5 transition-colors"
            >
              <span className="block w-6 h-px bg-[var(--color-text)]" />
              <span className="block w-6 h-px bg-[var(--color-text)]" />
              <span className="block w-6 h-px bg-[var(--color-text)]" />
            </button>
          </div>
         </div>
        </div>
      </header>

      {mounted &&
        open &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[55] bg-black/40 md:hidden"
              onClick={close}
              aria-hidden="true"
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Меню"
              className="fixed top-0 right-0 bottom-0 z-[56] w-[280px] max-w-[85vw] bg-[#EDEAE5] shadow-2xl md:hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-[var(--color-line)]">
                <span
                  className="font-display text-xl tracking-tight"
                  style={{ fontWeight: 600 }}
                >
                  BARBER
                  <span className="font-normal mx-[1px]">&amp;</span>CO
                </span>
                <button
                  type="button"
                  aria-label="Закрити меню"
                  onClick={close}
                  className="relative w-10 h-10 rounded-[8px] hover:bg-black/5 transition-colors"
                >
                  <span className="absolute left-1/2 top-1/2 w-5 h-px bg-[var(--color-text)] -translate-x-1/2 -translate-y-1/2 rotate-45" />
                  <span className="absolute left-1/2 top-1/2 w-5 h-px bg-[var(--color-text)] -translate-x-1/2 -translate-y-1/2 -rotate-45" />
                </button>
              </div>

              <nav className="flex flex-col p-3 gap-1">
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    className="py-3 px-4 rounded-[8px] hover:bg-[#F5F0E6] text-[16px] font-medium transition-colors"
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
            </div>
          </>,
          document.body
        )}
    </>
  );
}
