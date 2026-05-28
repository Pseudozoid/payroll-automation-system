import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleApiError, AppError } from "@/lib/api-error";
import { sendSlipEmail } from "@/lib/email";
import { formatMonth } from "@/lib/utils";

const schema = z.object({ uploadId: z.string().min(1) });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { uploadId } = schema.parse(body);

    // Fetch all records for the upload, including their salary slips
    const records = await prisma.salaryRecord.findMany({
      where: { uploadId },
      include: { salarySlip: true },
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
