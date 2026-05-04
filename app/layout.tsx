import { Suspense } from "react";
import type { Metadata } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import AuthModal from "@/components/auth/auth-modal";
import ChatBubble from "@/components/chat/chat-bubble";
import Header from "@/components/header";
import { auth } from "@/lib/auth";
import { ChatProvider } from "@/lib/chat-context";
import { getContentMap } from "@/lib/content";
import { NAV_ITEMS } from "@/lib/data";

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

export const metadata: Metadata = {
  title: "BARBER&CO — класичний барбершоп",
  description:
    "BARBER&CO — класичний барбершоп у Києві. Стрижки, гоління, догляд за бородою. Запис онлайн.",
};

function navKey(href: string) {
  return `header.nav.${href.replace(/^#/, "")}`;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const navDefaults: Record<string, string> = {};
  for (const item of NAV_ITEMS) {
    navDefaults[navKey(item.href)] = item.label;
  }

  const [navContent, session] = await Promise.all([
    getContentMap(navDefaults),
    auth.api.getSession({ headers: await headers() }),
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
      lang="uk"
      className={`${fraunces.variable} ${dmSans.variable} antialiased`}
    >
      <body
        className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)]"
        suppressHydrationWarning
      >
        <ChatProvider>
          <Header navItems={navItems} initialSession={initialSession} />
          {children}
          <Suspense fallback={null}>
            <AuthModal />
          </Suspense>
          {initialSession && (
            <ChatBubble initialRole={initialSession.user.role ?? null} />
          )}
        </ChatProvider>
      </body>
    </html>
  );
}
