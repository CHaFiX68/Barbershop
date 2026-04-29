import { Suspense } from "react";
import LoginForm from "@/components/auth/login-form";

export const metadata = { title: "Увійти — BARBER&CO" };

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
