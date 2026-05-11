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
        {inModal ? (
          <AuthModalTrigger
            mode="register"
            className="nav-link text-[var(--color-text)]"
          >
            {t("signUp")}
          </AuthModalTrigger>
        ) : (
          <Link href="/register" className="nav-link text-[var(--color-text)]">
            {t("signUp")}
          </Link>
        )}
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

        {onForgotPassword && (
          <div className="flex justify-end -mt-3 mb-5">
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-[12px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] underline opacity-60 hover:opacity-100 transition-opacity"
            >
              {t("forgotPassword")}
            </button>
          </div>
        )}

        {errors.root && (
          <p className="mb-4 text-sm text-red-600">{errors.root.message}</p>
        )}

        <AuthButton type="submit" loading={isSubmitting}>
          {t("submitSignIn")}
        </AuthButton>
      </form>
    </>
  );

  if (hideCard) return content;
  return <AuthCard>{content}</AuthCard>;
}
