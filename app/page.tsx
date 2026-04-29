import Header from "@/components/header";
import HeroSlider from "@/components/hero-slider";
import BarbersSection from "@/components/barbers-section";
import AboutSection from "@/components/about-section";
import ContactsSection from "@/components/contacts-section";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1 flex flex-col">
        <HeroSlider />
        <BarbersSection />
        <AboutSection />
        <ContactsSection />
      </main>
      <Footer />
    </>
  );
}
