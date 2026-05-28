import { NextResponse } from "next/server";
import { ZodError } from "zod";

/** Custom application error — use for known business-logic failures. */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Centralised API error handler.
 * Maps Zod validation errors, Prisma errors, and AppErrors to clean JSON responses.
 * Always returns a NextResponse — never throws.
 */
export function handleApiError(err: unknown): NextResponse {
  // Zod validation failure
  if (err instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed. Please check your input.",
        issues: err.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 422 }
    );
  }

  // Application-level known errors
  if (err instanceof AppError) {
    return NextResponse.json({ error: err.message }, { status: err.statusCode });
  }

  // Prisma known request errors (check by duck-typing for Edge compat)
  if (err != null && typeof err === "object" && "code" in err) {
    const code = (err as { code: string }).code;
    if (code === "P2002") {
      return NextResponse.json(
        { error: "A record with this data already exists." },
        { status: 409 }
      );
    }
    if (code === "P2025") {
      return NextResponse.json(
        { error: "Record not found." },
        { status: 404 }
      );
    }
  }

  // Unexpected error — log it, return generic message
  console.error("[API Error]", err);
  return NextResponse.json(
    { error: "An unexpected error occurred. Please try again." },
    { status: 500 }
  );
}
