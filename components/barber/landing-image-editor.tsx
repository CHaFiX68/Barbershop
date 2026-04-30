"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Cropper, { type Area } from "react-easy-crop";
import { getCroppedImg, type CropArea } from "@/lib/crop-utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (url: string) => void;
}

export default function LandingImageEditorModal({
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(
    null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  const onCropComplete = useCallback(
    (_: Area, areaPixels: Area) => {
      setCroppedAreaPixels(areaPixels);
    },
    []
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Тільки зображення");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Максимум 5MB");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    handleReset();
    setError(null);
    onClose();
  };

  const handleApply = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setIsUploading(true);
    setError(null);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      const formData = new FormData();
      formData.append("file", blob, "landing.jpg");
      const res = await fetch("/api/barber/landing-image", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? "Upload failed");
      }
      const data = (await res.json()) as { url: string };
      onSuccess(data.url);
      router.refresh();
      handleClose();
    } catch (err) {
      console.error(err);
      setError("Не вдалось завантажити. Спробуй ще раз.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Редагувати фото на лендингу"
      className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="bg-white rounded-[16px] p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-[18px] font-medium">
            Фото на лендингу
          </h2>
          <button
            type="button"
            aria-label="Закрити"
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            ✕
          </button>
        </div>

        {!imageSrc ? (
          <div className="border-2 border-dashed border-[var(--color-line)] rounded-[12px] p-8 text-center">
            <p className="text-[13px] text-[var(--color-text-muted)] mb-4">
              Обери фото зі свого пристрою
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 bg-[var(--color-text)] text-[var(--color-bg)] rounded-[8px] text-[13px] hover:opacity-90 transition-opacity"
            >
              Вибрати файл
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            {error && (
              <p className="text-red-600 text-[12px] mt-3">{error}</p>
            )}
          </div>
        ) : (
          <>
            <div className="relative w-full h-[360px] bg-[#1C1B19] rounded-[12px] overflow-hidden mb-4">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={3 / 4}
                cropShape="rect"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                restrictPosition={true}
                style={{
                  cropAreaStyle: {
                    borderRadius: "12px",
                  },
                }}
              />
            </div>

            <div className="flex items-center gap-4 mb-3">
              <span className="text-[11px] text-[var(--color-text-muted)] w-10">
                Zoom
              </span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="w-8 h-8 flex items-center justify-center border border-[var(--color-line)] rounded-[6px] text-[var(--color-text-muted)] hover:bg-[#F5F0E6]"
                title="Обернути"
              >
                ↻
              </button>
            </div>

            {error && (
              <p className="text-red-600 text-[12px] mb-2">{error}</p>
            )}

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-[var(--color-line)]">
              <button
                type="button"
                onClick={handleReset}
                disabled={isUploading}
                className="text-[13px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-50"
              >
                Скинути
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isUploading}
                  className="px-4 py-2 text-[13px] hover:bg-[#F5F0E6] rounded-[6px] disabled:opacity-50"
                >
                  Скасувати
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={isUploading || !imageSrc || !croppedAreaPixels}
                  className="px-5 py-2 bg-[var(--color-text)] text-[var(--color-bg)] rounded-[6px] text-[13px] hover:opacity-90 disabled:opacity-50"
                >
                  {isUploading ? "Завантаження..." : "Застосувати"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
