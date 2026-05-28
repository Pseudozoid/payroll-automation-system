import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";

export async function GET() {
  try {
    const uploads = await prisma.payrollUpload.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { records: true } } },
    });
    return NextResponse.json(uploads);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE() {
  try {
    const result = await prisma.payrollUpload.deleteMany();

    return NextResponse.json({ deleted: result.count });
  } catch (err) {
    return handleApiError(err);
  }
}
