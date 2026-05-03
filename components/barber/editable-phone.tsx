"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  phone: string;
  onChange: (next: string) => void;
};

const MAX = 20;

export default function EditablePhone({ phone, onChange }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(phone);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) setValue(phone);
  }, [phone, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    const next = value.slice(0, MAX);
    if (next !== phone) {
      onChange(next);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setValue(phone);
      setIsEditing(false);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="tel"
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, MAX))}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        maxLength={MAX}
        placeholder="Номер телефону"
        className="w-full text-[14px] font-medium text-center text-[var(--color-text)] bg-[#F5F0E6] border border-[var(--color-line)] rounded-[6px] px-2 py-1.5 outline-none focus:border-[var(--color-text)]"
      />
    );
  }

  const isEmpty = !phone.trim();

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className={`w-full text-[14px] text-center transition-colors py-1.5 px-2 rounded-[6px] border border-dashed border-[#C9B89A] hover:border-solid hover:bg-[#F5F0E6] ${
        isEmpty
          ? "italic text-[#A03030] hover:text-[#1C1B19]"
          : "font-medium text-[var(--color-text)]"
      }`}
      title="Клікни щоб редагувати"
    >
      {phone || "Введіть номер телефону"}
    </button>
  );
}
