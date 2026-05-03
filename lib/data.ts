export type Slide = {
  id: string;
  pattern: "diagonal" | "dots" | "grid" | "cross" | "stripes";
};

export const HERO_CONTENT = {
  titleLine1: "Класичний барбершоп",
  titleLine2: "у серці міста",
  tagline:
    "Догляд за бородою і чоловічі стрижки. Записуйся онлайн або заходь.",
  ctaLabel: "Записатись",
  ctaHref: "/booking",
} as const;

export type NavItem = {
  label: string;
  href: string;
};

export type ScheduleRow = {
  day: string;
  time: string;
  closed?: boolean;
};

export type ContactRow = {
  label: string;
  value: string;
  href?: string;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Барбери", href: "#barbers" },
  { label: "Про нас", href: "#about" },
  { label: "Контакти", href: "#contacts" },
  { label: "Букінг", href: "#booking" },
];

export const SLIDES: Slide[] = [
  { id: "s1", pattern: "diagonal" },
  { id: "s2", pattern: "dots" },
  { id: "s3", pattern: "grid" },
];

export const CONTACTS: ContactRow[] = [
  { label: "Адреса", value: "вул. Хрещатик, 22, Київ" },
  {
    label: "Телефон",
    value: "+38 (000) 000 00 00",
    href: "tel:+380000000000",
  },
  {
    label: "Email",
    value: "hello@barberco.ua",
    href: "mailto:hello@barberco.ua",
  },
];

export const SOCIALS: ContactRow[] = [
  { label: "Instagram", value: "Instagram", href: "#" },
  { label: "Telegram", value: "Telegram", href: "#" },
];

export const SCHEDULE: ScheduleRow[] = [
  { day: "Пн — Пт", time: "10:00 — 21:00" },
  { day: "Сб", time: "10:00 — 20:00" },
  { day: "Нд", time: "Вихідний", closed: true },
];
