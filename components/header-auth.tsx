"use client";

import { useSession } from "@/lib/auth-client";
import AuthModalTrigger from "./auth/auth-modal-trigger";
import ProfileDropdown from "./profile-dropdown";

export default function HeaderAuth() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <div className="w-32 h-9" aria-hidden="true" />;
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-3">
        <AuthModalTrigger
          mode="login"
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors px-3 py-2"
        >
          Увійти
        </AuthModalTrigger>
        <AuthModalTrigger
          mode="register"
          className="text-sm bg-black text-white border border-transparent rounded-[8px] px-4 py-2 hover:bg-transparent hover:text-black hover:border-black transition-colors"
        >
          Реєстрація
        </AuthModalTrigger>
      </div>
    );
  }

  return <ProfileDropdown />;
}
