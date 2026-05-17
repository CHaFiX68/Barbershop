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

export type ContactRow = {
  label: string;
  value: string;
  href?: string;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Барбери", href: "#barbers" },
  { label: "Роботи", href: "#works" },
  { label: "Про нас", href: "#about" },
  { label: "Контакти", href: "#contacts" },
  { label: "Букінг", href: "#booking" },
];

export const SOCIALS: ContactRow[] = [
  { label: "Instagram", value: "Instagram", href: "#" },
  { label: "Telegram", value: "Telegram", href: "#" },
];
