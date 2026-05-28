import { prisma } from "@/lib/prisma";
import { BatchSwitcher } from "@/components/dashboard/batch-switcher";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams?: { uploadId?: string | string[] } | Promise<{ uploadId?: string | string[] }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {});
  const selectedUploadId = Array.isArray(resolvedSearchParams.uploadId)
    ? resolvedSearchParams.uploadId[0]
    : resolvedSearchParams.uploadId;

  // Fetch the selected upload in full so the dashboard can switch between batches client-side.
  let latestUpload = null as null | Awaited<ReturnType<typeof prisma.payrollUpload.findFirst>>;
  let recentUploads: Awaited<ReturnType<typeof prisma.payrollUpload.findMany>> = [];

  try {
    const uploadInclude = {
      _count: { select: { records: true } },
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
    };

    if (selectedUploadId) {
      latestUpload = await prisma.payrollUpload.findUnique({
        where: { id: selectedUploadId },
        include: uploadInclude,
      });
    }

    if (!latestUpload) {
      latestUpload = await prisma.payrollUpload.findFirst({
        orderBy: { createdAt: "desc" },
        include: uploadInclude,
      });
    }

    // Recent uploads snapshot
    recentUploads = await prisma.payrollUpload.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { _count: { select: { records: true } } },
    });

  } catch (err) {
    console.error("[Dashboard] Failed to load stats:", err);
  }

  const initialUpload = latestUpload ? JSON.parse(JSON.stringify(latestUpload)) : null;
  const recentUploadSummaries = JSON.parse(JSON.stringify(recentUploads));

  return (
    <BatchSwitcher initialUpload={initialUpload} recentUploads={recentUploadSummaries} />
  );
}
