import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleApiError, AppError } from "@/lib/api-error";
import { generateSalarySlipPdf } from "@/lib/pdf";
import { parsePdfSettings } from "@/lib/pdf-settings";

const schema = z.object({
  uploadId: z.string().min(1),
  settings: z.unknown().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { uploadId, settings } = schema.parse(body);
    const pdfSettings = parsePdfSettings(settings);

    const upload = await prisma.payrollUpload.findUnique({
      where: { id: uploadId },
      include: { records: true },
    });

    if (!upload) throw new AppError("Payroll upload not found.", 404);
    if (upload.records.length === 0) {
      throw new AppError("This upload has no records.", 400);
    }

    const companyName = pdfSettings.companyName ?? process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Company";
    const companyAddress = pdfSettings.companyAddress ?? process.env.COMPANY_ADDRESS ?? undefined;

    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const record of upload.records) {
      try {
        // If slip already exists, regenerate its PDF
        const existing = await prisma.salarySlip.findUnique({
          where: { recordId: record.id },
        });

        const pdfBytes = await generateSalarySlipPdf({
          companyName,
          companyAddress,
          employeeCode: record.employeeCode,
          name: record.name,
          email: record.email,
          designation: record.designation,
          month: record.month,
          year: record.year,
          baseSalary: record.baseSalary,
          hra: record.hra,
          allowances: record.allowances,
          deductions: record.deductions,
          grossSalary: record.grossSalary,
          netSalary: record.netSalary,
        }, pdfSettings);

        const pdfBase64 = Buffer.from(pdfBytes).toString("base64");

        if (existing) {
          await prisma.salarySlip.update({
            where: { id: existing.id },
            data: { pdfBase64, status: "GENERATED" },
          });
        } else {
          await prisma.salarySlip.create({
            data: { recordId: record.id, pdfBase64, status: "GENERATED" },
          });
        }

        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push(`${record.employeeCode}: ${(err as Error).message}`);
      }
    }

    return NextResponse.json(results);
  } catch (err) {
    return handleApiError(err);
  }
}
