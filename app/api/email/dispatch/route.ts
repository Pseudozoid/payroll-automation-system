import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleApiError, AppError } from "@/lib/api-error";
import { sendSlipEmail } from "@/lib/email";
import { formatMonth } from "@/lib/utils";

const schema = z.object({ uploadId: z.string().min(1), retryFailedOnly: z.boolean().optional() });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { uploadId, retryFailedOnly } = schema.parse(body);

    // Fetch all records for the upload, including their salary slips and latest email log
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

    const results = { sent: 0, failed: 0, skipped: 0, errors: [] as string[] };

    for (const record of records) {
      const slip = record.salarySlip;

      // Skip if no PDF has been generated
      if (!slip || !slip.pdfBase64) {
        results.skipped++;
        continue;
      }

      // If caller requested retrying only failed deliveries, skip records whose latest log isn't FAILED
      if (retryFailedOnly) {
        const latestLog = slip.emailLogs?.[0];
        if (!latestLog || latestLog.status !== "FAILED") {
          // nothing to retry for this record
          results.skipped++;
          continue;
        }
      }

      const pdfFileName = `salary-slip-${record.employeeCode}-${record.month}-${record.year}.pdf`;

      try {
        await sendSlipEmail({
          to: record.email,
          name: record.name,
          month: record.month,
          year: record.year,
          netSalary: record.netSalary,
          pdfBase64: slip.pdfBase64,
          pdfFileName,
        });

        // Log success
        await prisma.emailLog.create({
          data: {
            slipId: slip.id,
            sentTo: record.email,
            status: "SENT",
            sentAt: new Date(),
          },
        });

        // Update slip status
        await prisma.salarySlip.update({
          where: { id: slip.id },
          data: { status: "EMAILED" },
        });

        results.sent++;
      } catch (err) {
        // Log failure — never crash the whole batch
        const errMsg = (err as Error).message;

        await prisma.emailLog.create({
          data: {
            slipId: slip.id,
            sentTo: record.email,
            status: "FAILED",
            errorMsg: errMsg.slice(0, 500), // Truncate to fit DB column
          },
        });

        results.failed++;
        results.errors.push(`${record.employeeCode} (${record.email}): ${errMsg}`);
      }
    }

    return NextResponse.json(results);
  } catch (err) {
    return handleApiError(err);
  }
}
