"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import Cropper, { type Area } from "react-easy-crop";
import { getCroppedImg, type CropArea } from "@/lib/crop-utils";
import { useModalStack } from "@/lib/modal-stack-context";
import CloseButton from "@/components/ui/close-button";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function WorkImageEditor({
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
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("editors");
  const tCommon = useTranslations("common");

  useEffect(() => {
    setMounted(true);
  }, []);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(t("onlyImages"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(t("maxSize"));
      return;
    }
    setError(null);
    setWarning(null);
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const probe = new window.Image();
      probe.onload = () => {
        if (probe.naturalWidth < 800 || probe.naturalHeight < 800) {
          setWarning(
            t("lowResWarning", { width: probe.naturalWidth, height: probe.naturalHeight, min: "1000×1000" })
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
    setCaption("");
    setWarning(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = useCallback(() => {
    handleReset();
    setError(null);
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  const { zIndex, isTop } = useModalStack(
    "work-image-editor",
    isOpen,
    handleClose
  );

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
      formData.append("file", blob, "work.webp");
      const uploadRes = await fetch("/api/admin/works/upload", {
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

      const worksRes = await fetch("/api/admin/works", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: uploadData.url,
          caption: caption.trim() || null,
        }),
      });
      if (!worksRes.ok) {
        const data = (await worksRes.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? "Save failed");
      }

      handleReset();
      setError(null);
      onSuccess();
    } catch (err) {
      console.error(err);
      setError(t("saveError"));
    } finally {
      setIsUploading(false);
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("addWorkAria")}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      style={{ zIndex }}
      onMouseDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (!isTop) return;
        handleClose();
      }}
    >
      <div className="bg-[var(--color-bg)]/85 backdrop-blur-[8px] rounded-[16px] w-full max-w-[640px] max-h-[90vh] overflow-hidden flex flex-col">
        <div className="overflow-y-auto custom-scrollbar p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-[18px] font-medium">
            {t("workTitle")}
          </h2>
          <CloseButton onClick={handleClose} />
        </div>

        {!imageSrc ? (
          <div className="border-2 border-dashed border-[var(--color-line)] rounded-[12px] p-8 text-center">
            <p className="text-[13px] text-[var(--color-text-muted)] mb-4">
              {t("selectFromDevice")}
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 bg-[var(--color-action-bg)] text-[var(--color-action-text)] rounded-[8px] text-[13px] hover:opacity-90 transition-opacity"
            >
              {t("selectFile")}
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
            <div className="relative w-full aspect-square bg-[var(--color-text)] rounded-[12px] overflow-hidden mb-4">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                cropShape="rect"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                zoomWithScroll={false}
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
                className="w-8 h-8 flex items-center justify-center border border-[var(--color-line)] rounded-[6px] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
                title={t("rotate")}
              >
                ↻
              </button>
            </div>

            <div className="mt-4">
              <label
                className="block text-[var(--color-text-muted)] mb-1.5"
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                }}
              >
                {t("captionLabel")}
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={t("captionPlaceholder")}
                maxLength={100}
                className="w-full px-3 py-2.5 rounded-[8px] border border-[var(--color-line)] bg-[var(--color-surface)] text-[13px] outline-none focus:border-[var(--color-text)] transition-colors"
              />
              <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                {caption.length}/100
              </p>
              {caption.trim() === "" && (
                <p className="mt-1 text-[11px] text-[var(--color-danger)]">
                  {t("captionRequired")}
                </p>
              )}
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
                {t("reset")}
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isUploading}
                  className="px-4 py-2 text-[13px] hover:bg-[var(--color-surface-2)] rounded-[6px] disabled:opacity-50"
                >
                  {tCommon("cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isUploading || !imageSrc || !croppedAreaPixels || !caption.trim()}
                  className="px-5 py-2 bg-[var(--color-action-bg)] text-[var(--color-action-text)] rounded-[6px] text-[13px] hover:opacity-90 disabled:opacity-50"
                >
                  {isUploading ? t("uploading") : tCommon("save")}
                </button>
              </div>
            </div>
          </>
        )}
        </div>
      </div>
    </div>,
    document.body
  );
}
