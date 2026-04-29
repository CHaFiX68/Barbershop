"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import LoginForm from "./login-form";
import RegisterForm from "./register-form";
import OtpForm from "./otp-form";

type AuthMode = "login" | "register";

export default function AuthModal() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const authParam = searchParams.get("auth");
  const mode: AuthMode | null =
    authParam === "login" || authParam === "register" ? authParam : null;
  const isOpen = mode !== null;

  const [mounted, setMounted] = useState(false);
  const [pendingVerify, setPendingVerify] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const mouseDownOnBackdropRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const close = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("auth");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
    setPendingVerify(null);
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const switchTo = (next: AuthMode) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("auth", next);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    mouseDownOnBackdropRef.current = e.target === e.currentTarget;
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && mouseDownOnBackdropRef.current) {
      close();
    }
    mouseDownOnBackdropRef.current = false;
  };

  const handleRegistered = (email: string, password: string) => {
    setPendingVerify({ email, password });
  };

  const handleVerified = async () => {
    if (!pendingVerify) return;
    try {
      await signIn.email({
        email: pendingVerify.email,
        password: pendingVerify.password,
      });
      setPendingVerify(null);
      close();
      router.refresh();
    } catch (e) {
      console.error("Auto sign-in after verify failed:", e);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={mode === "login" ? "Увійти" : "Створити акаунт"}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        className="relative bg-white rounded-[16px] p-8 sm:p-10 max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <button
          type="button"
          aria-label="Закрити"
          onClick={close}
          className="group absolute top-4 right-4 w-9 h-9 flex items-center justify-center cursor-pointer active:scale-95 transition-transform duration-150"
        >
          <span className="absolute w-3.5 h-px bg-[var(--color-text-muted)] rounded-full transition-all duration-[100ms] ease-out rotate-45 group-hover:w-5 group-hover:h-[2px] group-hover:bg-[var(--color-text)]" />
          <span className="absolute w-3.5 h-px bg-[var(--color-text-muted)] rounded-full transition-all duration-[100ms] ease-out -rotate-45 group-hover:w-5 group-hover:h-[2px] group-hover:bg-[var(--color-text)]" />
        </button>

        {pendingVerify ? (
          <OtpForm
            email={pendingVerify.email}
            onVerified={handleVerified}
          />
        ) : (
          <>
            <div className="flex items-center gap-1 mb-6">
              <button
                type="button"
                onClick={() => switchTo("login")}
                className={`text-sm px-3 py-1.5 rounded-[8px] transition-colors ${
                  mode === "login"
                    ? "bg-[var(--color-text)] text-white"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                Увійти
              </button>
              <button
                type="button"
                onClick={() => switchTo("register")}
                className={`text-sm px-3 py-1.5 rounded-[8px] transition-colors ${
                  mode === "register"
                    ? "bg-[var(--color-text)] text-white"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                Реєстрація
              </button>
            </div>

            {mode === "login" ? (
              <LoginForm hideCard inModal />
            ) : (
              <RegisterForm
                hideCard
                inModal
                onRegistered={handleRegistered}
              />
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
