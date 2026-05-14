"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { signIn } from "@/lib/auth-client";
import { useModalStack } from "@/lib/modal-stack-context";
import { X } from "lucide-react";
import LoginForm from "./login-form";
import RegisterForm from "./register-form";
import OtpForm from "./otp-form";
import ForgotPasswordForm from "./forgot-password-form";

type AuthMode = "login" | "register";

export default function AuthModal() {
  const t = useTranslations("auth");
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
  const [showForgot, setShowForgot] = useState(false);
  const mouseDownOnBackdropRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const close = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("auth");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
    setPendingVerify(null);
    setShowForgot(false);
  }, [pathname, router, searchParams]);

  const { zIndex, isTop } = useModalStack("auth-modal", isOpen, close);

  if (!mounted) return null;

  const switchTo = (next: AuthMode) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("auth", next);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setShowForgot(false);
  };

  const handleForgotSuccess = () => {
    setShowForgot(false);
    close();
    router.refresh();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    mouseDownOnBackdropRef.current = e.target === e.currentTarget;
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      e.target === e.currentTarget &&
      mouseDownOnBackdropRef.current &&
      isTop
    ) {
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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={mode === "login" ? t("signInTitle") : t("signUpTitle")}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          style={{ zIndex, cursor: "auto" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="relative bg-[var(--color-surface)] rounded-[16px] max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col"
            style={{ paddingRight: 8, cursor: "auto" }}
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
        <button
          type="button"
          onClick={close}
          aria-label={t("signInTitle")}
          className="absolute top-4 right-4 w-9 h-9 rounded-full border border-[var(--color-line)] bg-transparent hover:bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-all duration-200 z-10"
        >
          <X size={16} strokeWidth={1.5} />
        </button>

        <div
          className="custom-scrollbar flex-1 overflow-y-auto p-8 sm:p-10"
          style={{ minHeight: 0 }}
        >
        {pendingVerify ? (
          <OtpForm
            email={pendingVerify.email}
            onVerified={handleVerified}
          />
        ) : showForgot ? (
          <ForgotPasswordForm
            onBack={() => setShowForgot(false)}
            onSuccess={handleForgotSuccess}
          />
        ) : (
          <>
            <div className="flex items-center gap-1 mb-6">
              <button
                type="button"
                onClick={() => switchTo("login")}
                className={`px-5 py-2 rounded-full text-[14px] transition-all duration-200 ${
                  mode === "login"
                    ? "bg-[#FAF7F1] text-[#1C1B19] font-medium"
                    : "bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                {t("signIn")}
              </button>
              <button
                type="button"
                onClick={() => switchTo("register")}
                className={`px-5 py-2 rounded-full text-[14px] transition-all duration-200 ${
                  mode === "register"
                    ? "bg-[#FAF7F1] text-[#1C1B19] font-medium"
                    : "bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                {t("signUp")}
              </button>
            </div>

            <div className="relative overflow-hidden" style={{ minHeight: "420px" }}>
              <AnimatePresence mode="wait" initial={false}>
                {mode === "login" && (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0"
                  >
                    <LoginForm
                      hideCard
                      inModal
                      onForgotPassword={() => setShowForgot(true)}
                    />
                  </motion.div>
                )}
                {mode === "register" && (
                  <motion.div
                    key="register"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 40 }}
                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0"
                  >
                    <RegisterForm
                      hideCard
                      inModal
                      onRegistered={handleRegistered}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
