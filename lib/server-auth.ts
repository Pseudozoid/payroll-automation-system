import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, validateSessionToken } from "./auth";

/**
 * Server-side guard for app route handlers. Returns a NextResponse (401) when
 * authentication fails, otherwise returns null so callers can continue.
 */
export async function requireServerAuth() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ok = await validateSessionToken(token);
    if (!ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return null;
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
