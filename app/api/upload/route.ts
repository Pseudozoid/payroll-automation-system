import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";

const recordSchema = z.object({
  employeeCode: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  designation: z.string().min(1),
  baseSalary: z.number().nonnegative(),
  hra: z.number().nonnegative(),
  allowances: z.number().nonnegative(),
  deductions: z.number().nonnegative(),
  grossSalary: z.number(),
  netSalary: z.number(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
});

const uploadSchema = z.object({
  fileName: z.string().min(1),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  records: z.array(recordSchema).min(1, "At least one valid record is required."),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = uploadSchema.parse(body);

    const upload = await prisma.payrollUpload.create({
      data: {
        fileName: data.fileName,
        month: data.month,
        year: data.year,
        totalRows: data.records.length,
        validRows: data.records.length,
        status: "DONE",
        records: {
          create: data.records.map((r) => ({
            employeeCode: r.employeeCode,
            name: r.name,
            email: r.email,
            designation: r.designation,
            month: r.month,
            year: r.year,
            baseSalary: r.baseSalary,
            hra: r.hra,
            allowances: r.allowances,
            deductions: r.deductions,
            grossSalary: r.grossSalary,
            netSalary: r.netSalary,
          })),
        },
      },
    });

    return NextResponse.json({ id: upload.id }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
