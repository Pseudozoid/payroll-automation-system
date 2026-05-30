import { prisma } from "@/lib/prisma";
import { BatchSwitcher } from "@/components/dashboard/batch-switcher";
import type { DashboardUploadDetail, DashboardUploadSummary } from "@/components/dashboard/batch-switcher";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

type DashboardPageProps = {
  searchParams?: { uploadId?: string | string[] } | Promise<{ uploadId?: string | string[] }>;
};

type DashboardUploadEmailLog = {
  id: string;
  status: string;
  sentAt: Date | null;
  errorMsg: string | null;
  createdAt: Date;
};

type DashboardUploadRecord = {
  id: string;
  employeeCode: string;
  name: string;
  month: number;
  year: number;
  salarySlip: {
    id: string;
    status: string;
    emailLogs: DashboardUploadEmailLog[];
  } | null;
};

type DashboardUploadDetailRow = {
  id: string;
  fileName: string;
  month: number;
  year: number;
  status: string;
  createdAt: Date;
  _count: { records: number };
  records: DashboardUploadRecord[];
};

type DashboardUploadSummaryRow = {
  id: string;
  fileName: string;
  month: number;
  year: number;
  status: string;
  createdAt: Date;
  _count: { records: number };
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {});
  const selectedUploadId = Array.isArray(resolvedSearchParams.uploadId)
    ? resolvedSearchParams.uploadId[0]
    : resolvedSearchParams.uploadId;

  // Fetch the selected upload in full so the dashboard can switch between batches client-side.
  let latestUpload: DashboardUploadDetailRow | null = null;
  let recentUploads: DashboardUploadSummaryRow[] = [];

  try {
    const uploadSelect = {
      id: true,
      fileName: true,
      month: true,
      year: true,
      status: true,
      createdAt: true,
      _count: { select: { records: true } },
      records: {
        orderBy: { employeeCode: "asc" },
        select: {
          id: true,
          employeeCode: true,
          name: true,
          month: true,
          year: true,
          salarySlip: {
            select: {
              id: true,
              status: true,
              emailLogs: {
                orderBy: { createdAt: "desc" },
                take: 1,
                select: {
                  id: true,
                  status: true,
                  sentAt: true,
                  errorMsg: true,
                  createdAt: true,
                },
              },
            },
          },
        },
      },
    } as const;

    if (selectedUploadId) {
      latestUpload = await prisma.payrollUpload.findUnique({
        where: { id: selectedUploadId },
        select: uploadSelect,
      });
    }

    if (!latestUpload) {
      latestUpload = await prisma.payrollUpload.findFirst({
        orderBy: { createdAt: "desc" },
        select: uploadSelect,
      });
    }

    // Recent uploads snapshot
    recentUploads = await prisma.payrollUpload.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        fileName: true,
        month: true,
        year: true,
        status: true,
        createdAt: true,
        _count: { select: { records: true } },
      },
    });

  } catch (err) {
    console.error("[Dashboard] Failed to load stats:", err);
  }

  const initialUpload = latestUpload ? (JSON.parse(JSON.stringify(latestUpload)) as DashboardUploadDetail) : null;
  const recentUploadSummaries = JSON.parse(JSON.stringify(recentUploads)) as DashboardUploadSummary[];

  return (
    <BatchSwitcher initialUpload={initialUpload} recentUploads={recentUploadSummaries} />
  );
}
