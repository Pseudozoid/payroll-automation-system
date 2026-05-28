import Papa from "papaparse";
import * as XLSX from "xlsx";

import type { RawCsvRow } from "@/types";

export type PayrollFileFormat = "csv" | "excel";

export interface ParsedPayrollFile {
  fileName: string;
  format: PayrollFileFormat;
  headers: string[];
  rows: RawCsvRow[];
}

const EXCEL_EXTENSIONS = [".xlsx", ".xls"] as const;

function normalizeHeader(header: string) {
  return header.trim().toLowerCase().replace(/\s+/g, "_");
}

function getFileExtension(fileName: string) {
  const match = fileName.toLowerCase().match(/\.[^.]+$/);
  return match?.[0] ?? "";
}

function toCellText(value: unknown) {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value).trim();
}

function parseCsvText(fileName: string, text: string): Promise<ParsedPayrollFile> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawCsvRow>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: normalizeHeader,
      complete: (result) => {
        resolve({
          fileName,
          format: "csv",
          headers: result.meta.fields ?? [],
          rows: result.data,
        });
      },
      error: (err: { message: string }) => {
        reject(new Error(`Could not parse the CSV: ${err.message}`));
      },
    });
  });
}

function parseExcelBuffer(fileName: string, buffer: ArrayBuffer): ParsedPayrollFile {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("The Excel file does not contain any sheets.");
  }

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error("The Excel file could not be read.");
  }

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: false,
    defval: "",
    raw: false,
  });

  if (matrix.length === 0) {
    return {
      fileName,
      format: "excel",
      headers: [],
      rows: [],
    };
  }

  const [headerRow = [], ...dataRows] = matrix;
  const headers = headerRow.map((header) => normalizeHeader(String(header ?? "")));

  const rows = dataRows
    .filter((row) => row.some((cell) => String(cell ?? "").trim() !== ""))
    .map((row) => {
      const normalizedRow: RawCsvRow = {};

      headers.forEach((header, index) => {
        normalizedRow[header] = toCellText(row[index]);
      });

      return normalizedRow;
    });

  return {
    fileName,
    format: "excel",
    headers,
    rows,
  };
}

export function isSupportedPayrollFile(fileName: string) {
  const extension = getFileExtension(fileName);
  return extension === ".csv" || EXCEL_EXTENSIONS.includes(extension as (typeof EXCEL_EXTENSIONS)[number]);
}

export function getPayrollFileTypeLabel(fileName: string) {
  const extension = getFileExtension(fileName);
  if (extension === ".csv") return "CSV";
  if (EXCEL_EXTENSIONS.includes(extension as (typeof EXCEL_EXTENSIONS)[number])) return "Excel";
  return "file";
}

export async function parsePayrollFile(file: File): Promise<ParsedPayrollFile> {
  const extension = getFileExtension(file.name);

  if (extension === ".csv") {
    return parseCsvText(file.name, await file.text());
  }

  if (EXCEL_EXTENSIONS.includes(extension as (typeof EXCEL_EXTENSIONS)[number])) {
    return parseExcelBuffer(file.name, await file.arrayBuffer());
  }

  throw new Error("Only CSV, .xlsx, and .xls files are supported.");
}