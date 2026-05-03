"use client";

import { useSession } from "@/lib/auth-client";
import AuthModalTrigger from "./auth/auth-modal-trigger";
import ProfileDropdown, {
  type InitialSession,
} from "./profile-dropdown";

type Props = {
  initialSession?: InitialSession;
};

export default function HeaderAuth({ initialSession = null }: Props) {
  const { data: clientSession } = useSession();

  // Defensive: prefer client data when available, fall back to server initial.
  // This survives transient (isPending=false, data=null) windows during
  // back/forward navigation when better-auth store is being re-validated.
  // Logout flow stays correct because signOut → router.push + router.refresh
  // re-renders server → initialSession becomes null → logged-out UI.
  const effectiveUser =
    clientSession?.user ?? initialSession?.user ?? null;

  if (!effectiveUser) {
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

  return <ProfileDropdown initialSession={initialSession} />;
}
