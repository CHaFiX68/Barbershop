"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import AuthButton from "./auth-button";

type Props = {
  email: string;
  onVerified: () => void;
};

const LENGTH = 6;

export default function OtpForm({ email, onVerified }: Props) {
  const t = useTranslations("auth");
  const [digits, setDigits] = useState<string[]>(() =>
    Array.from({ length: LENGTH }, () => "")
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => {
      setResendTimer((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  const code = digits.join("");

  const setDigit = (i: number, val: string) => {
    setDigits((d) => {
      const nd = [...d];
      nd[i] = val;
      return nd;
    });
  };

  const handleChange = (
    i: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const raw = e.target.value;
    const clean = raw.replace(/\D/g, "");
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
      refs.current[next]?.focus();
      return;
    }
    setDigit(i, clean);
    if (i < LENGTH - 1) {
      refs.current[i + 1]?.focus();
    }
  };

  const handleKeyDown = (
    i: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (code.length < LENGTH || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(data.error ?? t("errorOtpInvalid"));
        setIsSubmitting(false);
        return;
      }
      onVerified();
    } catch {
      setError(t("errorGeneric"));
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || isResending) return;
    setIsResending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        setError(t("errorGeneric"));
        return;
      }
      setResendTimer(60);
      setDigits(Array.from({ length: LENGTH }, () => ""));
      refs.current[0]?.focus();
    } catch {
      setError(t("errorGeneric"));
    } finally {
      setIsResending(false);
    }
  };

  const resendDisabled = resendTimer > 0 || isResending;

  return (
    <div>
      <h1
        className="font-display mb-2"
        style={{ fontWeight: 600, fontSize: "32px" }}
      >
        {t("otpTitle")}
      </h1>
      <p
        className="mb-8 text-[var(--color-text-muted)]"
        style={{ fontSize: "14px", lineHeight: 1.6 }}
      >
        {t("otpSubtitle")}{" "}
        <span className="text-[var(--color-text)]">{email}</span>
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="flex gap-2 justify-center mb-5">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-12 h-14 text-center font-medium border border-[var(--color-line)] bg-[var(--color-surface)] rounded-[8px] outline-none transition-colors focus:border-black"
              style={{ fontSize: "24px" }}
            />
          ))}
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-600 text-center">{error}</p>
        )}

        <AuthButton
          type="submit"
          loading={isSubmitting}
          disabled={code.length < LENGTH}
        >
          {t("submitOtp")}
        </AuthButton>
      </form>

      <p
        className="mt-6 text-center text-[var(--color-text-muted)]"
        style={{ fontSize: "13px" }}
      >
        <button
          type="button"
          onClick={handleResend}
          disabled={resendDisabled}
          className={
            resendDisabled
              ? "opacity-50 cursor-not-allowed"
              : "underline hover:text-[var(--color-text)]"
          }
        >
          {resendTimer > 0 ? t("otpResendIn", { seconds: resendTimer }) : t("otpResend")}
        </button>
      </p>
    </div>
  );
}
