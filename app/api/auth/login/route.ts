import { NextResponse } from "next/server";
import { z } from "zod";
import { createSessionToken, COOKIE_NAME } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  let email, password;
  try {
    const body = await req.json();
    const parsed = loginSchema.parse(body);
    email = parsed.email;
    password = parsed.password;
  } catch {
    return NextResponse.json(
      { error: "Invalid request data format." },
      { status: 400 }
    );
  }

  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error("[Auth] ADMIN_EMAIL or ADMIN_PASSWORD env var is not set.");
      return NextResponse.json(
        { error: "Server configuration error. Please contact support." },
        { status: 500 }
      );
    }

    // Simple constant-time-ish comparison for single-admin env-var credentials
    const emailMatch = email.toLowerCase() === adminEmail.toLowerCase();
    const passwordMatch = password === adminPassword;

    if (!emailMatch || !passwordMatch) {
      // Avoid revealing which field is wrong
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const token = await createSessionToken();

    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours in seconds
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[Auth] Internal login error:", err);
    return NextResponse.json(
      { error: "Internal server error during login." },
      { status: 500 }
    );
  }
}
