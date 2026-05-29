import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleApiError, AppError } from "@/lib/api-error";
import { sendSlipEmail } from "@/lib/email";
import { getBrandingSettings } from "@/lib/branding";

const schema = z
  .object({
    uploadId: z.string().min(1).optional(),
    recordId: z.string().min(1).optional(),
    retryFailedOnly: z.boolean().optional(),
  })
  .refine((value) => value.uploadId || value.recordId, {
    message: "uploadId or recordId is required",
  });

async function dispatchEmailForRecord(
  record: {
    employeeCode: string;
    email: string;
    name: string;
    month: number;
    year: number;
    netSalary: number;
    salarySlip: { id: string; pdfBase64: string | null; emailLogs?: { status: string }[] } | null;
  },
  companyName: string,
  companyAddress: string | undefined,
  results: { sent: number; failed: number; skipped: number; errors: string[] }
) {
  const slip = record.salarySlip;

  if (!slip || !slip.pdfBase64) {
    results.skipped++;
    return;
  }

  const pdfFileName = `salary-slip-${record.employeeCode}-${record.month}-${record.year}.pdf`;

  try {
    await sendSlipEmail({
      to: record.email,
      name: record.name,
      employeeCode: record.employeeCode,
      month: record.month,
      year: record.year,
      netSalary: record.netSalary,
      companyName,
      companyAddress,
      pdfBase64: slip.pdfBase64,
      pdfFileName,
    });

    await prisma.emailLog.create({
      data: {
        slipId: slip.id,
        sentTo: record.email,
        status: "SENT",
        sentAt: new Date(),
      },
    });

    await prisma.salarySlip.update({
      where: { id: slip.id },
      data: { status: "EMAILED" },
    });

    results.sent++;
  } catch (err) {
    const errMsg = (err as Error).message;

    await prisma.emailLog.create({
      data: {
        slipId: slip.id,
        sentTo: record.email,
        status: "FAILED",
        errorMsg: errMsg.slice(0, 500),
      },
    });

    results.failed++;
    results.errors.push(`${record.employeeCode} (${record.email}): ${errMsg}`);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { uploadId, recordId, retryFailedOnly } = schema.parse(body);
    const brandingSettings = await getBrandingSettings();
    const companyName = brandingSettings.companyName;
    const companyAddress = brandingSettings.companyAddress;

    const results = { sent: 0, failed: 0, skipped: 0, errors: [] as string[] };

    if (recordId) {
      const record = await prisma.salaryRecord.findUnique({
        where: { id: recordId },
        include: {
          salarySlip: {
            include: {
              emailLogs: {
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
        },
      });

      if (!record) {
        throw new AppError("Payroll record not found.", 404);
      }

      if (uploadId && record.uploadId !== uploadId) {
        throw new AppError("Payroll record does not belong to the specified upload.", 400);
      }

      await dispatchEmailForRecord(record, companyName, companyAddress, results);
      return NextResponse.json(results);
    }

    const records = await prisma.salaryRecord.findMany({
      where: { uploadId },
      include: {
        salarySlip: {
          include: {
            emailLogs: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
      orderBy: { employeeCode: "asc" },
    });

    if (records.length === 0) {
      throw new AppError("No records found for this upload.", 404);
    }

    for (const record of records) {
      if (retryFailedOnly) {
        const latestLog = record.salarySlip?.emailLogs?.[0];
        if (!latestLog || latestLog.status !== "FAILED") {
          results.skipped++;
          continue;
        }
      }

      await dispatchEmailForRecord(record, companyName, companyAddress, results);
    }

    return NextResponse.json(results);
  } catch (err) {
    return handleApiError(err);
  }
}
