"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Cropper, { type Area } from "react-easy-crop";
import { getCroppedImg, type CropArea } from "@/lib/crop-utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function HeroImageEditor({
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
  const [warning, setWarning] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

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
    setWarning(null);
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const probe = new window.Image();
      probe.onload = () => {
        if (probe.naturalWidth < 2000) {
          setWarning(
            `Низька роздільна здатність (${probe.naturalWidth}×${probe.naturalHeight}). Рекомендовано мін. 2400×1200 для чіткого відображення на retina-екранах.`
          );
        }
        setImageSrc(src);
      };
      probe.onerror = () => setImageSrc(src);
      probe.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    setWarning(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    handleReset();
    setError(null);
    onClose();
  };

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setIsUploading(true);
    setError(null);
    try {
      const blob = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation,
        0.95,
        "image/webp"
      );
      const formData = new FormData();
      formData.append("file", blob, "hero.webp");
      const uploadRes = await fetch("/api/admin/hero/upload", {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) {
        const data = (await uploadRes.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? "Upload failed");
      }
      const uploadData = (await uploadRes.json()) as { url: string };

      const slidesRes = await fetch("/api/admin/hero/slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: uploadData.url }),
      });
      if (!slidesRes.ok) {
        const data = (await slidesRes.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? "Save failed");
      }

      handleReset();
      setError(null);
      onSuccess();
    } catch (err) {
      console.error(err);
      setError("Не вдалось зберегти. Спробуй ще раз.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Додати фото у hero"
      className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="bg-white rounded-[16px] p-6 w-full max-w-[880px] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-[18px] font-medium">
            Фото у hero-слайдері
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
              Обери широкоформатне фото (рекомендовано 16:9, мін. 1600×900)
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
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            {error && (
              <p className="text-red-600 text-[12px] mt-3">{error}</p>
            )}
          </div>
        ) : (
          <>
            <div
              className="relative w-full bg-[#1C1B19] rounded-[12px] overflow-hidden mb-4"
              style={{ height: "420px" }}
            >
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={16 / 8}
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

            {warning && (
              <p className="text-[12px] mb-2 text-[#8A6D2A] bg-[#F5E6C8] px-3 py-2 rounded-[6px]">
                ⚠ {warning}
              </p>
            )}

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
                  onClick={handleSave}
                  disabled={isUploading || !imageSrc || !croppedAreaPixels}
                  className="px-5 py-2 bg-[var(--color-text)] text-[var(--color-bg)] rounded-[6px] text-[13px] hover:opacity-90 disabled:opacity-50"
                >
                  {isUploading ? "Завантажую..." : "Зберегти"}
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
