"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth-client";
import { useChatActions } from "@/lib/chat-context";
import Avatar from "./avatar";
import AvatarEditorModal from "./avatar-editor-modal";
import AnketaModal from "./barber/anketa-modal";
import ManagementModal from "./admin/management-modal";

export type InitialSession = {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: string | null;
  };
} | null;

type Props = {
  initialSession?: InitialSession;
};

export default function ProfileDropdown({ initialSession = null }: Props) {
  const { data: clientSession } = useSession();
  const { openChat, requestOpenSupport } = useChatActions();
  // Defensive: prefer client data when available, fall back to server initial.
  // Survives transient null states during back/forward navigation.
  // Logout flow: signOut → router.push + router.refresh → server re-renders
  // with initialSession=null → component returns null → user menu hides.
  const session = clientSession ?? initialSession;
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isAvatarEditorOpen, setIsAvatarEditorOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isAnketaOpen, setIsAnketaOpen] = useState(false);
  const [isManagementOpen, setIsManagementOpen] = useState(false);
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
    if (session?.user) {
      setAvatarUrl(session.user.image ?? null);
    }
  }, [session?.user?.image]);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      setIsAnimating(true);
      const timeout = setTimeout(() => {
        setIsAnimating(false);
      }, 16);
      return () => clearTimeout(timeout);
    } else if (isMounted) {
      setIsAnimating(true);
      const timeout = setTimeout(() => {
        setIsMounted(false);
        setIsAnimating(false);
      }, 160);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen && !isAnketaOpen && !isManagementOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideDropdown = dropdownRef.current?.contains(target);
      const insideAnketaModal = (e.target as HTMLElement)?.closest?.(
        "[data-anketa-modal]"
      );
      const insideManagementModal = (e.target as HTMLElement)?.closest?.(
        "[data-management-modal]"
      );
      if (insideDropdown || insideAnketaModal || insideManagementModal) return;
      if (isAnketaOpen) {
        setIsAnketaOpen(false);
        return;
      }
      if (isManagementOpen) {
        setIsManagementOpen(false);
        return;
      }
      if (isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, isAnketaOpen, isManagementOpen]);

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
  const role = session.user.role ?? "user";
  const isBarberRole = role === "barber";
  const isAdminRole = role === "admin";

  const handleLogout = async () => {
    setIsOpen(false);
    setIsAnketaOpen(false);
    setIsManagementOpen(false);
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

  const handleAvatarUploadSuccess = (url: string) => {
    setAvatarUrl(url);
    setIsAvatarEditorOpen(false);
    router.refresh();
  };

  const closeAll = () => {
    setIsOpen(false);
    setIsAnketaOpen(false);
    setIsManagementOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
            setIsAnketaOpen(false);
            setIsManagementOpen(false);
          } else {
            setIsOpen(true);
          }
        }}
        className="flex items-center gap-2.5 px-2 py-1.5 rounded-[8px] hover:bg-black/5 transition-colors"
        aria-label="Меню профілю"
        aria-expanded={isOpen}
      >
        <Avatar src={avatarUrl} name={effectiveName} size={32} />
        <span className="hidden md:inline text-[13px] text-[var(--color-text)]">
          {effectiveName}
        </span>
        <svg
          className={`hidden md:block w-2.5 h-2.5 text-[var(--color-text-muted)] transition-transform duration-150 ${
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

      {isMounted && (
        <div
          className="fixed top-[68px] left-4 right-4 md:absolute md:top-full md:right-0 md:left-auto md:mt-2 md:w-[280px] bg-white border border-[var(--color-line)] rounded-[12px] shadow-[0_12px_32px_rgba(0,0,0,0.08)] overflow-hidden z-[65] origin-top-right transition-[opacity,transform] duration-150"
          style={{
            opacity: isOpen && !isAnimating ? 1 : 0,
            transform:
              isOpen && !isAnimating ? "scale(1)" : "scale(0.95)",
            transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
            transformOrigin: "top right",
          }}
        >
          <div className="p-[18px] border-b border-[var(--color-line)] flex items-center gap-3">
            <Avatar
              src={avatarUrl}
              name={effectiveName}
              size={48}
              onClick={() => setIsAvatarEditorOpen(true)}
            />
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
            {!isBarberRole && !isAdminRole && (
              <Link
                href="/my-bookings"
                onClick={closeAll}
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
            )}
            <button
              type="button"
              onClick={() => {
                closeAll();
                openChat();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] hover:bg-[#F5F0E6] transition-colors text-[13px] text-left"
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
            </button>
            {!isAdminRole ? (
              <button
                type="button"
                onClick={() => {
                  closeAll();
                  requestOpenSupport();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] hover:bg-[#F5F0E6] transition-colors text-[13px] text-left"
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
              </button>
            ) : (
              <Link
                href="/admin/support"
                onClick={closeAll}
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
            )}
          </div>

          {(isBarberRole || isAdminRole) && (
            <>
              <div className="h-px bg-[var(--color-line)] mx-1.5" />
              <div className="py-1.5">
                {isBarberRole && (
              <button
                type="button"
                onClick={() => {
                  const isMobile = window.innerWidth < 768;
                  if (isMobile) {
                    setIsOpen(false);
                    router.push("/anketa");
                    return;
                  }
                  setIsAnketaOpen((v) => !v);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] transition-colors text-[13px] ${
                  isAnketaOpen ? "bg-[#F5F0E6]" : "hover:bg-[#F5F0E6]"
                }`}
              >
                <svg
                  className="w-[18px] h-[18px] flex-shrink-0 text-[var(--color-text-muted)]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <path d="M9 12h6M9 16h6M9 8h6" />
                  <rect x="5" y="3" width="14" height="18" rx="2" />
                </svg>
                <span>Анкета</span>
              </button>
            )}
            {isAdminRole && (
              <button
                type="button"
                onClick={() => {
                  setIsManagementOpen((v) => !v);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] transition-colors text-[13px] ${
                  isManagementOpen ? "bg-[#F5F0E6]" : "hover:bg-[#F5F0E6]"
                }`}
              >
                <svg
                  className="w-[18px] h-[18px] flex-shrink-0 text-[var(--color-text-muted)]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                <span>Менеджмент</span>
              </button>
            )}
              </div>
            </>
          )}

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

      <AnketaModal
        isOpen={isAnketaOpen}
        onClose={() => setIsAnketaOpen(false)}
      />

      <ManagementModal
        isOpen={isManagementOpen}
        onClose={() => setIsManagementOpen(false)}
      />

      <AvatarEditorModal
        isOpen={isAvatarEditorOpen}
        onClose={() => setIsAvatarEditorOpen(false)}
        onSuccess={handleAvatarUploadSuccess}
      />
    </div>
  );
}
