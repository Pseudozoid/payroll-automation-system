/**
 * Salary slip PDF generator using pdf-lib.
 * Produces a professional A4 slip with company header, employee details,
 * salary breakdown table, net salary highlight, and a footer.
 *
 * Uses only built-in Helvetica fonts — no external font loading needed.
 */

import { PDFDocument, PDFPage, PDFFont, rgb, StandardFonts } from "pdf-lib";
import { formatMonth, formatDate } from "./utils";
import { DEFAULT_PDF_SETTINGS, type PdfSettings } from "./pdf-settings";

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

export type SalarySlipPdfOptions = PdfSettings;

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

const PDF_INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const PAGE = {
  outerMargin: 48,
  sectionGap: 14,
  blockGap: 12,
  rowHeight: 28,
};

function formatInrForPdf(amount: number): string {
  // Standard Helvetica/WinAnsi in pdf-lib cannot encode the rupee symbol.
  // Keep PDF text ASCII-safe to avoid runtime encoding errors.
  return `INR ${PDF_INR_FORMATTER.format(amount)}`;
}

function drawWrappedText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  options: {
    size: number;
    font: PDFFont;
    color: RGBColor;
    maxWidth: number;
    lineHeight?: number;
  }
): void {
  page.drawText(text, {
    x,
    y,
    size: options.size,
    font: options.font,
    color: options.color,
    maxWidth: options.maxWidth,
    lineHeight: options.lineHeight ?? options.size + 3,
  });
}

function drawSectionHeading(
  page: PDFPage,
  x: number,
  y: number,
  title: string,
  subtitle: string,
  bold: PDFFont,
  regular: PDFFont,
  accentColor: RGBColor = C.primary
): number {
  page.drawRectangle({ x, y: y + 1, width: 18, height: 3, color: accentColor });
  page.drawText(title, {
    x: x + 24,
    y,
    size: 9,
    font: bold,
    color: C.dark,
  });
  page.drawText(subtitle, {
    x: x + 24,
    y: y - 11,
    size: 7.25,
    font: regular,
    color: C.gray,
  });
  return y - 24;
}

// ─── Helper functions ───────────────────────────────────────────────────────────

function drawLabelValue(
  page: PDFPage,
  regular: PDFFont,
  bold: PDFFont,
  x: number,
  y: number,
  label: string,
  value: string,
  maxWidth: number
): void {
  page.drawText(label.toUpperCase(), {
    x, y: y + 12, size: 6.8, font: regular, color: C.gray,
  });
  drawWrappedText(page, value || "—", x, y - 2, {
    size: 9.7,
    font: bold,
    color: C.dark,
    maxWidth,
    lineHeight: 10.8,
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
    thickness: 0.4,
    color: C.border,
  });
  page.drawText(label, {
    x: x + 14, y: y - rowHeight + 9, size: 8.8, font: labelFont, color: labelColor,
  });
  const valW = valueFont.widthOfTextAtSize(value, 9);
  page.drawText(value, {
    x: x + width - 14 - valW, y: y - rowHeight + 9, size: 8.8, font: valueFont, color: valueColor,
  });
}

// ─── Main export ────────────────────────────────────────────────────────────────

