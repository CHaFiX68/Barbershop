import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const path = request.nextUrl.pathname;

  if (path.startsWith("/barber") || path.startsWith("/admin")) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/?auth=login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/barber/:path*", "/admin/:path*"],
};
