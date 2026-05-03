import "server-only";

import type { WeekSchedule } from "./db/schema";

export const SLOT_MINUTES = 30;
export const BOOKING_DAYS_AHEAD = 30;
export const BOOKING_TZ = "Europe/Stockholm";
export const BOOKING_CUTOFF_MINUTES = 30;

const WEEKDAY_TO_KEY: Record<string, keyof WeekSchedule> = {
  Sun: "sun",
  Mon: "mon",
  Tue: "tue",
  Wed: "wed",
  Thu: "thu",
  Fri: "fri",
  Sat: "sat",
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function slotsForService(estimatedMinutes: number): number {
  return Math.max(1, Math.ceil(estimatedMinutes / SLOT_MINUTES));
}

function getDayKeyInTZ(
  date: Date,
  tz: string = BOOKING_TZ
): keyof WeekSchedule {
  const wd = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
  }).format(date);
  return WEEKDAY_TO_KEY[wd] ?? "mon";
}

function getLocalMinutesOfDay(
  date: Date,
  tz: string = BOOKING_TZ
): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  const h = map.hour === "24" ? 0 : parseInt(map.hour, 10);
  const m = parseInt(map.minute, 10);
  return h * 60 + m;
}

export function generateDaySlots(
  date: Date,
  schedule: WeekSchedule
): { startTime: string; endTime: string }[] {
  const dayKey = getDayKeyInTZ(date);
  const day = schedule[dayKey];
  if (!day || !day.enabled) return [];

  const result: { startTime: string; endTime: string }[] = [];
  for (
    let m = day.startMinutes;
    m + SLOT_MINUTES <= day.endMinutes;
    m += SLOT_MINUTES
  ) {
    const slotEnd = m + SLOT_MINUTES;
    if (
      day.breakStartMinutes !== null &&
      day.breakEndMinutes !== null &&
      m < day.breakEndMinutes &&
      slotEnd > day.breakStartMinutes
    ) {
      continue;
    }
    result.push({
      startTime: `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`,
      endTime: `${pad2(Math.floor(slotEnd / 60))}:${pad2(slotEnd % 60)}`,
    });
  }
  return result;
}

export function isSlotAvailable(
  slotStart: Date,
  slotsNeeded: number,
  schedule: WeekSchedule,
  existingBookings: { startsAt: Date; endsAt: Date }[],
  now: Date = new Date()
): boolean {
  const cutoff = new Date(now.getTime() + BOOKING_CUTOFF_MINUTES * 60_000);
  if (slotStart < cutoff) return false;

  const slotEnd = new Date(
    slotStart.getTime() + slotsNeeded * SLOT_MINUTES * 60_000
  );

  const dayKey = getDayKeyInTZ(slotStart);
  const day = schedule[dayKey];
  if (!day || !day.enabled) return false;

  const localStartMin = getLocalMinutesOfDay(slotStart);
  const localEndMin = localStartMin + slotsNeeded * SLOT_MINUTES;

  if (localStartMin < day.startMinutes) return false;
  if (localEndMin > day.endMinutes) return false;

  if (
    day.breakStartMinutes !== null &&
    day.breakEndMinutes !== null &&
    localStartMin < day.breakEndMinutes &&
    localEndMin > day.breakStartMinutes
  ) {
    return false;
  }

  for (const b of existingBookings) {
    if (slotStart < b.endsAt && slotEnd > b.startsAt) return false;
  }

  return true;
}

export function localToUTC(
  dateStr: string,
  timeStr: string,
  tz: string = BOOKING_TZ
): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  const guess = new Date(Date.UTC(year, month - 1, day, hours, minutes));
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(guess);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  const localHour = map.hour === "24" ? 0 : parseInt(map.hour, 10);
  const localMinute = parseInt(map.minute, 10);
  const diffMin =
    (hours - localHour) * 60 + (minutes - localMinute);
  return new Date(guess.getTime() + diffMin * 60_000);
}

export function todayInTZ(tz: string = BOOKING_TZ): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  return `${map.year}-${map.month}-${map.day}`;
}
