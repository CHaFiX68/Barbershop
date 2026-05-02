"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import HeroImageEditor from "./hero-image-editor";

type Props = {
  isAdmin: boolean;
  currentSlideId: string | null;
  hasSlides: boolean;
};

export default function HeroSliderControls({
  isAdmin,
  currentSlideId,
  hasSlides,
}: Props) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!isAdmin) return null;

  const handleDelete = async () => {
    if (!currentSlideId) return;
    if (!confirm("Видалити поточне фото?")) return;
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/hero/slides/${currentSlideId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setError("Не вдалося видалити");
      setTimeout(() => setError(null), 2000);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditorSuccess = () => {
    setIsEditorOpen(false);
    router.refresh();
  };

  return (
    <>
      <div className="absolute bottom-6 right-6 flex items-center gap-2 z-30 pointer-events-auto">
        {error && (
          <span className="text-[12px] text-[#A03030] bg-white/95 px-3 py-1.5 rounded-[6px] shadow-md">
            {error}
          </span>
        )}

        {hasSlides && currentSlideId && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label="Видалити поточне фото"
            title="Видалити поточне фото"
            className="w-10 h-10 flex items-center justify-center bg-white/95 hover:bg-white text-[#A03030] rounded-full transition-colors shadow-md disabled:opacity-50 cursor-pointer"
          >
            <svg
              className="w-[16px] h-[16px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsEditorOpen(true)}
          aria-label="Додати фото"
          title="Додати фото"
          className="w-10 h-10 flex items-center justify-center bg-white/95 hover:bg-white text-[#1C1B19] rounded-full transition-colors shadow-md cursor-pointer"
        >
          <svg
            className="w-[18px] h-[18px]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <HeroImageEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSuccess={handleEditorSuccess}
      />
    </>
  );
}
