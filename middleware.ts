import { NextResponse, type NextRequest } from "next/server";
import { validateSessionToken, COOKIE_NAME } from "@/lib/auth";

/**
 * Routes that are publicly accessible without authentication.
 */
const PUBLIC_PATHS: string[] = ["/login", "/api/auth/login"];

/**
 * Static asset path prefixes that should never be intercepted.
 */
const STATIC_PREFIXES: string[] = ["/_next", "/favicon.ico", "/public"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  // Skip static assets
  if (STATIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Keep authenticated users out of login page.
  if (pathname === "/login") {
    if (!token) {
      return NextResponse.next();
    }

    const isValid = await validateSessionToken(token);

    if (isValid) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const res = NextResponse.next();
    res.cookies.delete(COOKIE_NAME);
    return res;
  }

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Validate session token
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const isValid = await validateSessionToken(token);

  if (!isValid) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete(COOKIE_NAME);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  // Match all routes except Next.js internals and static files
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
