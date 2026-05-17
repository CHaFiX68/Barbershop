"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import type { BarberPublic } from "@/lib/barbers";
import { useSession } from "@/lib/auth-client";
import { useModalStack } from "@/lib/modal-stack-context";
import { useCachedFetch } from "@/lib/use-cached-fetch";
import CloseButton from "@/components/ui/close-button";

const BookingFlow = dynamic(() => import("./booking-flow"), {
  ssr: false,
  loading: () => null,
});

type Props = {
  open: boolean;
  onClose: () => void;
  initialBarberId: string | null;
};

export default function BookingPopup({ open, onClose, initialBarberId }: Props) {
  const t = useTranslations("booking");
  const tHeader = useTranslations("header");
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();
  const { zIndex, isTop } = useModalStack("booking", open, onClose);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: barbersData, loading } = useCachedFetch<{
    barbers: BarberPublic[];
  }>(
    "booking-barbers",
    () =>
      fetch("/api/barbers")
        .then((r) => r.json() as Promise<{ barbers: BarberPublic[] }>)
        .catch(() => ({ barbers: [] })),
    open
  );
  const barbers = barbersData?.barbers ?? null;

  if (!mounted) return null;

  const userRole = session?.user?.role ?? null;
  const isBarber = userRole === "barber";
  const isAuthed = !!session?.user;

  const goToLogin = () => {
    onClose();
    const url = new URL(window.location.href);
    url.searchParams.set("auth", "login");
    window.history.pushState(null, "", `${url.pathname}${url.search}`);
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="booking-overlay"
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          style={{ zIndex }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={(e) => {
            if (e.target !== e.currentTarget) return;
            if (!isTop) return;
            onClose();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t("title")}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="w-[calc(100vw-32px)] md:w-262.5 md:max-w-[calc(100vw-64px)] h-[calc(100vh-64px)] md:h-auto md:min-h-160 md:max-h-[calc(100vh-32px)] bg-[var(--color-bg)]/85 backdrop-blur-[8px] border border-[var(--color-line)] rounded-[16px] shadow-[0_24px_48px_rgba(0,0,0,0.18)] overflow-hidden flex flex-col"
          >
            <header className="shrink-0 flex items-start justify-between px-6 md:px-8 pt-6 md:pt-8 pb-4 border-b-[0.5px] border-[var(--color-line)]">
              <h2
                className="font-display text-[var(--color-text)]"
                style={{ fontWeight: 600, fontSize: "clamp(22px, 4vw, 30px)" }}
              >
                {t("title")}
              </h2>
              <CloseButton onClick={onClose} ariaLabel={t("closeAria")} />
            </header>

            <div className="flex-1 overflow-y-auto px-6 md:px-8 pt-6 pb-6 md:pb-8 flex flex-col">
              {!isAuthed ? (
                <div className="text-center py-12">
                  <p className="italic text-[var(--color-text-muted)] text-[14px] mb-6">
                    {t("errorAuthRequired")}
                  </p>
                  <button
                    type="button"
                    onClick={goToLogin}
                    className="inline-flex items-center justify-center bg-[var(--color-action-bg)] text-[var(--color-action-text)] px-6 py-2.5 rounded-[8px] text-[14px] hover:opacity-90 transition-opacity"
                  >
                    {tHeader("signIn")}
                  </button>
                </div>
              ) : isBarber ? (
                <div className="text-center py-12 italic text-[var(--color-text-muted)] text-[14px]">
                  {t("noBarbers")}
                </div>
              ) : loading || barbers === null ? (
                <div className="text-center text-[var(--color-text-muted)] italic py-12 text-[14px]">
                  {t("loading")}
                </div>
              ) : (
                <BookingFlow
                  barbers={barbers}
                  initialBarberId={initialBarberId}
                  initialServiceId={null}
                  onSuccess={onClose}
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
