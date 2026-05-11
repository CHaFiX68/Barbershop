"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import WorkImageEditor from "./work-image-editor";

export default function WorksControls() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const t = useTranslations("sections.works");
  const handleSuccess = () => {
    setIsOpen(false);
    router.refresh();
  };
  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={t("addAria")}
        title={t("addAria")}
        className="inline-flex items-center justify-center w-10 h-10 bg-[var(--color-surface)] border border-[var(--color-line)] hover:bg-[var(--color-action-bg)] hover:text-[var(--color-action-text)] hover:border-[var(--color-text)] rounded-full transition-colors cursor-pointer"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      </button>
      <WorkImageEditor
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
