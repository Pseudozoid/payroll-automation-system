/**
 * Email dispatch utilities using Nodemailer.
 * Sends personalised salary slip emails with a PDF attachment.
 * This module runs only on the server (Node.js runtime).
 */

import nodemailer from "nodemailer";
import { formatINR, formatMonth } from "./utils";

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP configuration is incomplete. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS."
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for port 465, false for 587
    auth: { user, pass },
    // Reasonable timeouts to avoid hanging on failed SMTP connections
    connectionTimeout: 10_000,
    greetingTimeout: 8_000,
    socketTimeout: 15_000,
  });
}

function buildHtmlBody(params: {
  companyName: string;
  companyAddress?: string;
  name: string;
  month: number;
  year: number;
  netSalary: number;
}): string {
  const { companyName, companyAddress, name, month, year, netSalary } = params;
  const monthLabel = formatMonth(month, year);
  const netFormatted = formatINR(netSalary);
  const addressHtml = companyAddress
    ? `<p style="margin:6px 0 0;color:rgba(255,255,255,0.72);font-size:13px;line-height:1.5;">${companyAddress}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Salary Slip — ${monthLabel}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

    <!-- Header -->
    <div style="background:#6366f1;padding:36px 44px;">
      <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">${companyName}</h1>
      ${addressHtml}
      <p style="margin:10px 0 0;color:rgba(255,255,255,0.72);font-size:13px;">Salary Slip &middot; ${monthLabel}</p>
    </div>

    <!-- Body -->
    <div style="padding:36px 44px;">
      <p style="margin:0 0 14px;color:#0f172a;font-size:15px;font-weight:600;">Dear ${name},</p>
      <p style="margin:0 0 26px;color:#475569;font-size:14px;line-height:1.75;">
        Please find attached your salary slip for <strong style="color:#0f172a;">${monthLabel}</strong>.
        Your net salary for this pay period is shown below.
      </p>

      <!-- Net Salary Callout -->
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:24px 28px;margin:0 0 28px;">
        <p style="margin:0;color:#475569;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">
          Net Salary — ${monthLabel}
        </p>
        <p style="margin:8px 0 0;color:#059669;font-size:28px;font-weight:700;letter-spacing:-0.5px;">${netFormatted}</p>
      </div>

      <p style="margin:0 0 10px;color:#94a3b8;font-size:13px;line-height:1.6;">
        Your detailed salary statement is attached as a PDF to this email.
      </p>
      <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;">
        If you have any questions about your salary, please contact the HR department.
      </p>
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid #e2e8f0;padding:20px 44px;background:#f8fafc;">
      <p style="margin:0;color:#cbd5e1;font-size:11px;">
        This is an automated message from ${companyName}. Please do not reply to this email.
      </p>
    </div>

  </div>
</body>
</html>`;
}

// ─── Public API ─────────────────────────────────────────────────────────────────

export interface SendSlipEmailParams {
  to: string;
  name: string;
  month: number;
  year: number;
  netSalary: number;
  companyName: string;
  companyAddress?: string;
  /** Base64-encoded PDF content */
  pdfBase64: string;
  pdfFileName: string;
}

/**
 * Sends a salary slip email with a PDF attachment.
 * Throws on SMTP failure — caller is responsible for catching and logging.
 */
export async function sendSlipEmail(params: SendSlipEmailParams): Promise<void> {
  const from = process.env.SMTP_FROM ?? `"${params.companyName}" <${process.env.SMTP_USER}>`;
  const monthLabel = formatMonth(params.month, params.year);

  const transporter = createTransporter();

  await transporter.sendMail({
    from,
    to: params.to,
    subject: `Your Salary Slip for ${monthLabel} — ${params.companyName}`,
    html: buildHtmlBody({
      companyName: params.companyName,
      companyAddress: params.companyAddress,
      name: params.name,
      month: params.month,
      year: params.year,
      netSalary: params.netSalary,
    }),
    attachments: [
      {
        filename: params.pdfFileName,
        content: params.pdfBase64,
        encoding: "base64",
        contentType: "application/pdf",
      },
    ],
  });
}
