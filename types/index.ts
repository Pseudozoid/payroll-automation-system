// Shared TypeScript types across the application.
// These mirror Prisma models but are safe to use in both server and client code.

export type UploadStatus = "PENDING" | "PROCESSING" | "DONE" | "FAILED";
export type SlipStatus = "GENERATED" | "EMAILED" | "FAILED";
export type EmailStatus = "PENDING" | "SENT" | "FAILED";

export interface PayrollUpload {
  id: string;
  fileName: string;
  month: number;
  year: number;
  totalRows: number;
  validRows: number;
  status: UploadStatus;
  createdAt: Date | string;
  _count?: { records: number };
}

export interface SalaryRecord {
  id: string;
  uploadId: string;
  employeeCode: string;
  name: string;
  email: string;
  designation: string;
  month: number;
  year: number;
  baseSalary: number;
  hra: number;
  allowances: number;
  deductions: number;
  grossSalary: number;
  netSalary: number;
  createdAt: Date | string;
  salarySlip?: SalarySlip | null;
}

export interface SalarySlip {
  id: string;
  recordId: string;
  status: SlipStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
  emailLogs?: EmailLog[];
}

export interface EmailLog {
  id: string;
  slipId: string;
  sentTo: string;
  status: EmailStatus;
  errorMsg: string | null;
  sentAt: Date | string | null;
  createdAt: Date | string;
}

// ─── CSV Types ─────────────────────────────────────────────────────────────────

/** Raw row as parsed by PapaParse — all values are strings */
export interface RawCsvRow {
  employee_id?: string;
  name?: string;
  email?: string;
  designation?: string;
  base_salary?: string;
  hra?: string;
  allowances?: string;
  deductions?: string;
  month?: string;
  year?: string;
  [key: string]: string | undefined;
}

/** Validated and numerically-converted row ready for DB insertion */
export interface ValidatedCsvRow {
  employeeCode: string;
  name: string;
  email: string;
  designation: string;
  baseSalary: number;
  hra: number;
  allowances: number;
  deductions: number;
  grossSalary: number;
  netSalary: number;
  month: number;
  year: number;
}

/** A validation error for a specific CSV row */
export interface CsvRowError {
  row: number;
  employeeId: string;
  errors: string[];
}

/** Result of parsing + validating an entire CSV file */
export interface CsvValidationResult {
  valid: ValidatedCsvRow[];
  errors: CsvRowError[];
  month: number;
  year: number;
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalUploads: number;
  totalSlips: number;
  totalEmailsSent: number;
  recentUploads: PayrollUpload[];
}

// ─── API Responses ─────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  issues?: { path: string; message: string }[];
}

export interface GenerateResult {
  success: number;
  failed: number;
  errors: string[];
}

export interface DispatchResult {
  sent: number;
  failed: number;
  skipped: number;
  errors: string[];
}
