/**
 * CSV parsing and validation pipeline.
 * This module is framework-agnostic and safe to use in both browser (client components)
 * and server (API routes / Server Components).
 */

import { csvRowSchema, validateCsvHeaders } from "@/validations/csv";
import type { RawCsvRow, ValidatedCsvRow, CsvRowError, CsvValidationResult } from "@/types";
import { roundCurrency } from "./utils";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function parsePositiveFloat(raw: string | undefined, fieldName: string): { value: number; error?: string } {
  const str = (raw ?? "").trim();
  if (str === "") return { value: 0 };
  const num = parseFloat(str);
  if (isNaN(num)) return { value: 0, error: `${fieldName} must be a valid number (got "${str}")` };
  if (num < 0) return { value: 0, error: `${fieldName} cannot be negative` };
  return { value: roundCurrency(num) };
}

function parseIntInRange(
  raw: string | undefined,
  fieldName: string,
  min: number,
  max: number
): { value: number; error?: string } {
  const str = (raw ?? "").trim();
  const num = parseInt(str, 10);
  if (isNaN(num)) return { value: min, error: `${fieldName} must be a valid integer` };
  if (num < min || num > max) {
    return { value: min, error: `${fieldName} must be between ${min} and ${max} (got ${num})` };
  }
  return { value: num };
}

// ─── Main Export ───────────────────────────────────────────────────────────────

/**
 * Validates and converts an array of raw CSV rows into typed ValidatedCsvRow objects.
 *
 * Rules enforced:
 * - Required string fields must be non-empty
 * - Email must be valid
 * - All salary fields must be non-negative numbers
 * - Month must be 1–12; Year must be 2000–2100
 * - All rows must share the same month/year
 * - Duplicate employee IDs within the file are rejected
 * - Net salary cannot be negative
 */
export function validateAndProcessCsvRows(rows: RawCsvRow[]): CsvValidationResult {
  const valid: ValidatedCsvRow[] = [];
  const errors: CsvRowError[] = [];
  const seenIds = new Set<string>();

  let detectedMonth: number | null = null;
  let detectedYear: number | null = null;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +1 for header, +1 for 1-indexing
    const rowErrors: string[] = [];

    // ─ Basic string/email validation via Zod ─────────────────────────────────
    const zodResult = csvRowSchema.safeParse(row);
    if (!zodResult.success) {
      zodResult.error.issues.forEach((issue) => rowErrors.push(issue.message));
    }

    const employeeId = (row.employee_id ?? "").trim() || `Row ${rowNum}`;

    // ─ Duplicate employee ID check ───────────────────────────────────────────
    if (seenIds.has(employeeId)) {
      rowErrors.push(`Duplicate Employee ID: "${employeeId}"`);
    } else {
      seenIds.add(employeeId);
    }

    // ─ Numeric field validation ───────────────────────────────────────────────
    const baseSalaryResult = parsePositiveFloat(row.base_salary, "Base salary");
    const hraResult = parsePositiveFloat(row.hra, "HRA");
    const allowancesResult = parsePositiveFloat(row.allowances, "Allowances");
    const deductionsResult = parsePositiveFloat(row.deductions, "Deductions");

    if (baseSalaryResult.error) rowErrors.push(baseSalaryResult.error);
    if (hraResult.error) rowErrors.push(hraResult.error);
    if (allowancesResult.error) rowErrors.push(allowancesResult.error);
    if (deductionsResult.error) rowErrors.push(deductionsResult.error);

    // ─ Month / year validation ────────────────────────────────────────────────
    const monthResult = parseIntInRange(row.month, "Month", 1, 12);
    const yearResult = parseIntInRange(row.year, "Year", 2000, 2100);

    if (monthResult.error) rowErrors.push(monthResult.error);
    if (yearResult.error) rowErrors.push(yearResult.error);

    // ─ Month/year consistency across all rows ─────────────────────────────────
    if (!monthResult.error && !yearResult.error) {
      if (detectedMonth === null) {
        detectedMonth = monthResult.value;
        detectedYear = yearResult.value;
      } else if (monthResult.value !== detectedMonth || yearResult.value !== detectedYear) {
        rowErrors.push(
          `Month/year mismatch: expected ${detectedMonth}/${detectedYear} but got ${monthResult.value}/${yearResult.value}`
        );
      }
    }

    if (rowErrors.length > 0) {
      errors.push({ row: rowNum, employeeId, errors: rowErrors });
      continue;
    }

    // ─ Salary calculation ─────────────────────────────────────────────────────
    const grossSalary = roundCurrency(
      baseSalaryResult.value + hraResult.value + allowancesResult.value
    );
    const netSalary = roundCurrency(grossSalary - deductionsResult.value);

    if (netSalary < 0) {
      errors.push({
        row: rowNum,
        employeeId,
        errors: [
          `Net salary is negative (₹${netSalary.toFixed(2)}). Deductions exceed gross salary.`,
        ],
      });
      continue;
    }

    valid.push({
      employeeCode: employeeId,
      name: (row.name ?? "").trim(),
      email: (row.email ?? "").trim().toLowerCase(),
      designation: (row.designation ?? "").trim(),
      baseSalary: baseSalaryResult.value,
      hra: hraResult.value,
      allowances: allowancesResult.value,
      deductions: deductionsResult.value,
      grossSalary,
      netSalary,
      month: detectedMonth!,
      year: detectedYear!,
    });
  }

  return {
    valid,
    errors,
    month: detectedMonth ?? 1,
    year: detectedYear ?? new Date().getFullYear(),
  };
}
