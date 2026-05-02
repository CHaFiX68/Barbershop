import type { DaySchedule, WeekSchedule } from "./db/schema";

export const DAY_KEYS: (keyof WeekSchedule)[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

const DEFAULT_DAY: DaySchedule = {
  enabled: false,
  startMinutes: 600,
  endMinutes: 1260,
  breakStartMinutes: null,
  breakEndMinutes: null,
};

export const DEFAULT_SCHEDULE: WeekSchedule = {
  mon: { ...DEFAULT_DAY },
  tue: { ...DEFAULT_DAY },
  wed: { ...DEFAULT_DAY },
  thu: { ...DEFAULT_DAY },
  fri: { ...DEFAULT_DAY },
  sat: { ...DEFAULT_DAY },
  sun: { ...DEFAULT_DAY },
};

export function normalizeWeekSchedule(input: unknown): WeekSchedule {
  const result: WeekSchedule = {
    mon: { ...DEFAULT_DAY },
    tue: { ...DEFAULT_DAY },
    wed: { ...DEFAULT_DAY },
    thu: { ...DEFAULT_DAY },
    fri: { ...DEFAULT_DAY },
    sat: { ...DEFAULT_DAY },
    sun: { ...DEFAULT_DAY },
  };
  if (!input || typeof input !== "object") return result;
  const obj = input as Record<string, unknown>;
  for (const k of DAY_KEYS) {
    const day = obj[k];
    if (!day || typeof day !== "object") continue;
    const d = day as Record<string, unknown>;
    const norm: DaySchedule = { ...DEFAULT_DAY };
    if (typeof d.enabled === "boolean") norm.enabled = d.enabled;
    if (typeof d.startMinutes === "number") norm.startMinutes = d.startMinutes;
    if (typeof d.endMinutes === "number") norm.endMinutes = d.endMinutes;
    if (d.breakStartMinutes === null || typeof d.breakStartMinutes === "number") {
      norm.breakStartMinutes = d.breakStartMinutes as number | null;
    }
    if (d.breakEndMinutes === null || typeof d.breakEndMinutes === "number") {
      norm.breakEndMinutes = d.breakEndMinutes as number | null;
    }
    result[k] = norm;
  }
  return result;
}

export function minutesToHHMM(m: number): string {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function HHMMtoMinutes(s: string): number {
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return 0;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

const DAY_TOKENS: Record<string, number> = {
  пн: 1,
  вт: 2,
  ср: 3,
  чт: 4,
  пт: 5,
  сб: 6,
  нд: 0,
};

const WEEK_ORDER_MON_FIRST = [1, 2, 3, 4, 5, 6, 0];

function parseDayToken(token: string): number | null {
  const t = token.trim().toLowerCase().slice(0, 2);
  return t in DAY_TOKENS ? DAY_TOKENS[t] : null;
}

export function parseDays(input: string): number[] {
  const t = input.trim();
  if (!t) return [];
  const parts = t
    .split(/[—–\-]/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 1) {
    const d = parseDayToken(parts[0]);
    return d !== null ? [d] : [];
  }
  if (parts.length >= 2) {
    const start = parseDayToken(parts[0]);
    const end = parseDayToken(parts[parts.length - 1]);
    if (start === null || end === null) return [];
    const startIdx = WEEK_ORDER_MON_FIRST.indexOf(start);
    const endIdx = WEEK_ORDER_MON_FIRST.indexOf(end);
    if (startIdx === -1 || endIdx === -1) return [];
    const result: number[] = [];
    if (startIdx <= endIdx) {
      for (let i = startIdx; i <= endIdx; i++)
        result.push(WEEK_ORDER_MON_FIRST[i]);
    } else {
      for (let i = startIdx; i < WEEK_ORDER_MON_FIRST.length; i++)
        result.push(WEEK_ORDER_MON_FIRST[i]);
      for (let i = 0; i <= endIdx; i++) result.push(WEEK_ORDER_MON_FIRST[i]);
    }
    return result;
  }
  return [];
}

export function parseTimeRange(
  input: string
): { open: number; close: number } | null {
  const t = input.trim();
  if (!t) return null;
  if (/вихід|закрит|зачинен|closed|day\s*off/i.test(t)) return null;
  const parts = t
    .split(/[—–\-]/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length !== 2) return null;
  const parseHM = (s: string): number | null => {
    const hm = s.match(/^(\d{1,2}):(\d{2})$/);
    if (hm) {
      const h = parseInt(hm[1], 10);
      const m = parseInt(hm[2], 10);
      if (h < 0 || h > 24 || m < 0 || m > 59) return null;
      return h * 60 + m;
    }
    const h = s.match(/^(\d{1,2})$/);
    if (h) {
      const hv = parseInt(h[1], 10);
      if (hv < 0 || hv > 24) return null;
      return hv * 60;
    }
    return null;
  };
  const open = parseHM(parts[0]);
  const close = parseHM(parts[1]);
  if (open === null || close === null) return null;
  return { open, close };
}

export type ScheduleEntry = {
  days: number[];
  open: number | null;
  close: number | null;
};

export type ScheduleInput = {
  dayInput: string;
  timeInput: string;
};

export function buildSchedule(entries: ScheduleInput[]): ScheduleEntry[] {
  return entries.map((e) => {
    const days = parseDays(e.dayInput);
    const time = parseTimeRange(e.timeInput);
    return time
      ? { days, open: time.open, close: time.close }
      : { days, open: null, close: null };
  });
}

export type OpenStatus = {
  state: "open" | "closed_today" | "day_off" | "unknown";
  todayLabel: string;
};

function fmt(m: number): string {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function computeOpenStatus(
  schedule: ScheduleEntry[],
  now: Date = new Date()
): OpenStatus {
  const day = now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const entry = schedule.find((s) => s.days.includes(day));
  if (!entry) return { state: "unknown", todayLabel: "" };
  if (entry.open === null || entry.close === null) {
    return { state: "day_off", todayLabel: "" };
  }
  const isOpen = minutes >= entry.open && minutes < entry.close;
  const label = `${fmt(entry.open)} — ${fmt(entry.close)}`;
  return {
    state: isOpen ? "open" : "closed_today",
    todayLabel: label,
  };
}
