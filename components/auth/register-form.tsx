"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "@/lib/auth-client";
import { signUpSchema, type SignUpInput } from "@/lib/validation";
import AuthCard from "./auth-card";
import AuthInput from "./auth-input";
import AuthButton from "./auth-button";
import AuthModalTrigger from "./auth-modal-trigger";

function mapSignUpError(message: string | undefined): string {
  if (!message) return "Не вдалось створити акаунт. Спробуй ще раз";
  const m = message.toLowerCase();
  if (m.includes("already") || m.includes("exists") || m.includes("taken")) {
    return "Користувач з таким email уже зареєстрований";
  }
  return "Не вдалось створити акаунт. Спробуй ще раз";
}

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
        setError("root", {
          message:
            "Акаунт створено, але не вдалось увійти автоматично. Спробуй увійти вручну.",
        });
        return;
      }
      if (inModal) {
        closeModalAndRefresh();
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("root", { message: "Не вдалось створити акаунт. Спробуй ще раз" });
    }
  };

  const content = (
    <>
      <h1
        className="font-display mb-2"
        style={{ fontWeight: 600, fontSize: "32px" }}
      >
        Створити акаунт
      </h1>
      <p
        className="mb-8 text-[var(--color-text-muted)]"
        style={{ fontSize: "14px" }}
      >
        Уже маєш акаунт?{" "}
        {inModal ? (
          <AuthModalTrigger
            mode="login"
            className="nav-link text-[var(--color-text)]"
          >
            Увійти
          </AuthModalTrigger>
        ) : (
          <Link href="/login" className="nav-link text-[var(--color-text)]">
            Увійти
          </Link>
        )}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <AuthInput
          label="Ім'я"
          type="text"
          autoComplete="name"
          error={errors.name?.message}
          {...register("name")}
        />
        <AuthInput
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <AuthInput
          label="Пароль"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <AuthInput
          label="Підтвердити пароль"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        {errors.root && (
          <p className="mb-4 text-sm text-red-600">{errors.root.message}</p>
        )}

        <AuthButton type="submit" loading={isSubmitting}>
          Зареєструватись
        </AuthButton>
      </form>
    </>
  );

  if (hideCard) return content;
  return <AuthCard>{content}</AuthCard>;
}
