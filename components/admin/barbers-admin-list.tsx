"use client";

import Image from "next/image";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

type BarberSummary = {
  userId: string;
  name: string;
  email: string;
  avatar: string | null;
  isActive: boolean;
};

type Props = {
  barbers: BarberSummary[];
  busyUserId: string | null;
  onDelete: (userId: string, name: string) => void;
};

export default function BarbersAdminList({
  barbers,
  busyUserId,
  onDelete,
}: Props) {
  const t = useTranslations("management");
  if (barbers.length === 0) {
    return (
      <div className="text-center py-6 text-[var(--color-text-muted)] text-[13px]">
        Список порожній
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {barbers.map((b) => (
        <div
          key={b.userId}
          className="flex items-stretch bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] overflow-hidden"
        >
          <div className="flex-1 min-w-0 flex items-center gap-2.5 px-2.5 py-1.5">
            <div className="flex-shrink-0">
              {b.avatar ? (
                <Image
                  src={b.avatar}
                  alt={b.name}
                  width={30}
                  height={30}
                  sizes="30px"
                  className="rounded-full object-cover"
                  style={{ width: 30, height: 30 }}
                />
              ) : (
                <div
                  className="w-[30px] h-[30px] rounded-full bg-[var(--color-surface-2)] flex items-center justify-center font-display italic"
                  style={{ color: "var(--color-bronze)", fontSize: "14px" }}
                >
                  {b.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium truncate leading-tight">
                {b.name}
              </div>
              <div className="text-[10px] text-[var(--color-text-muted)] truncate mt-0.5">
                {b.email}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onDelete(b.userId, b.name)}
            disabled={busyUserId === b.userId}
            aria-label={t("deleteBarber")}
            className="w-10 flex-shrink-0 border-l border-[var(--color-line)] flex items-center justify-center text-[var(--color-danger)] hover:bg-[var(--color-surface-2)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={16} strokeWidth={1.75} />
          </button>
        </div>
      ))}
    </div>
  );
}
