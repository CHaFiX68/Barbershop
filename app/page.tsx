import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getContentMap } from "@/lib/content";
import { getHeroSlides } from "@/lib/hero-slides";
import { HERO_CONTENT } from "@/lib/data";
import {
  buildSchedule,
  computeOpenStatus,
  type ScheduleInput,
} from "@/lib/schedule";
import HeroSlider from "@/components/hero-slider";
import BarbersSection from "@/components/barbers-section";
import AboutSection from "@/components/about-section";
import ContactsSection from "@/components/contacts-section";
import Footer from "@/components/footer";

const SCHEDULE_DEFAULTS: Record<string, string> = {
  "contacts.hours.weekdays.day": "Пн — Пт",
  "contacts.hours.weekdays.time": "10:00 — 21:00",
  "contacts.hours.sat.day": "Сб",
  "contacts.hours.sat.time": "10:00 — 20:00",
  "contacts.hours.sun.day": "Нд",
  "contacts.hours.sun.time": "Вихідний",
};

export default async function Home() {
  const heroDefaults: Record<string, string> = {
    "hero.title.line1": HERO_CONTENT.titleLine1,
    "hero.title.line2": HERO_CONTENT.titleLine2,
    "hero.tagline": HERO_CONTENT.tagline,
  };

  const [heroContent, scheduleContent, slides, session] = await Promise.all([
    getContentMap(heroDefaults),
    getContentMap(SCHEDULE_DEFAULTS),
    getHeroSlides(),
    auth.api.getSession({ headers: await headers() }),
  ]);

  const isAdmin = session?.user?.role === "admin";

  const scheduleEntries: ScheduleInput[] = [
    {
      dayInput: scheduleContent["contacts.hours.weekdays.day"],
      timeInput: scheduleContent["contacts.hours.weekdays.time"],
    },
    {
      dayInput: scheduleContent["contacts.hours.sat.day"],
      timeInput: scheduleContent["contacts.hours.sat.time"],
    },
    {
      dayInput: scheduleContent["contacts.hours.sun.day"],
      timeInput: scheduleContent["contacts.hours.sun.time"],
    },
  ];
  const initialOpenStatus = computeOpenStatus(buildSchedule(scheduleEntries));

  return (
    <>
      <main className="flex-1 flex flex-col">
        <HeroSlider
          titleLine1={heroContent["hero.title.line1"]}
          titleLine2={heroContent["hero.title.line2"]}
          tagline={heroContent["hero.tagline"]}
          slides={slides}
          isAdmin={isAdmin}
          scheduleEntries={scheduleEntries}
          initialOpenStatus={initialOpenStatus}
        />
        <BarbersSection />
        <AboutSection />
        <ContactsSection />
      </main>
      <Footer />
    </>
  );
}
