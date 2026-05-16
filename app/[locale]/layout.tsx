import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import "../globals.css";
import AuthModal from "@/components/auth/auth-modal";
import ChatBubble from "@/components/chat/chat-bubble";
import CookieConsent from "@/components/cookie-consent";
import Header from "@/components/header";
import BookingPopupRoot from "@/components/booking/booking-popup-root";
import LavaBackground from "@/components/lava-background";
import { auth } from "@/lib/auth";
import { BookingProvider } from "@/lib/booking-context";
import { ChatProvider } from "@/lib/chat-context";
import { ConfirmDialogProvider } from "@/lib/confirm-context";
import { getTheme } from "@/lib/theme";
import { ThemeProvider } from "@/lib/theme-context";
import { getContentMap } from "@/lib/content";
import { NAV_ITEMS } from "@/lib/data";
import { ModalStackProvider } from "@/lib/modal-stack-context";
import { routing } from "@/i18n/routing";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

type LocaleMeta = {
  title: string;
  description: string;
  ogLocale: string;
};

const META: Record<string, LocaleMeta> = {
  en: {
    title: "TWOBarbers — a classic barbershop",
    description:
      "TWOBarbers — a classic barbershop in Sundbyberg. Haircuts, shaves, beard care. Book online.",
    ogLocale: "en_US",
  },
  sv: {
    title: "TWOBarbers — en klassisk barbershop",
    description:
      "TWOBarbers — en klassisk barbershop i Sundbyberg. Klippning, rakning och skäggvård. Boka online.",
    ogLocale: "sv_SE",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const m = META[locale] ?? META.en;
  return {
    title: m.title,
    description: m.description,
    openGraph: {
      title: m.title,
      description: m.description,
      siteName: "TWOBarbers",
      locale: m.ogLocale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: m.title,
      description: m.description,
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#EDEAE5" },
    { media: "(prefers-color-scheme: dark)", color: "#1A1816" },
  ],
};

function navKey(href: string) {
  return `header.nav.${href.replace(/^#/, "")}`;
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = (await import(`@/messages/${locale}.json`)).default;

  const navDefaults: Record<string, string> = {};
  for (const item of NAV_ITEMS) {
    navDefaults[navKey(item.href)] = item.label;
  }

  const [navContent, session, theme] = await Promise.all([
    getContentMap(navDefaults),
    auth.api.getSession({ headers: await headers() }),
    getTheme(),
  ]);

  const navItems = NAV_ITEMS.map((item) => {
    const key = navKey(item.href);
    return {
      href: item.href,
      label: navContent[key],
      contentKey: key,
    };
  });

  const initialSession = session?.user
    ? {
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image ?? null,
          role: session.user.role ?? null,
        },
      }
    : null;

  return (
    <html
      lang={locale}
      data-theme={theme}
      className={`${fraunces.variable} ${dmSans.variable} antialiased`}
    >
      <body
        className="min-h-screen flex flex-col text-[var(--color-text)]"
        suppressHydrationWarning
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <LavaBackground />
          <ThemeProvider initialTheme={theme}>
            <ModalStackProvider>
              <BookingProvider>
                <ChatProvider>
                  <ConfirmDialogProvider>
                    <Header navItems={navItems} initialSession={initialSession} />
                    {children}
                    <Suspense fallback={null}>
                      <AuthModal />
                    </Suspense>
                    {initialSession && (
                      <ChatBubble initialRole={initialSession.user.role ?? null} />
                    )}
                    <BookingPopupRoot />
                    <CookieConsent />
                  </ConfirmDialogProvider>
                </ChatProvider>
              </BookingProvider>
            </ModalStackProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
