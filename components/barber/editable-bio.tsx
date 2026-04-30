"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  bio: string;
  onChange: (next: string) => void;
};

const MAX = 60;

export default function EditableBio({ bio, onChange }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(bio);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isEditing) setValue(bio);
  }, [bio, isEditing]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    const next = value.slice(0, MAX);
    if (next !== bio) {
      onChange(next);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setValue(bio);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, MAX))}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          maxLength={MAX}
          rows={3}
          className="w-full font-display italic text-[14px] text-[var(--color-text-muted)] bg-[#F5F0E6] border border-[var(--color-line)] rounded-[6px] p-2 pr-12 resize-none outline-none focus:border-[var(--color-text)]"
        />
        <span className="absolute bottom-2 right-2 text-[10px] text-[var(--color-text-muted)]">
          {value.length}/{MAX}
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className="w-full font-display italic text-[14px] text-[var(--color-text-muted)] text-center min-h-[40px] hover:text-[var(--color-text)] transition-colors"
      title="Клікни щоб редагувати"
    >
      {bio || "Клікни щоб додати опис..."}
    </button>
  );
}
