"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth-client";

export default function ProfileDropdown() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (session?.user?.name) {
      setNameValue(session.user.name);
      setDisplayName(session.user.name);
    }
  }, [session?.user?.name]);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  if (!session?.user) return null;

  const effectiveName = displayName || session.user.name;
  const initial = effectiveName?.[0]?.toUpperCase() ?? "?";

  const handleLogout = async () => {
    setIsOpen(false);
    await signOut();
    router.push("/");
    router.refresh();
  };

  const startEditingName = () => {
    setNameValue(effectiveName);
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === effectiveName) {
      setNameValue(effectiveName);
      setIsEditingName(false);
      return;
    }
    if (trimmed.length < 2) {
      setNameValue(effectiveName);
      setIsEditingName(false);
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/user/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setDisplayName(trimmed);
      router.refresh();
      setIsEditingName(false);
    } catch (err) {
      console.error("Update name failed:", err);
      setNameValue(effectiveName);
      setIsEditingName(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setNameValue(effectiveName);
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveName();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-2.5 px-2 py-1.5 rounded-[8px] hover:bg-black/5 transition-colors"
        aria-label="Меню профілю"
        aria-expanded={isOpen}
      >
        <div className="w-8 h-8 bg-[var(--color-text)] text-[var(--color-bg)] rounded-[6px] flex items-center justify-center text-[13px] font-medium">
          {initial}
        </div>
        <span className="text-[13px] text-[var(--color-text)]">
          {effectiveName}
        </span>
        <svg
          className={`w-2.5 h-2.5 text-[var(--color-text-muted)] transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path
            d="M2 4.5l4 4 4-4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-[280px] bg-white border border-[var(--color-line)] rounded-[12px] shadow-[0_12px_32px_rgba(0,0,0,0.08)] overflow-hidden z-50">
          <div className="p-[18px] border-b border-[var(--color-line)] flex items-center gap-3">
            <div className="w-12 h-12 bg-[var(--color-text)] text-[var(--color-bg)] rounded-[8px] flex items-center justify-center text-[18px] font-medium flex-shrink-0">
              {initial}
            </div>
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              {isEditingName ? (
                <input
                  ref={nameInputRef}
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={handleNameKeyDown}
                  disabled={isSaving}
                  maxLength={50}
                  className="font-display text-[16px] font-medium leading-tight bg-[#F5F0E6] border border-[var(--color-line)] rounded-[6px] px-2 py-1 outline-none focus:border-[var(--color-text)] w-full disabled:opacity-50"
                />
              ) : (
                <button
                  type="button"
                  onClick={startEditingName}
                  className="font-display text-[16px] font-medium leading-tight truncate text-left hover:text-[var(--color-text-muted)] transition-colors"
                  title="Клікни щоб редагувати"
                >
                  {effectiveName}
                </button>
              )}
              <div className="text-[11px] text-[var(--color-text-muted)] truncate">
                {session.user.email}
              </div>
            </div>
          </div>

          <div className="p-1.5">
            <Link
              href="#"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] hover:bg-[#F5F0E6] transition-colors text-[13px]"
            >
              <svg
                className="w-[18px] h-[18px] flex-shrink-0 text-[var(--color-text-muted)]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M16 3v4M8 3v4M3 10h18" />
              </svg>
              <span>Мої записи</span>
            </Link>
            <Link
              href="#"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] hover:bg-[#F5F0E6] transition-colors text-[13px]"
            >
              <svg
                className="w-[18px] h-[18px] flex-shrink-0 text-[var(--color-text-muted)]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>Чат</span>
            </Link>
            <Link
              href="#"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] hover:bg-[#F5F0E6] transition-colors text-[13px]"
            >
              <svg
                className="w-[18px] h-[18px] flex-shrink-0 text-[var(--color-text-muted)]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path d="M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12c0 1.7.4 3.3 1.2 4.7L2 22l5.3-1.2c1.4.8 3 1.2 4.7 1.2z" />
                <path d="M9.5 9.5c.5-1 1.5-1.5 2.5-1.5 1.7 0 3 1.3 3 3 0 1.5-1 2-2 2.5-.5.3-1 .5-1 1.5" />
                <circle cx="12" cy="17" r=".5" fill="currentColor" />
              </svg>
              <span>Підтримка</span>
            </Link>
          </div>

          <div className="h-px bg-[var(--color-line)] mx-1.5" />

          <div className="p-1.5">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] hover:bg-[rgba(160,48,48,0.06)] transition-colors text-[13px] text-[#A03030]"
            >
              <svg
                className="w-[18px] h-[18px] flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              <span>Вийти</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
