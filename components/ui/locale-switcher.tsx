"use client";

import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTransition } from "react";

const LOCALES = ["en", "sv"] as const;

export default function LocaleSwitcher() {
  const t = useTranslations("header");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const switchTo = (next: "en" | "sv") => {
    if (next === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  };

  return (
    <div
      className="flex items-center text-[12px] font-medium border border-[var(--color-text)] rounded-[8px] overflow-hidden"
      aria-label="Language"
    >
      {LOCALES.map((code) => {
        const isActive = locale === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => switchTo(code)}
            disabled={pending}
            aria-label={
              code === "en" ? t("localeSwitcherEn") : t("localeSwitcherSv")
            }
            className={`relative px-2.5 py-1 transition-colors ${
              isActive
                ? "text-[var(--color-action-text)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="locale-pill"
                className="absolute inset-0 bg-[var(--color-action-bg)]"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative z-10">{code.toUpperCase()}</span>
          </button>
        );
      })}
    </div>
  );
}
