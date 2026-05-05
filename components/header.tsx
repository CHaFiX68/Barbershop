"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { useBooking } from "@/lib/booking-context";
import { useModalStack } from "@/lib/modal-stack-context";
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
  const booking = useBooking();
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

  const close = useCallback(() => setOpen(false), []);
  const { zIndex: drawerZ } = useModalStack(
    "header-mobile-drawer",
    open,
    close
  );

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
            {navItems.map((item) =>
              item.href === "#booking" ? (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => booking.open()}
                  className="nav-link text-sm tracking-wide bg-transparent border-0 p-0 cursor-pointer"
                >
                  <EditableText
                    contentKey={item.contentKey}
                    initialValue={item.label}
                    as="span"
                    maxLength={30}
                  />
                </button>
              ) : (
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
              )
            )}
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
              className="fixed inset-0 bg-black/40 md:hidden"
              style={{ zIndex: drawerZ - 1 }}
              onClick={close}
              aria-hidden="true"
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Меню"
              className="fixed top-0 right-0 bottom-0 w-[280px] max-w-[85vw] bg-[#EDEAE5] shadow-2xl md:hidden flex flex-col"
              style={{ zIndex: drawerZ }}
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

              <nav className="flex flex-col border-t-[0.5px] border-[#D5D0C8]">
                {navItems.map((item) =>
                  item.href === "#booking" ? (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => {
                        close();
                        booking.open();
                      }}
                      className="block py-4 px-5 text-lg text-[#1C1B19] hover:text-[#7A736A] transition-colors border-b-[0.5px] border-[#D5D0C8] text-left bg-transparent w-full cursor-pointer border-x-0 border-t-0"
                    >
                      <EditableText
                        contentKey={item.contentKey}
                        initialValue={item.label}
                        as="span"
                        maxLength={30}
                      />
                    </button>
                  ) : (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={close}
                      className="block py-4 px-5 text-lg text-[#1C1B19] hover:text-[#7A736A] transition-colors border-b-[0.5px] border-[#D5D0C8]"
                    >
                      <EditableText
                        contentKey={item.contentKey}
                        initialValue={item.label}
                        as="span"
                        maxLength={30}
                      />
                    </a>
                  )
                )}
              </nav>
            </div>
          </>,
          document.body
        )}
    </>
  );
}
