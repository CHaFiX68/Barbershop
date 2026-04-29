"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth-client";

export default function HeaderAuth() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  if (isPending) {
    return <div className="w-32 h-9" aria-hidden="true" />;
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors px-3 py-2"
        >
          Увійти
        </Link>
        <Link
          href="/register"
          className="text-sm bg-black text-white border border-transparent rounded-[8px] px-4 py-2 hover:bg-transparent hover:text-black hover:border-black transition-colors"
        >
          Реєстрація
        </Link>
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  const initial = session.user.name?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/profile"
        className="text-sm flex items-center gap-2 hover:text-[var(--color-text)] transition-colors"
      >
        <span
          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-line)] text-xs font-medium uppercase"
        >
          {initial}
        </span>
        <span className="hidden sm:inline">{session.user.name}</span>
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors px-3 py-2 rounded-[8px]"
      >
        Вийти
      </button>
    </div>
  );
}