export async function generateSalarySlipPdf(
  data: SalarySlipPdfData,
  settings: PdfSettings = DEFAULT_PDF_SETTINGS
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const pageSize = settings.pageSize === "Letter" ? [612, 792] : [595.28, 841.89];
  const page = doc.addPage(pageSize as [number, number]);
  const { width, height } = page.getSize();

  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold    = await doc.embedFont(StandardFonts.HelveticaBold);

  const margin = settings.margin;
  const cw = width - margin * 2;
  const contentLeft = margin;
  const contentRight = margin + cw;
  const rowH = PAGE.rowHeight;
  const sectionGap = 18;
  const footerY = 48;
  const footerTextSize = 7;
  const headerH = 92;
  const detailsCardH = 92;
  const earningsCardH = 146;
  const deductionsCardH = 76;
  const netBoxH = 88;
  let y = height - margin;

  // ── HEADER ──────────────────────────────────────────────────────────────────
  const headerBottom = y - headerH;
  page.drawRectangle({
    x: contentLeft,
    y: headerBottom,
    width: cw,
    height: headerH,
    color: C.grayLight,
    borderColor: C.border,
    borderWidth: 1,
  });
  page.drawRectangle({ x: contentLeft, y: y - 4, width: cw, height: 4, color: C.primary });

  const headerPad = 16;
  const leftX = contentLeft + headerPad;
  const leftMaxWidth = cw * 0.54;
  const rightWidth = cw * 0.34;
  const rightX = contentRight - headerPad - rightWidth;

  drawWrappedText(page, data.companyName, leftX, y - 28, {
    size: 19,
    font: bold,
    color: C.dark,
    maxWidth: leftMaxWidth,
    lineHeight: 20,
  });

  if (settings.showCompanyAddress && data.companyAddress) {
    drawWrappedText(page, data.companyAddress, leftX, y - 50, {
      size: 8.3,
      font: regular,
      color: C.gray,
      maxWidth: leftMaxWidth,
      lineHeight: 11,
    });
  }

  page.drawText("PAYROLL DOCUMENT", {
    x: leftX,
    y: headerBottom + 18,
    size: 7.5,
    font: regular,
    color: C.gray,
  });

  page.drawText("SALARY SLIP", {
    x: rightX,
    y: y - 26,
    size: 22,
    font: bold,
    color: C.dark,
  });

  const period = formatMonth(data.month, data.year);
  const pillW = Math.max(102, bold.widthOfTextAtSize(period, 11) + 22);
  const pillX = contentRight - headerPad - pillW;
  const pillY = headerBottom + 18;
  page.drawRectangle({
    x: pillX,
    y: pillY,
    width: pillW,
    height: 24,
    color: C.primaryLight,
    borderColor: C.border,
    borderWidth: 0.6,
  });
  page.drawText(period, {
    x: pillX + 11,
    y: pillY + 8,
    size: 10.5,
    font: bold,
    color: C.primary,
  });
  page.drawText("Pay period", {
    x: pillX,
    y: pillY + 29,
    size: 7.2,
    font: regular,
    color: C.gray,
  });

  y = headerBottom - sectionGap;

  // ── EMPLOYEE DETAILS ────────────────────────────────────────────────────────
  const detailsTitleY = y;
  y = drawSectionHeading(page, contentLeft, detailsTitleY, "Employee details", "Employee identity and contact information", bold, regular, C.primary);
  const detailsCardY = y - detailsCardH + 6;
  page.drawRectangle({
    x: contentLeft,
    y: detailsCardY,
    width: cw,
    height: detailsCardH,
    color: C.white,
    borderColor: C.border,
    borderWidth: 0.8,
  });
  page.drawRectangle({ x: contentLeft, y: detailsCardY + detailsCardH - 4, width: cw, height: 4, color: C.primaryLight });

  const halfW = cw / 2;
  const cellPadX = 16;
  const cellW = halfW - cellPadX * 2;
  const leftCellX = contentLeft + cellPadX;
  const rightCellX = contentLeft + halfW + cellPadX;
  const topRowY = detailsCardY + 57;
  const bottomRowY = detailsCardY + 22;
  const rowDividerY = detailsCardY + 34;

  page.drawLine({
    start: { x: contentLeft + halfW, y: detailsCardY + 8 },
    end: { x: contentLeft + halfW, y: detailsCardY + detailsCardH - 8 },
    thickness: 0.5,
    color: C.border,
  });
  page.drawLine({
    start: { x: contentLeft + 12, y: rowDividerY },
    end: { x: contentRight - 12, y: rowDividerY },
    thickness: 0.45,
    color: C.border,
  });

  drawLabelValue(page, regular, bold, leftCellX, topRowY, "Employee ID", data.employeeCode, cellW);
  drawLabelValue(page, regular, bold, rightCellX, topRowY, "Employee Name", data.name, cellW);
  drawLabelValue(page, regular, bold, leftCellX, bottomRowY, "Designation", data.designation, cellW);
  drawLabelValue(page, regular, bold, rightCellX, bottomRowY, "Email Address", data.email, cellW);

  y = detailsCardY - 18;

  // ── EARNINGS ────────────────────────────────────────────────────────────────
  y = drawSectionHeading(page, contentLeft, y, "Earnings", "Earnings breakdown for the current pay period", bold, regular, C.primary);
  const earningRows: [string, number][] = [
    ["Basic Salary", data.baseSalary],
    ["House Rent Allowance (HRA)", data.hra],
    ["Other Allowances", data.allowances],
  ];
  const earningsCardY = y - earningsCardH + 6;
  page.drawRectangle({
    x: contentLeft,
    y: earningsCardY,
    width: cw,
    height: earningsCardH,
    color: C.white,
    borderColor: C.border,
    borderWidth: 0.8,
  });

  const tableHeaderH = 26;
  page.drawRectangle({
    x: contentLeft,
    y: earningsCardY + earningsCardH - tableHeaderH,
    width: cw,
    height: tableHeaderH,
    color: C.dark,
  });
  page.drawText("Description", {
    x: contentLeft + 14,
    y: earningsCardY + earningsCardH - 18,
    size: 8.5,
    font: bold,
    color: C.white,
  });
  page.drawText("Amount", {
    x: contentRight - 14 - bold.widthOfTextAtSize("Amount", 8.5),
    y: earningsCardY + earningsCardH - 18,
    size: 8.5,
    font: bold,
    color: C.white,
  });

  let tableY = earningsCardY + earningsCardH - tableHeaderH;
  earningRows.forEach(([label, amount], idx) => {
    drawTableRow(
      page,
      regular,
      bold,
      contentLeft,
      tableY,
      cw,
      rowH,
      label,
      formatInrForPdf(amount),
      idx % 2 === 0 ? C.white : C.grayLight
    );
    tableY -= rowH;
  });

  drawTableRow(
    page,
    regular,
    bold,
    contentLeft,
    tableY,
    cw,
    rowH,
    "Gross Salary",
    formatInrForPdf(data.grossSalary),
    C.primaryLight,
    bold,
    bold,
    C.primary,
    C.primary
  );

  y = earningsCardY - sectionGap;

  // ── DEDUCTIONS ──────────────────────────────────────────────────────────────
  y = drawSectionHeading(page, contentLeft, y, "Deductions", "Statutory and other deductions applied this month", bold, regular, C.danger);
  const deductionsCardY = y - deductionsCardH + 6;
  page.drawRectangle({
    x: contentLeft,
    y: deductionsCardY,
    width: cw,
    height: deductionsCardH,
    color: C.white,
    borderColor: C.border,
    borderWidth: 0.8,
  });

  page.drawRectangle({
    x: contentLeft,
    y: deductionsCardY + deductionsCardH - tableHeaderH,
    width: cw,
    height: tableHeaderH,
    color: C.dark,
  });
  page.drawText("Description", {
    x: contentLeft + 14,
    y: deductionsCardY + deductionsCardH - 18,
    size: 8.5,
    font: bold,
    color: C.white,
  });
  page.drawText("Amount", {
    x: contentRight - 14 - bold.widthOfTextAtSize("Amount", 8.5),
    y: deductionsCardY + deductionsCardH - 18,
    size: 8.5,
    font: bold,
    color: C.white,
  });

  drawTableRow(
    page,
    regular,
    bold,
    contentLeft,
    deductionsCardY + deductionsCardH - tableHeaderH,
    cw,
    rowH,
    "Total Deductions",
    formatInrForPdf(data.deductions),
    C.white,
    bold,
    bold,
    C.dark,
    C.dark
  );

  y = deductionsCardY - sectionGap;

  // ── NET SALARY ───────────────────────────────────────────────────────────────
  const netBoxY = y - netBoxH + 4;
  page.drawRectangle({
    x: contentLeft,
    y: netBoxY,
    width: cw,
    height: netBoxH,
    color: C.successLight,
    borderColor: C.successBorder,
    borderWidth: 1,
  });
  page.drawRectangle({ x: contentLeft, y: netBoxY, width: 6, height: netBoxH, color: C.success });

  page.drawText("NET SALARY", {
    x: contentLeft + 18,
    y: netBoxY + netBoxH - 24,
    size: 8,
    font: bold,
    color: C.gray,
  });
  page.drawText("Take-home pay", {
    x: contentLeft + 18,
    y: netBoxY + netBoxH - 38,
    size: 7.2,
    font: regular,
    color: C.gray,
  });
  page.drawText(formatInrForPdf(data.netSalary), {
    x: contentLeft + 18,
    y: netBoxY + 24,
    size: 26,
    font: bold,
    color: C.success,
  });

  const takeHomeNote = `For the pay period: ${formatMonth(data.month, data.year)}`;
  const noteW = regular.widthOfTextAtSize(takeHomeNote, 8.3);
  page.drawText(takeHomeNote, {
    x: contentRight - 18 - noteW,
    y: netBoxY + 28,
    size: 8.3,
    font: regular,
    color: C.gray,
  });

  // ── FOOTER ───────────────────────────────────────────────────────────────────
  page.drawLine({
    start: { x: contentLeft, y: footerY + 14 },
    end: { x: contentRight, y: footerY + 14 },
    thickness: 0.5,
    color: C.border,
  });

  if (settings.showFooterNote) {
    const footerText =
      `Generated on ${formatDate(new Date())}  ·  This document is computer-generated and does not require a signature.`;
    page.drawText(footerText, {
      x: contentLeft,
      y: footerY,
      size: footerTextSize,
      font: regular,
      color: C.gray,
    });
  }

  return doc.save();
}
