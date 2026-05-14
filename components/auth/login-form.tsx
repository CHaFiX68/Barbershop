"use client";

import { Link } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "@/lib/auth-client";
import { signInSchema, type SignInInput } from "@/lib/validation";
import AuthCard from "./auth-card";
import AuthInput from "./auth-input";
import AuthButton from "./auth-button";
import AuthModalTrigger from "./auth-modal-trigger";

type Props = {
  hideCard?: boolean;
  inModal?: boolean;
  onForgotPassword?: () => void;
};

export default function LoginForm({
  hideCard,
  inModal,
  onForgotPassword,
}: Props) {
  const t = useTranslations("auth");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  function mapSignInError(message: string | undefined): string {
    if (!message) return t("errorGeneric");
    const m = message.toLowerCase();
    if (m.includes("invalid") || m.includes("not found") || m.includes("password")) {
      return t("errorInvalidCredentials");
    }
    return t("errorGeneric");
  }
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
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

  const onSubmit = async (data: SignInInput) => {
    try {
      const result = await signIn.email({
        email: data.email,
        password: data.password,
      });
      if (result.error) {
        setError("root", { message: mapSignInError(result.error.message) });
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
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="h-full">
        <div className="mb-4">
          <h1 className="font-display text-[24px] font-medium text-[var(--color-text)] mb-1">
            {t("signInTitle")}
          </h1>
          <p className="text-[13px] text-[var(--color-text-muted)]">
            {t("noAccount")}{" "}
            <AuthModalTrigger
              mode="register"
              className="text-[var(--color-text)] font-medium underline-offset-2 hover:underline"
            >
              {t("signUp")}
            </AuthModalTrigger>
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <AuthInput
            label={t("email")}
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <AuthInput
            label={t("password")}
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />
          {onForgotPassword && (
            <div className="text-right -mt-1">
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-[12px] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                {t("forgotPassword")}
              </button>
            </div>
          )}
        </div>

        {errors.root && (
          <p className="mt-3 text-sm text-red-600">{errors.root.message}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="absolute left-0 right-0 bottom-0 py-3.5 bg-[#1C1B19] text-[#FAF7F1] rounded-[8px] text-[14px] font-medium hover:bg-[#2C2A27] transition-colors disabled:opacity-50"
        >
          {isSubmitting ? "…" : t("submitSignIn")}
        </button>
      </form>
    );
  }

  const content = (
    <>
      <h1
        className="font-display mb-2"
        style={{ fontWeight: 600, fontSize: "32px" }}
      >
        {t("signInTitle")}
      </h1>
      <p
        className="mb-8 text-[var(--color-text-muted)]"
        style={{ fontSize: "14px" }}
      >
        {t("noAccount")}{" "}
        <Link href="/register" className="nav-link text-[var(--color-text)]">
          {t("signUp")}
        </Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <AuthInput
          label={t("email")}
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <AuthInput
          label={t("password")}
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />

        {errors.root && (
          <p className="mb-4 text-sm text-red-600">{errors.root.message}</p>
        )}

        <AuthButton type="submit" loading={isSubmitting}>
          {t("submitSignIn")}
        </AuthButton>
      </form>
    </>
  );

  return <AuthCard>{content}</AuthCard>;
}
