import { Suspense } from "react";
import RegisterForm from "@/components/auth/register-form";

export const metadata = { title: "Реєстрація — BARBER&CO" };

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <Suspense fallback={null}>
        <RegisterForm />
      </Suspense>
    </main>
  );
}
