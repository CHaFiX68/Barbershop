"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

type Props = {
  className?: string;
};

export default function LogoutButton({ className }: Props) {
  const router = useRouter();

  const handleClick = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className ?? "text-sm hover:text-black"}
    >
      Вийти
    </button>
  );
}
