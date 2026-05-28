/**
 * Salary slip PDF generator using pdf-lib.
 * Produces a professional A4 slip with company header, employee details,
 * salary breakdown table, net salary highlight, and a footer.
 *
 * Uses only built-in Helvetica fonts — no external font loading needed.
 */

import { PDFDocument, PDFPage, PDFFont, rgb, StandardFonts } from "pdf-lib";
import { formatINR, formatMonth, formatDate } from "./utils";

type RGBColor = ReturnType<typeof rgb>;

export interface SalarySlipPdfData {
  companyName: string;
  companyAddress?: string;
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
}

// ─── Color palette ──────────────────────────────────────────────────────────────

const C = {
  primary:      rgb(0.388, 0.400, 0.945), // indigo-500
  primaryLight: rgb(0.940, 0.941, 0.992), // indigo-50
  white:        rgb(1.000, 1.000, 1.000),
  dark:         rgb(0.059, 0.090, 0.165), // slate-900
  gray:         rgb(0.392, 0.455, 0.529), // slate-500
  grayLight:    rgb(0.961, 0.969, 0.980), // slate-100
  border:       rgb(0.882, 0.906, 0.929), // slate-200
  success:      rgb(0.022, 0.733, 0.510), // emerald-500
  successLight: rgb(0.940, 0.996, 0.973), // emerald-50
  successBorder:rgb(0.600, 0.957, 0.784), // emerald-200
  danger:       rgb(0.694, 0.153, 0.153), // red-700 (deductions header)
};

// ─── Helper functions ───────────────────────────────────────────────────────────

function drawLabelValue(
  page: PDFPage,
  regular: PDFFont,
  bold: PDFFont,
  x: number,
  y: number,
  label: string,
  value: string
): void {
  page.drawText(label.toUpperCase(), {
    x, y: y + 12, size: 7, font: regular, color: C.gray,
  });
  page.drawText(value || "—", {
    x, y, size: 10, font: bold, color: C.dark,
  });
}

function drawTableRow(
  page: PDFPage,
  regular: PDFFont,
  bold: PDFFont,
  x: number,
  y: number,
  width: number,
  rowHeight: number,
  label: string,
  value: string,
  bgColor: RGBColor,
  labelFont: PDFFont = regular,
  valueFont: PDFFont = regular,
  labelColor: RGBColor = C.dark,
  valueColor: RGBColor = C.dark
): void {
  page.drawRectangle({ x, y: y - rowHeight, width, height: rowHeight, color: bgColor });
  page.drawLine({
    start: { x, y: y - rowHeight },
    end: { x: x + width, y: y - rowHeight },
    thickness: 0.5,
    color: C.border,
  });
  page.drawText(label, {
    x: x + 12, y: y - rowHeight + 8, size: 9, font: labelFont, color: labelColor,
  });
  const valW = valueFont.widthOfTextAtSize(value, 9);
  page.drawText(value, {
    x: x + width - 14 - valW, y: y - rowHeight + 8, size: 9, font: valueFont, color: valueColor,
  });
}

// ─── Main export ────────────────────────────────────────────────────────────────

