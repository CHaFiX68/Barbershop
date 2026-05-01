import { getContentMap } from "@/lib/content";
import { HERO_CONTENT, NAV_ITEMS } from "@/lib/data";
import Header from "@/components/header";
import HeroSlider from "@/components/hero-slider";
import BarbersSection from "@/components/barbers-section";
import AboutSection from "@/components/about-section";
import ContactsSection from "@/components/contacts-section";
import Footer from "@/components/footer";

function navKey(href: string) {
  return `header.nav.${href.replace(/^#/, "")}`;
}

export default async function Home() {
  const heroDefaults: Record<string, string> = {
    "hero.title.line1": HERO_CONTENT.titleLine1,
    "hero.title.line2": HERO_CONTENT.titleLine2,
    "hero.tagline": HERO_CONTENT.tagline,
  };
  const navDefaults: Record<string, string> = {};
  for (const item of NAV_ITEMS) {
    navDefaults[navKey(item.href)] = item.label;
  }

  const [heroContent, navContent] = await Promise.all([
    getContentMap(heroDefaults),
    getContentMap(navDefaults),
  ]);

  const navItems = NAV_ITEMS.map((item) => {
    const key = navKey(item.href);
    return {
      href: item.href,
      label: navContent[key],
      contentKey: key,
    };
  });

  return (
    <>
      <Header navItems={navItems} />
      <main className="flex-1 flex flex-col">
        <HeroSlider
          titleLine1={heroContent["hero.title.line1"]}
          titleLine2={heroContent["hero.title.line2"]}
          tagline={heroContent["hero.tagline"]}
        />
        <BarbersSection />
        <AboutSection />
        <ContactsSection />
      </main>
      <Footer />
    </>
  );
}
