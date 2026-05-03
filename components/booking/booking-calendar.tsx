"use client";

import { useEffect, useState } from "react";
import type { WeekSchedule } from "@/lib/db/schema";

const WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];
const MONTH_NAMES = [
  "Січень",
  "Лютий",
  "Березень",
  "Квітень",
  "Травень",
  "Червень",
  "Липень",
  "Серпень",
  "Вересень",
  "Жовтень",
  "Листопад",
  "Грудень",
];
const DAY_KEYS_BY_INDEX: (keyof WeekSchedule)[] = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
];
const MAX_DAYS_AHEAD = 30;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getCalendarGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const firstWeekdayMonFirst = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - firstWeekdayMonFirst);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    days.push(
      new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    );
  }
  return days;
}

type Props = {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  schedule: WeekSchedule;
};

export default function BookingCalendar({
  selectedDate,
  onDateSelect,
  schedule,
}: Props) {
  const [today, setToday] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState<{
    year: number;
    month: number;
  } | null>(null);

  useEffect(() => {
    const t = startOfDay(new Date());
    setToday(t);
    if (selectedDate) {
      setCurrentMonth({
        year: selectedDate.getFullYear(),
        month: selectedDate.getMonth(),
      });
    } else {
      setCurrentMonth({ year: t.getFullYear(), month: t.getMonth() });
    }
  }, [selectedDate]);

  if (!today || !currentMonth) {
    return (
      <div className="bg-[#FAF7F1] border border-[var(--color-line)] rounded-[12px] p-4 h-[360px] animate-pulse" />
    );
  }

  const maxDate = startOfDay(
    new Date(today.getTime() + MAX_DAYS_AHEAD * 86_400_000)
  );
  const days = getCalendarGrid(currentMonth.year, currentMonth.month);

  const canGoBack =
    currentMonth.year > today.getFullYear() ||
    (currentMonth.year === today.getFullYear() &&
      currentMonth.month > today.getMonth());

  const nextMonthYear =
    currentMonth.month === 11 ? currentMonth.year + 1 : currentMonth.year;
  const nextMonthMonth = (currentMonth.month + 1) % 12;
  const firstOfNextMonth = new Date(nextMonthYear, nextMonthMonth, 1);
  const canGoForward = firstOfNextMonth <= maxDate;

  const handlePrev = () => {
    if (!canGoBack) return;
    const prevYear =
      currentMonth.month === 0 ? currentMonth.year - 1 : currentMonth.year;
    const prevMonth = currentMonth.month === 0 ? 11 : currentMonth.month - 1;
    setCurrentMonth({ year: prevYear, month: prevMonth });
  };
  const handleNext = () => {
    if (!canGoForward) return;
    setCurrentMonth({ year: nextMonthYear, month: nextMonthMonth });
  };

  return (
    <div className="bg-[#FAF7F1] border border-[var(--color-line)] rounded-[12px] p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={handlePrev}
          disabled={!canGoBack}
          aria-label="Попередній місяць"
          className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-[#EDEAE5] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path
              d="M9 1L3 7l6 6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h3
          className="font-display text-[var(--color-text)]"
          style={{ fontSize: "18px", fontWeight: 500 }}
        >
          {MONTH_NAMES[currentMonth.month]} {currentMonth.year}
        </h3>
        <button
          type="button"
          onClick={handleNext}
          disabled={!canGoForward}
          aria-label="Наступний місяць"
          className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-[#EDEAE5] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path
              d="M5 1l6 6-6 6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAY_LABELS.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-muted)] font-medium py-1"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const isCurrentMonth = day.getMonth() === currentMonth.month;
          const isPast = day < today;
          const isFuture = day > maxDate;
          const isToday = isSameDay(day, today);
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const dayKey = DAY_KEYS_BY_INDEX[day.getDay()];
          const isOffDay = !schedule[dayKey]?.enabled;
          const disabled = !isCurrentMonth || isPast || isFuture || isOffDay;

          let cls =
            "aspect-square flex items-center justify-center rounded-[8px] text-[13px] transition-colors";
          if (!isCurrentMonth) {
            cls +=
              " opacity-30 cursor-not-allowed text-[var(--color-text-muted)]";
          } else if (isPast || isFuture) {
            cls +=
              " opacity-30 cursor-not-allowed text-[var(--color-text-muted)]";
          } else if (isOffDay) {
            cls += " opacity-50 cursor-not-allowed text-[#C9B89A]";
          } else if (isSelected) {
            cls +=
              " bg-[var(--color-text)] text-white cursor-pointer font-medium";
          } else {
            cls += " text-[var(--color-text)] hover:bg-[#EDEAE5] cursor-pointer";
            if (isToday) cls += " ring-1 ring-[#C9B89A]";
          }

          let title: string | undefined;
          if (isCurrentMonth) {
            if (isPast) title = "Минула дата";
            else if (isFuture) title = "Поза вікном бронювання";
            else if (isOffDay) title = "Вихідний";
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() => !disabled && onDateSelect(day)}
              disabled={disabled}
              className={cls}
              title={title}
              aria-disabled={disabled}
              aria-label={`${day.getDate()} ${MONTH_NAMES[day.getMonth()]}`}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
