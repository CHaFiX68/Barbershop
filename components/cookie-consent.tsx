"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";

const STORAGE_KEY = "cookie-consent";

export default function CookieConsent() {
  const t = useTranslations("cookies");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) setVisible(true);
    } catch {
      // localStorage недоступний — не показуємо
    }
  }, []);

  const handleChoice = (choice: "accepted" | "declined") => {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // ignore
    }
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-bg)]/95 backdrop-blur-[8px] border-t border-[var(--color-line)]"
          role="dialog"
          aria-label={t("title")}
        >
          <div className="max-w-[1536px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
            <p
              className="flex-1 text-[var(--color-text-muted)] text-center sm:text-left"
              style={{ fontSize: "13px", lineHeight: 1.5 }}
            >
              {t("message")}
            </p>
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => handleChoice("declined")}
                className="px-4 py-2 rounded-[8px] text-[13px] border border-[var(--color-line)] text-[var(--color-text)] hover:bg-[var(--color-surface)] hover:border-[var(--color-text)] transition-colors"
              >
                {t("decline")}
              </button>
              <button
                type="button"
                onClick={() => handleChoice("accepted")}
                className="px-4 py-2 rounded-[8px] text-[13px] bg-[var(--color-action-bg)] text-[var(--color-action-text)] hover:opacity-90 transition-opacity"
              >
                {t("accept")}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
