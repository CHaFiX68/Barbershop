"use client";

import Image from "next/image";

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
  if (barbers.length === 0) {
    return (
      <div className="text-center py-6 text-[var(--color-text-muted)] text-[13px]">
        Список порожній
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {barbers.map((b) => (
        <div
          key={b.userId}
          className="flex items-center gap-3 px-2 py-2.5 rounded-[8px] hover:bg-[#F9F6F1] transition-colors border-b border-[var(--color-line)] last:border-b-0"
        >
          <div className="flex-shrink-0">
            {b.avatar ? (
              <Image
                src={b.avatar}
                alt={b.name}
                width={36}
                height={36}
                className="rounded-full object-cover"
                style={{ width: 36, height: 36 }}
              />
            ) : (
              <div
                className="w-9 h-9 rounded-full bg-[#F5F0E6] flex items-center justify-center font-display italic"
                style={{ color: "#C9B89A", fontSize: "16px" }}
              >
                {b.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium truncate">{b.name}</div>
            <div className="text-[11px] text-[var(--color-text-muted)] truncate">
              {b.email}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onDelete(b.userId, b.name)}
            disabled={busyUserId === b.userId}
            className="px-3 py-1.5 rounded-[8px] text-[12px] text-[#A03030] hover:bg-[rgba(160,48,48,0.06)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            Видалити
          </button>
        </div>
      ))}
    </div>
  );
}
