import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Auth check для будь-яких /admin шляхів (з префіксом локалі або без)
  const isAdminPath = /^\/(en|sv)?\/?admin/.test(path);
  if (isAdminPath) {
    const sessionCookie = getSessionCookie(request);
    if (!sessionCookie) {
      const locale = path.startsWith("/sv") ? "sv" : "en";
      return NextResponse.redirect(
        new URL(`/${locale}?auth=login`, request.url)
      );
    }
  }

  // Locale routing для всього іншого
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
