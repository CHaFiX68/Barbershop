"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

type Props = {
  name: string;
  email: string;
  createdAt: string;
};

export default function ProfileContent({ name, email, createdAt }: Props) {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  const formattedDate = new Date(createdAt).toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const initial = name?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="max-w-2xl mx-auto bg-white border border-[var(--color-line)] rounded-[16px] p-8 sm:p-10">
      <div className="flex items-center gap-5 mb-8">
        <div className="w-16 h-16 rounded-full bg-[var(--color-line)] flex items-center justify-center font-medium uppercase text-xl">
          {initial}
        </div>
        <div>
          <h1
            className="font-display leading-tight"
            style={{ fontWeight: 600, fontSize: "32px" }}
          >
            {name}
          </h1>
          <p
            className="mt-1 text-[var(--color-text-muted)]"
            style={{ fontSize: "14px" }}
          >
            {email}
          </p>
        </div>
      </div>

      <div className="border-t border-[var(--color-line)] pt-6">
        <div className="flex justify-between items-center py-3 border-b border-[var(--color-line)]">
          <span
            className="text-[var(--color-text-muted)]"
            style={{
              fontSize: "11px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            Зареєстровано
          </span>
          <span style={{ fontSize: "14px" }}>{formattedDate}</span>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={handleLogout}
          className="bg-black text-white border border-transparent rounded-[8px] px-6 py-3 text-sm font-medium transition-colors hover:bg-transparent hover:text-black hover:border-black"
        >
          Вийти
        </button>
      </div>
    </div>
  );
}
