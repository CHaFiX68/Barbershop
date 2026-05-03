"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const POLL_INTERVAL_MS = 30_000;

export default function AdminNav() {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetchUnread = async () => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState !== "visible"
      ) {
        return;
      }
      try {
        const res = await fetch("/api/admin/support/list?status=active");
        if (!res.ok) return;
        const data = (await res.json()) as {
          chats: { unreadByAdmin: number }[];
        };
        if (cancelled) return;
        const total = data.chats.reduce(
          (sum, c) => sum + (c.unreadByAdmin ?? 0),
          0
        );
        setUnread(total);
      } catch {
        // non-fatal
      }
    };
    fetchUnread();
    const id = setInterval(fetchUnread, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const items: { href: string; label: string; badge?: number }[] = [
    { href: "/", label: "← На головну" },
    { href: "/admin/support", label: "Підтримка", badge: unread },
  ];

  return (
    <nav
      className="flex items-center gap-1 px-4 sm:px-6 py-3"
      style={{
        background: "#FAF7F1",
        borderBottomWidth: "1px",
        borderBottomStyle: "solid",
        borderBottomColor: "#D5D0C8",
      }}
    >
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[8px] text-[13px] transition-colors ${
              isActive
                ? "bg-[var(--color-text)] text-white"
                : "text-[var(--color-text)] hover:bg-[#EDEAE5]"
            }`}
          >
            <span>{item.label}</span>
            {item.badge != null && item.badge > 0 && (
              <span
                className="inline-flex items-center justify-center rounded-full"
                style={{
                  background: isActive ? "white" : "#A03030",
                  color: isActive ? "var(--color-text)" : "white",
                  minWidth: "18px",
                  height: "18px",
                  fontSize: "10px",
                  fontWeight: 500,
                  padding: "0 5px",
                }}
              >
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
