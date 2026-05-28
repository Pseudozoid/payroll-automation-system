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
