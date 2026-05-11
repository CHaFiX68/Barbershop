"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { signIn } from "@/lib/auth-client";
import AuthInput from "./auth-input";
import AuthButton from "./auth-button";

type Props = {
  onBack: () => void;
  onSuccess: () => void;
};

const LENGTH = 6;

export default function ForgotPasswordForm({ onBack, onSuccess }: Props) {
  const t = useTranslations("auth");
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const [digits, setDigits] = useState<string[]>(() =>
    Array.from({ length: LENGTH }, () => "")
  );
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (step === "code") {
      otpRefs.current[0]?.focus();
    }
  }, [step]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSendingOtp) return;
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError(t("errorInvalidEmail"));
      return;
    }
    setEmailError(null);
    setIsSendingOtp(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      if (!res.ok) {
        setEmailError(json?.error?.message ?? t("errorGeneric"));
        return;
      }
      setEmail(trimmed);
      setStep("code");
    } catch {
      setEmailError(t("errorGeneric"));
    } finally {
      setIsSendingOtp(false);
    }
  };

  const setDigit = (i: number, val: string) => {
    setDigits((d) => {
      const nd = [...d];
      nd[i] = val;
      return nd;
    });
  };

  const handleOtpChange = (
    i: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const clean = e.target.value.replace(/\D/g, "");
    if (!clean) {
      setDigit(i, "");
      return;
    }
    if (clean.length > 1) {
      setDigits((d) => {
        const nd = [...d];
        for (let j = 0; j < clean.length && i + j < LENGTH; j++) {
          nd[i + j] = clean[j];
        }
        return nd;
      });
      const next = Math.min(i + clean.length, LENGTH - 1);
      otpRefs.current[next]?.focus();
      return;
    }
    setDigit(i, clean);
    if (i < LENGTH - 1) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (
    i: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  const code = digits.join("");

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isResetting) return;
    setResetError(null);

    if (code.length < LENGTH) {
      setResetError(t("errorOtpInvalid"));
      return;
    }
    if (newPassword.length < 8) {
      setResetError(t("errorPasswordShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError(t("errorPasswordMismatch"));
      return;
    }

    setIsResetting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      if (!res.ok) {
        setResetError(json?.error?.message ?? t("errorGeneric"));
        return;
      }

      const signInResult = await signIn.email({
        email,
        password: newPassword,
      });
      if (signInResult.error) {
        setResetError(t("errorGeneric"));
        return;
      }
      onSuccess();
    } catch {
      setResetError(t("errorGeneric"));
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="text-[12px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-4"
      >
        ← {t("signIn")}
      </button>

      {step === "email" ? (
        <>
          <h1
            className="font-display mb-2"
            style={{ fontWeight: 600, fontSize: "32px" }}
          >
            {t("forgotTitle")}
          </h1>
          <p
            className="mb-8 text-[var(--color-text-muted)]"
            style={{ fontSize: "14px" }}
          >
            {t("forgotSubtitle")}
          </p>

          <form onSubmit={handleSendOtp} noValidate>
            <AuthInput
              label={t("email")}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={emailError ?? undefined}
            />

            <AuthButton type="submit" loading={isSendingOtp}>
              {t("submitForgot")}
            </AuthButton>
          </form>
        </>
      ) : (
        <>
          <h1
            className="font-display mb-2"
            style={{ fontWeight: 600, fontSize: "32px" }}
          >
            {t("newPassword")}
          </h1>
          <p
            className="mb-8 text-[var(--color-text-muted)]"
            style={{ fontSize: "14px", lineHeight: 1.6 }}
          >
            {t("otpSubtitle")}{" "}
            <span className="text-[var(--color-text)]">{email}</span>
          </p>

          <form onSubmit={handleResetPassword} noValidate>
            <div className="flex gap-2 justify-center mb-5">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    otpRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleOtpChange(i, e)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-12 h-14 text-center font-medium border border-[var(--color-line)] bg-[var(--color-surface)] rounded-[8px] outline-none transition-colors focus:border-black"
                  style={{ fontSize: "24px" }}
                />
              ))}
            </div>

            <AuthInput
              label={t("newPassword")}
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <AuthInput
              label={t("confirmPassword")}
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            {resetError && (
              <p className="mb-4 text-sm text-red-600 text-center">
                {resetError}
              </p>
            )}

            <AuthButton type="submit" loading={isResetting}>
              {t("submitOtp")}
            </AuthButton>
          </form>
        </>
      )}
    </div>
  );
}
