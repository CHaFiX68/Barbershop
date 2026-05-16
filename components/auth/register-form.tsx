"use client";

import { Link } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "@/lib/auth-client";
import { signUpSchema, type SignUpInput } from "@/lib/validation";
import AuthCard from "./auth-card";
import AuthInput from "./auth-input";
import AuthButton from "./auth-button";
import AuthModalTrigger from "./auth-modal-trigger";
import GoogleAuthButton from "./google-auth-button";

type Props = {
  hideCard?: boolean;
  inModal?: boolean;
  onRegistered?: (email: string, password: string) => void;
};

export default function RegisterForm({
  hideCard,
  inModal,
  onRegistered,
}: Props) {
  const t = useTranslations("auth");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function mapSignUpError(message: string | undefined): string {
    if (!message) return t("errorGeneric");
    const m = message.toLowerCase();
    if (m.includes("already") || m.includes("exists") || m.includes("taken")) {
      return t("errorEmailTaken");
    }
    return t("errorGeneric");
  }
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
  });

  const closeModalAndRefresh = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("auth");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
    router.refresh();
  };

  const onSubmit = async (data: SignUpInput) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      if (!res.ok) {
        setError("root", {
          message: mapSignUpError(json?.error?.message),
        });
        return;
      }
      // TODO: повернути на OTP-form коли налаштовано власний Resend домен
      const signInResult = await signIn.email({
        email: data.email,
        password: data.password,
      });
      if (signInResult.error) {
        setError("root", { message: t("errorGeneric") });
        return;
      }
      if (inModal) {
        closeModalAndRefresh();
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("root", { message: t("errorGeneric") });
    }
  };

  if (hideCard) {
    return (
      <>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="h-full">
          <div className="mb-3">
            <h1 className="font-display text-[24px] font-medium text-[var(--color-text)] mb-1">
              {t("signUpTitle")}
            </h1>
            <p className="text-[13px] text-[var(--color-text-muted)]">
              {t("haveAccount")}{" "}
              <AuthModalTrigger
                mode="login"
                className="text-[var(--color-text)] font-medium underline-offset-2 hover:underline"
              >
                {t("signIn")}
              </AuthModalTrigger>
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <AuthInput
              label={t("name")}
              type="text"
              autoComplete="name"
              placeholder={t("namePlaceholder")}
              error={errors.name?.message}
              {...register("name")}
            />
            <AuthInput
              label={t("email")}
              type="email"
              autoComplete="email"
              placeholder={t("emailPlaceholder")}
              error={errors.email?.message}
              {...register("email")}
            />
            <AuthInput
              label={t("password")}
              type="password"
              autoComplete="new-password"
              placeholder={t("passwordPlaceholder")}
              error={errors.password?.message}
              {...register("password")}
            />
          </div>

          {errors.root && (
            <p className="mt-3 text-sm text-red-600">{errors.root.message}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 py-3.5 bg-[#1C1B19] text-[#FAF7F1] rounded-[10px] text-[14px] font-medium hover:bg-[#2C2A27] transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "…" : t("submitSignUp")}
          </button>
        </form>

        <div className="flex items-center gap-3 my-4">
          <span className="flex-1 h-px bg-[var(--color-line)]" aria-hidden="true" />
          <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            {t("or")}
          </span>
          <span className="flex-1 h-px bg-[var(--color-line)]" aria-hidden="true" />
        </div>

        <GoogleAuthButton />
      </>
    );
  }

  const content = (
    <>
      <h1
        className="font-display mb-2"
        style={{ fontWeight: 600, fontSize: "32px" }}
      >
        {t("signUpTitle")}
      </h1>
      <p
        className="mb-8 text-[var(--color-text-muted)]"
        style={{ fontSize: "14px" }}
      >
        {t("haveAccount")}{" "}
        <Link href="/login" className="nav-link text-[var(--color-text)]">
          {t("signIn")}
        </Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <AuthInput
          label={t("name")}
          type="text"
          autoComplete="name"
          placeholder={t("namePlaceholder")}
          error={errors.name?.message}
          {...register("name")}
        />
        <AuthInput
          label={t("email")}
          type="email"
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          error={errors.email?.message}
          {...register("email")}
        />
        <AuthInput
          label={t("password")}
          type="password"
          autoComplete="new-password"
          placeholder={t("passwordPlaceholder")}
          error={errors.password?.message}
          {...register("password")}
        />

        {errors.root && (
          <p className="mb-4 text-sm text-red-600">{errors.root.message}</p>
        )}

        <AuthButton type="submit" loading={isSubmitting}>
          {t("submitSignUp")}
        </AuthButton>
      </form>
    </>
  );

  return <AuthCard>{content}</AuthCard>;
}
