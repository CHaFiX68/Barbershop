"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUp } from "@/lib/auth-client";
import { signUpSchema, type SignUpInput } from "@/lib/validation";
import AuthCard from "./auth-card";
import AuthInput from "./auth-input";
import AuthButton from "./auth-button";

function mapSignUpError(message: string | undefined): string {
  if (!message) return "Не вдалось створити акаунт. Спробуй ще раз";
  const m = message.toLowerCase();
  if (m.includes("already") || m.includes("exists") || m.includes("taken")) {
    return "Користувач з таким email уже зареєстрований";
  }
  return "Не вдалось створити акаунт. Спробуй ще раз";
}

export default function RegisterForm() {
  const router = useRouter();
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

  const onSubmit = async (data: SignUpInput) => {
    try {
      const result = await signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      if (result.error) {
        setError("root", { message: mapSignUpError(result.error.message) });
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("root", { message: "Не вдалось створити акаунт. Спробуй ще раз" });
    }
  };

  return (
    <AuthCard>
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
        <Link href="/login" className="nav-link text-[var(--color-text)]">
          Увійти
        </Link>
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
    </AuthCard>
  );
}
