"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "@/lib/auth-client";
import { signInSchema, type SignInInput } from "@/lib/validation";
import AuthCard from "./auth-card";
import AuthInput from "./auth-input";
import AuthButton from "./auth-button";
import AuthModalTrigger from "./auth-modal-trigger";

function mapSignInError(message: string | undefined): string {
  if (!message) return "Не вдалось увійти. Спробуй ще раз";
  const m = message.toLowerCase();
  if (m.includes("invalid") || m.includes("not found") || m.includes("password")) {
    return "Невірний email або пароль";
  }
  return "Не вдалось увійти. Спробуй ще раз";
}

type Props = {
  hideCard?: boolean;
  inModal?: boolean;
};

export default function LoginForm({ hideCard, inModal }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
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
      setError("root", { message: "Не вдалось увійти. Спробуй ще раз" });
    }
  };

  const content = (
    <>
      <h1
        className="font-display mb-2"
        style={{ fontWeight: 600, fontSize: "32px" }}
      >
        Увійти
      </h1>
      <p
        className="mb-8 text-[var(--color-text-muted)]"
        style={{ fontSize: "14px" }}
      >
        Ще не маєш акаунту?{" "}
        {inModal ? (
          <AuthModalTrigger
            mode="register"
            className="nav-link text-[var(--color-text)]"
          >
            Зареєструватись
          </AuthModalTrigger>
        ) : (
          <Link href="/register" className="nav-link text-[var(--color-text)]">
            Зареєструватись
          </Link>
        )}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
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
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />

        {errors.root && (
          <p className="mb-4 text-sm text-red-600">{errors.root.message}</p>
        )}

        <AuthButton type="submit" loading={isSubmitting}>
          Увійти
        </AuthButton>
      </form>
    </>
  );

  if (hideCard) return content;
  return <AuthCard>{content}</AuthCard>;
}
