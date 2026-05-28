import { z } from "zod";

/** The exact column names expected in the CSV (case-insensitive match in parser). */
export const REQUIRED_HEADERS = [
  "employee_id",
  "name",
  "email",
  "designation",
  "base_salary",
  "hra",
  "allowances",
  "deductions",
  "month",
  "year",
] as const;

/**
 * Validates CSV headers and returns an array of missing column names.
 * Returns an empty array if all required headers are present.
 */
export function validateCsvHeaders(headers: string[]): string[] {
  const normalised = headers.map((h) => h.trim().toLowerCase());
  return REQUIRED_HEADERS.filter((h) => !normalised.includes(h));
}

/**
 * Zod schema for a single CSV row.
 * At this stage, all values are strings — numerical parsing happens in lib/csv.ts.
 */
export const csvRowSchema = z.object({
  employee_id: z
    .string()
    .trim()
    .min(1, "Employee ID is required"),
  name: z
    .string()
    .trim()
    .min(1, "Name is required"),
  email: z
    .string()
    .trim()
    .email("Invalid email address"),
  designation: z
    .string()
    .trim()
    .min(1, "Designation is required"),
  base_salary: z
    .string()
    .trim()
    .min(1, "Base salary is required"),
  hra: z.string().trim().default("0"),
  allowances: z.string().trim().default("0"),
  deductions: z.string().trim().default("0"),
  month: z
    .string()
    .trim()
    .min(1, "Month is required"),
  year: z
    .string()
    .trim()
    .min(1, "Year is required"),
});

export type CsvRowInput = z.input<typeof csvRowSchema>;
