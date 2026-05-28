import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const upload = await prisma.payrollUpload.findUnique({
      where: { id },
      include: {
        records: {
          orderBy: { employeeCode: "asc" },
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
        },
      },
    });

    if (!upload) {
      return NextResponse.json({ error: "Upload not found." }, { status: 404 });
    }

    return NextResponse.json(upload);
  } catch (err) {
    return handleApiError(err);
  }
}
