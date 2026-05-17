"use client";

import { useCallback, useEffect, useState } from "react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useBooking } from "@/lib/booking-context";
import { useModalStack } from "@/lib/modal-stack-context";
import HeaderAuth from "./header-auth";
import CloseButton from "@/components/ui/close-button";
import ThemeToggle from "@/components/ui/theme-toggle";
import LocaleSwitcher from "@/components/ui/locale-switcher";
import AuthModalTrigger from "./auth/auth-modal-trigger";
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
  isEmbeddedBrowser?: boolean;
};

const NAV_KEY_MAP: Record<string, string> = {
  "#barbers": "team",
  "#works": "works",
  "#about": "about",
  "#contacts": "contacts",
  "#booking": "booking",
};

export default function Header({
  navItems,
  initialSession = null,
  isEmbeddedBrowser = false,
}: Props) {
  const t = useTranslations("header");
  const tAuth = useTranslations("auth");
  const pathname = usePathname();
  const router = useRouter();
  const booking = useBooking();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const resolveLabel = (href: string, fallback: string) => {
    const key = NAV_KEY_MAP[href];
    return key ? t(`nav.${key}`) : fallback;
  };

  const hidden = HIDE_HEADER_PATHS.has(pathname ?? "");

  useEffect(() => {
    setMounted(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);
  const { zIndex: drawerZ } = useModalStack(
    "header-mobile-drawer",
    open,
    close
  );

  // Mobile drawer anchor handler:
  // 1. preventDefault to stop native anchor jump (which would fail because
  //    modal-stack body lock blocks scroll while drawer is open).
  // 2. close() the drawer — modal-stack releases the body lock on unregister.
  // 3. wait ~100ms for the unlock to take effect, then scrollIntoView smoothly.
  //    If user is on a non-home route, fall back to router.push.
  const handleAnchorClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      e.preventDefault();
      close();
      if (pathname === "/") {
        setTimeout(() => {
          document
            .getElementById(id)
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      } else {
        router.push(`/#${id}`);
      }
    },
    [close, pathname, router]
  );

  if (hidden) return null;

  return (
    <>
      <header className={`${isEmbeddedBrowser ? "relative" : "fixed top-0 left-0 right-0"} z-40 bg-[var(--color-bg)]/80 backdrop-blur-[8px] border-b border-[var(--color-line)]`}>
        <div className="max-w-[1536px] mx-auto px-4 sm:px-6">
         <div className="max-w-6xl mx-auto h-16 md:h-20 flex items-center justify-between">
          <Link
            href="/"
            aria-label={t("logoAriaLabel")}
            className="font-display text-xl md:text-2xl tracking-tight"
            style={{ fontWeight: 600 }}
            onClick={(e) => {
              if (pathname === "/") {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
          >
            TWOBarbers
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) =>
              item.href === "#booking" ? (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => booking.open()}
                  className="nav-link text-[15px] tracking-wide font-medium bg-transparent border-0 p-0 cursor-pointer"
                >
                  {resolveLabel(item.href, item.label)}
                </button>
              ) : (
                <Link
                  key={item.href}
                  href={`/${item.href}`}
                  className="nav-link text-[15px] tracking-wide font-medium"
                >
                  {resolveLabel(item.href, item.label)}
                </Link>
              )
            )}
          </nav>

          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <div className="hidden md:block">
              <ThemeToggle />
            </div>
            <HeaderAuth initialSession={initialSession} />
            {!initialSession?.user && (
              <AuthModalTrigger
                mode="register"
                className="md:hidden text-sm bg-[var(--color-action-bg)] text-[var(--color-action-text)] rounded-[8px] px-3 py-1.5"
              >
                {tAuth("signUp")}
              </AuthModalTrigger>
            )}
            <button
              type="button"
              aria-label={t("menuOpen")}
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
      {!isEmbeddedBrowser && (
        <div
          aria-hidden="true"
          className="shrink-0 h-[calc(4rem+1px)] md:h-[calc(5rem+1px)]"
        />
      )}

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <>
                <motion.div
                  key="drawer-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="fixed inset-0 bg-black/40 md:hidden"
                  style={{ zIndex: drawerZ - 1 }}
                  onClick={close}
                  aria-hidden="true"
                />
                <motion.div
                  key="drawer-panel"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Меню"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                  className="fixed top-0 right-0 bottom-0 w-[280px] max-w-[85vw] bg-[var(--color-bg)]/85 backdrop-blur-[8px] shadow-2xl md:hidden flex flex-col"
                  style={{ zIndex: drawerZ }}
                >
                  <div className="flex items-center justify-between p-5 border-b border-[var(--color-line)]">
                    <span
                      className="font-display text-xl tracking-tight"
                      style={{ fontWeight: 600 }}
                    >
                      TWOBarbers
                    </span>
                    <CloseButton onClick={close} ariaLabel={t("menuClose")} />
                  </div>

                  <nav className="flex flex-col border-t-[0.5px] border-[var(--color-line)]">
                    {navItems.map((item) =>
                      item.href === "#booking" ? (
                        <button
                          key={item.href}
                          type="button"
                          onClick={() => {
                            close();
                            booking.open();
                          }}
                          className="block py-4 px-5 text-lg text-[var(--color-text)] hover:text-[var(--color-text-muted)] transition-colors border-b-[0.5px] border-[var(--color-line)] text-left bg-transparent w-full cursor-pointer border-x-0 border-t-0"
                        >
                          {resolveLabel(item.href, item.label)}
                        </button>
                      ) : (
                        <Link
                          key={item.href}
                          href={`/${item.href}`}
                          onClick={(e) =>
                            handleAnchorClick(e, item.href.replace("#", ""))
                          }
                          className="block py-4 px-5 text-lg text-[var(--color-text)] hover:text-[var(--color-text-muted)] transition-colors border-b-[0.5px] border-[var(--color-line)]"
                        >
                          {resolveLabel(item.href, item.label)}
                        </Link>
                      )
                    )}
                  </nav>

                  <div className="border-t border-[var(--color-line)] p-5 flex flex-col gap-4 mt-auto">
                    <div className="flex items-center justify-between">
                      <LocaleSwitcher />
                      <ThemeToggle />
                    </div>
                    {!initialSession?.user && (
                      <div className="flex flex-col gap-2">
                        <AuthModalTrigger
                          mode="login"
                          onClick={close}
                          className="w-full text-center text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors py-3 rounded-[8px] border border-[var(--color-line)]"
                        >
                          {t("signIn")}
                        </AuthModalTrigger>
                        <AuthModalTrigger
                          mode="register"
                          onClick={close}
                          className="w-full text-center text-sm bg-[var(--color-action-bg)] text-[var(--color-action-text)] rounded-[8px] py-3 hover:opacity-85 transition-opacity"
                        >
                          {tAuth("signUp")}
                        </AuthModalTrigger>
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
