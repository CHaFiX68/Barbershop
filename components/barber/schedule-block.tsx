"use client";

import type { DaySchedule, WeekSchedule } from "@/lib/db/schema";

const DAY_LABELS: { key: keyof WeekSchedule; label: string }[] = [
  { key: "mon", label: "Понеділок" },
  { key: "tue", label: "Вівторок" },
  { key: "wed", label: "Середа" },
  { key: "thu", label: "Четвер" },
  { key: "fri", label: "П'ятниця" },
  { key: "sat", label: "Субота" },
  { key: "sun", label: "Неділя" },
];

const TIME_OPTIONS: { value: number; label: string }[] = [];
for (let m = 0; m <= 1440; m += 15) {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  TIME_OPTIONS.push({
    value: m,
    label: `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`,
  });
}

const DEFAULT_ENABLED_DAY: DaySchedule = {
  enabled: true,
  startMinutes: 600,
  endMinutes: 1260,
  breakStartMinutes: null,
  breakEndMinutes: null,
};

const DEFAULT_BREAK_START = 780;
const DEFAULT_BREAK_END = 840;

type Props = {
  schedule: WeekSchedule;
  onChange: (next: WeekSchedule) => void;
};

function TimeSelect({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value, 10))}
      disabled={disabled}
      className="h-[32px] bg-white border border-[var(--color-line)] rounded-[6px] px-2 text-[12px] outline-none focus:border-[var(--color-text)] disabled:opacity-50"
    >
      {TIME_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export default function ScheduleBlock({ schedule, onChange }: Props) {
  const updateDay = (key: keyof WeekSchedule, patch: Partial<DaySchedule>) => {
    onChange({
      ...schedule,
      [key]: { ...schedule[key], ...patch },
    });
  };

  const toggleEnabled = (key: keyof WeekSchedule) => {
    const day = schedule[key];
    if (day.enabled) {
      updateDay(key, { enabled: false });
    } else {
      updateDay(key, {
        ...DEFAULT_ENABLED_DAY,
      });
    }
  };

  const addBreak = (key: keyof WeekSchedule) => {
    const day = schedule[key];
    const safeStart = Math.max(DEFAULT_BREAK_START, day.startMinutes);
    const safeEnd = Math.min(DEFAULT_BREAK_END, day.endMinutes);
    const start = safeStart < day.endMinutes ? safeStart : day.startMinutes;
    const end = safeEnd > start ? safeEnd : Math.min(start + 60, day.endMinutes);
    updateDay(key, {
      breakStartMinutes: start,
      breakEndMinutes: end,
    });
  };

  const removeBreak = (key: keyof WeekSchedule) => {
    updateDay(key, {
      breakStartMinutes: null,
      breakEndMinutes: null,
    });
  };

  return (
    <article className="bg-white border border-[var(--color-line)] rounded-[16px] p-5 sm:p-7">
      <p
        className="text-center text-[var(--color-text-muted)] mb-4"
        style={{
          fontSize: "10px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
        }}
      >
        Робочий графік
      </p>

      <div>
        {DAY_LABELS.map(({ key, label }, i) => {
          const day = schedule[key];
          const hasBreak =
            day.breakStartMinutes !== null && day.breakEndMinutes !== null;
          const isLast = i === DAY_LABELS.length - 1;
          return (
            <div
              key={key}
              className={`grid grid-cols-[110px_1fr_auto] items-center gap-3 py-3 ${
                isLast ? "" : "border-b border-[var(--color-line)]"
              }`}
            >
              <div className="text-[14px] font-medium">{label}</div>

              {day.enabled ? (
                <div className="flex items-center gap-2 text-[12px] flex-wrap">
                  <TimeSelect
                    value={day.startMinutes}
                    onChange={(n) => updateDay(key, { startMinutes: n })}
                  />
                  <span className="text-[var(--color-text-muted)]">—</span>
                  <TimeSelect
                    value={day.endMinutes}
                    onChange={(n) => updateDay(key, { endMinutes: n })}
                  />

                  {hasBreak ? (
                    <>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)] ml-2">
                        перерва
                      </span>
                      <TimeSelect
                        value={day.breakStartMinutes ?? 0}
                        onChange={(n) =>
                          updateDay(key, { breakStartMinutes: n })
                        }
                      />
                      <span className="text-[var(--color-text-muted)]">—</span>
                      <TimeSelect
                        value={day.breakEndMinutes ?? 0}
                        onChange={(n) => updateDay(key, { breakEndMinutes: n })}
                      />
                      <button
                        type="button"
                        onClick={() => removeBreak(key)}
                        title="Прибрати перерву"
                        aria-label="Прибрати перерву"
                        className="w-[32px] h-[32px] flex items-center justify-center rounded-[6px] text-[var(--color-text-muted)] hover:bg-black/5 hover:text-[#A03030] transition-colors text-[14px]"
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => addBreak(key)}
                      className="h-[32px] border border-[var(--color-line)] bg-transparent text-[12px] text-[var(--color-text)] px-3 rounded-[6px] hover:bg-[#F5F0E6] transition-colors ml-2"
                    >
                      + Перерва
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-[13px] text-[var(--color-text-muted)] italic">
                  Вихідний
                </div>
              )}

              <button
                type="button"
                onClick={() => toggleEnabled(key)}
                className={`h-[32px] px-3 rounded-[6px] text-[11px] uppercase tracking-[0.15em] transition-colors ${
                  day.enabled
                    ? "bg-black text-white"
                    : "bg-[#F5F0E6] text-[var(--color-text-muted)] hover:bg-[#EBE5D8]"
                }`}
              >
                {day.enabled ? "Працює" : "Вихідний"}
              </button>
            </div>
          );
        })}
      </div>
    </article>
  );
}
