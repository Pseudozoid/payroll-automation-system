import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const slip = await prisma.salarySlip.findUnique({
      where: { id },
      include: {
        record: {
          select: {
            employeeCode: true,
            name: true,
            month: true,
            year: true,
          },
        },
      },
    });

    if (!slip) {
      return NextResponse.json({ error: "Salary slip not found." }, { status: 404 });
    }

    if (!slip.pdfBase64) {
      return NextResponse.json(
        { error: "PDF has not been generated for this slip yet." },
        { status: 404 }
      );
    }

    const pdfBuffer = Buffer.from(slip.pdfBase64, "base64");
    const { employeeCode, month, year } = slip.record;
    const fileName = `salary-slip-${employeeCode}-${month}-${year}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": pdfBuffer.byteLength.toString(),
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