export async function generateSalarySlipPdf(data: SalarySlipPdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold    = await doc.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  const cw = width - margin * 2; // content width
  const rowH = 24;

  // ── HEADER ──────────────────────────────────────────────────────────────────
  const headerH = 88;
  page.drawRectangle({ x: 0, y: height - headerH, width, height: headerH, color: C.primary });

  page.drawText(data.companyName, {
    x: margin, y: height - 36, size: 18, font: bold, color: C.white,
  });

  if (data.companyAddress) {
    page.drawText(data.companyAddress, {
      x: margin, y: height - 54, size: 8.5, font: regular, color: rgb(0.76, 0.78, 0.98),
    });
  }

  page.drawText("SALARY SLIP", {
    x: margin, y: height - 72, size: 8, font: bold,
    color: rgb(0.76, 0.78, 0.98),
  });

  // Period label (right-aligned)
  const period = formatMonth(data.month, data.year);
  const periodW = bold.widthOfTextAtSize(period, 14);
  page.drawText(period, {
    x: width - margin - periodW, y: height - 38, size: 14, font: bold, color: C.white,
  });
  page.drawText("Pay Period", {
    x: width - margin - bold.widthOfTextAtSize("Pay Period", 8), y: height - 56,
    size: 8, font: regular, color: rgb(0.76, 0.78, 0.98),
  });

  let y = height - headerH - 18;

  // ── EMPLOYEE DETAILS ────────────────────────────────────────────────────────
  const infoH = 82;
  page.drawRectangle({ x: margin, y: y - infoH, width: cw, height: infoH, color: C.grayLight });
  page.drawRectangle({ x: margin, y: y - infoH, width: 4, height: infoH, color: C.primary });

  page.drawText("EMPLOYEE DETAILS", {
    x: margin + 16, y: y - 16, size: 7.5, font: bold, color: C.gray,
  });

  const col2 = margin + cw / 2;
  drawLabelValue(page, regular, bold, margin + 16, y - 40, "Employee ID", data.employeeCode);
  drawLabelValue(page, regular, bold, margin + 16, y - 65, "Designation", data.designation);
  drawLabelValue(page, regular, bold, col2, y - 40, "Employee Name", data.name);
  drawLabelValue(page, regular, bold, col2, y - 65, "Email Address", data.email);

  y -= infoH + 22;

  // ── EARNINGS TABLE ──────────────────────────────────────────────────────────
  page.drawText("EARNINGS", { x: margin, y, size: 7.5, font: bold, color: C.gray });
  y -= 14;

  // Table header
  page.drawRectangle({ x: margin, y: y - rowH, width: cw, height: rowH, color: C.primary });
  page.drawText("Description", { x: margin + 12, y: y - rowH + 8, size: 8.5, font: bold, color: C.white });
  page.drawText("Amount", {
    x: margin + cw - 14 - bold.widthOfTextAtSize("Amount", 8.5),
    y: y - rowH + 8, size: 8.5, font: bold, color: C.white,
  });
  y -= rowH;

  const earningRows: [string, number][] = [
    ["Basic Salary", data.baseSalary],
    ["House Rent Allowance (HRA)", data.hra],
    ["Other Allowances", data.allowances],
  ];

  earningRows.forEach(([label, amount], idx) => {
    drawTableRow(
      page, regular, bold, margin, y, cw, rowH,
      label, formatINR(amount),
      idx % 2 === 0 ? C.white : C.grayLight
    );
    y -= rowH;
  });

  // Gross row
  drawTableRow(
    page, regular, bold, margin, y, cw, rowH,
    "Gross Salary", formatINR(data.grossSalary),
    C.primaryLight, bold, bold, C.primary, C.primary
  );
  y -= rowH + 22;

  // ── DEDUCTIONS TABLE ─────────────────────────────────────────────────────────
  page.drawText("DEDUCTIONS", { x: margin, y, size: 7.5, font: bold, color: C.gray });
  y -= 14;

  page.drawRectangle({ x: margin, y: y - rowH, width: cw, height: rowH, color: C.danger });
  page.drawText("Description", { x: margin + 12, y: y - rowH + 8, size: 8.5, font: bold, color: C.white });
  page.drawText("Amount", {
    x: margin + cw - 14 - bold.widthOfTextAtSize("Amount", 8.5),
    y: y - rowH + 8, size: 8.5, font: bold, color: C.white,
  });
  y -= rowH;

  drawTableRow(
    page, regular, bold, margin, y, cw, rowH,
    "Total Deductions", formatINR(data.deductions),
    C.white
  );
  y -= rowH + 22;

  // ── NET SALARY ───────────────────────────────────────────────────────────────
  const netBoxH = 72;
  page.drawRectangle({
    x: margin, y: y - netBoxH, width: cw, height: netBoxH,
    color: C.successLight, borderColor: C.successBorder, borderWidth: 1,
  });
  page.drawRectangle({ x: margin, y: y - netBoxH, width: 4, height: netBoxH, color: C.success });

  page.drawText("NET SALARY — TAKE HOME", {
    x: margin + 18, y: y - 20, size: 7.5, font: bold, color: C.gray,
  });
  page.drawText(formatINR(data.netSalary), {
    x: margin + 18, y: y - 50, size: 24, font: bold, color: C.success,
  });

  const takeHomeNote = `For the pay period: ${formatMonth(data.month, data.year)}`;
  const noteW = regular.widthOfTextAtSize(takeHomeNote, 8.5);
  page.drawText(takeHomeNote, {
    x: margin + cw - 14 - noteW, y: y - 42, size: 8.5, font: regular, color: C.gray,
  });

  // ── FOOTER ───────────────────────────────────────────────────────────────────
  page.drawLine({
    start: { x: margin, y: 50 },
    end: { x: margin + cw, y: 50 },
    thickness: 0.5, color: C.border,
  });

  const footerText =
    `Generated on ${formatDate(new Date())}  ·  This is a computer-generated document. No signature is required.`;
  page.drawText(footerText, {
    x: margin, y: 35, size: 7, font: regular, color: C.gray,
  });

  return doc.save();
}
