"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { signOut, useSession } from "@/lib/auth-client";
import { useChatActions } from "@/lib/chat-context";
import { useConfirm } from "@/lib/confirm-context";
import { useModalStack } from "@/lib/modal-stack-context";
import Avatar from "./avatar";
import AvatarEditorModal from "./avatar-editor-modal";
import AnketaModal from "./barber/anketa-modal";
import ManagementModal from "./admin/management-modal";
import MyBookingsPopup from "./my-bookings/my-bookings-popup";
import BarberBookingsPopup from "./bookings/barber-bookings-popup";

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
  const { openChat } = useChatActions();
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
  const [isBookingsOpen, setIsBookingsOpen] = useState(false);
  const [isBarberBookingsOpen, setIsBarberBookingsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const confirm = useConfirm();
  const tProfile = useTranslations("profile");
  const tMenu = useTranslations("profile.menu");

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

  const dropdownClose = useCallback(() => setIsOpen(false), []);
  const { zIndex: dropdownZ, isTop: dropdownIsTop } = useModalStack(
    "profile-dropdown",
    isOpen,
    dropdownClose,
    { lockBody: false }
  );

  // Compute panel position relative to trigger so the dropdown's right edge
  // aligns with the trigger's right edge on desktop (where header content is
  // capped to max-w-[1536px] mx-auto and the trigger isn't at viewport edge).
  // On mobile we render full-width with fixed offsets — no computation needed.
  const [triggerRect, setTriggerRect] = useState<{
    top: number;
    right: number;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const update = () => {
      if (window.innerWidth < 768) {
        // Mobile: full-width positioning handled by Tailwind classes (top-[68px] left-4 right-4)
        setTriggerRect(null);
        return;
      }
      const node = dropdownRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      setTriggerRect({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [isOpen]);

  // Close on outside click only when dropdown is the topmost stack item.
  // When chat popup / anketa / management modal is on top, the user is
  // interacting with that overlay — those clicks aren't "outside" from the
  // user's perspective, so the dropdown stays open for multitasking.
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!dropdownIsTop) return;
      if (dropdownRef.current?.contains(e.target as Node)) return;
      if (panelRef.current?.contains(e.target as Node)) return;
      setIsOpen(false);
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, dropdownIsTop]);

  if (!session?.user) return null;

  const effectiveName = displayName || session.user.name;
  const role = session.user.role ?? "user";
  const isBarberRole = role === "barber";
  const isAdminRole = role === "admin";

  const [pendingAnketaCount, setPendingAnketaCount] = useState(0);

  useEffect(() => {
    if (!isAdminRole) return;
    let cancelled = false;
    const fetchCount = () => {
      fetch("/api/admin/anketas/pending-count")
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { count: number } | null) => {
          if (!cancelled && d) setPendingAnketaCount(d.count);
        })
        .catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isAdminRole]);

  const handleLogout = async () => {
    const ok = await confirm({
      title: tProfile("logoutConfirmTitle"),
      message: tProfile("logoutConfirmMessage"),
      confirmLabel: tProfile("logoutConfirmLabel"),
    });
    if (!ok) return;
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
        className="flex items-center gap-3 px-2.5 py-2 rounded-[8px] hover:bg-[var(--color-surface-2)] transition-colors"
        aria-label="Меню профілю"
        aria-expanded={isOpen}
      >
        <span className="relative inline-flex">
          <Avatar src={avatarUrl} name={effectiveName} size={34} />
          {isAdminRole && pendingAnketaCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.6)]"
              aria-hidden="true"
            />
          )}
        </span>
        <span className="hidden md:inline text-[15px] font-medium text-[var(--color-text)]">
          {effectiveName}
        </span>
        <svg
          className={`hidden md:block w-3 h-3 text-[var(--color-text-muted)] transition-transform duration-150 ${
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

      {isMounted && createPortal(
        <div
          ref={panelRef}
          className="fixed top-[68px] left-4 right-4 bg-[var(--color-bg)]/85 backdrop-blur-[8px] border border-[var(--color-line)] rounded-[12px] shadow-[0_12px_32px_rgba(0,0,0,0.08)] overflow-hidden origin-top-right transition-[opacity,transform] duration-150"
          style={{
            zIndex: dropdownZ,
            opacity: isOpen && !isAnimating ? 1 : 0,
            transform:
              isOpen && !isAnimating ? "scale(1)" : "scale(0.95)",
            transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
            transformOrigin: "top right",
            ...(triggerRect && {
              top: `${triggerRect.top}px`,
              right: `${triggerRect.right}px`,
              left: "auto",
              width: "280px",
            }),
          }}
        >
          <div className="p-[18px] border-b border-[var(--color-line)] flex items-center gap-3">
            <Avatar
              src={avatarUrl}
              name={effectiveName}
              size={48}
              onClick={() => {
                setIsOpen(false);
                setIsAvatarEditorOpen(true);
              }}
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
                  className="font-display text-[16px] font-medium leading-tight bg-[var(--color-surface-2)] border border-[var(--color-line)] rounded-[6px] px-2 py-1 outline-none focus:border-[var(--color-text)] w-full disabled:opacity-50"
                />
              ) : (
                <button
                  type="button"
                  onClick={startEditingName}
                  className="group font-display text-[16px] font-medium leading-tight truncate text-left hover:text-[var(--color-text-muted)] transition-colors flex items-center gap-1.5"
                  title={tProfile("editName")}
                >
                  <span className="truncate">{effectiveName}</span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors shrink-0 opacity-70 group-hover:opacity-100"
                    aria-hidden="true"
                  >
                    <path
                      d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
              <div className="text-[11px] text-[var(--color-text-muted)] truncate">
                {session.user.email}
              </div>
            </div>
          </div>

          <div className="p-1.5">
            {!isBarberRole && !isAdminRole && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsBookingsOpen(true);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] hover:bg-[var(--color-surface-2)] transition-colors text-[13px] text-left"
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
                <span>{tMenu("bookings")}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => openChat()}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] hover:bg-[var(--color-surface-2)] transition-colors text-[13px] text-left"
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
              <span>{tMenu("chatsAndSupport")}</span>
            </button>
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
                  setIsOpen(false);
                  if (isMobile) {
                    router.push("/anketa");
                    return;
                  }
                  setIsAnketaOpen((v) => !v);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] transition-colors text-[13px] ${
                  isAnketaOpen ? "bg-[var(--color-surface-2)]" : "hover:bg-[var(--color-surface-2)]"
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
                <span>{tMenu("anketa")}</span>
              </button>
            )}
            {isBarberRole && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsBarberBookingsOpen(true);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] transition-colors text-[13px] text-left hover:bg-[var(--color-surface-2)]"
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
                <span>{tMenu("bookings")}</span>
              </button>
            )}
            {isAdminRole && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsManagementOpen((v) => !v);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] transition-colors text-[13px] ${
                  isManagementOpen ? "bg-[var(--color-surface-2)]" : "hover:bg-[var(--color-surface-2)]"
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
                <span className="flex items-center gap-2">
                  {tMenu("management")}
                  {pendingAnketaCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                      className="w-2 h-2 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.6)]"
                      aria-label={`${pendingAnketaCount} pending`}
                    />
                  )}
                </span>
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
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] hover:bg-[rgba(160,48,48,0.06)] transition-colors text-[13px] text-[var(--color-danger)]"
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
              <span>{tMenu("logout")}</span>
            </button>
          </div>
        </div>,
        document.body
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

      <MyBookingsPopup
        open={isBookingsOpen}
        onClose={() => setIsBookingsOpen(false)}
      />

      <BarberBookingsPopup
        open={isBarberBookingsOpen}
        onClose={() => setIsBarberBookingsOpen(false)}
      />
    </div>
  );
}
