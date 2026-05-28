import Link from "next/link";
import { FileUp, FileText, Mail, ArrowUpRight, Upload, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { UploadStatusBadge } from "@/components/shared/status-badge";
import { formatMonth, formatDateTime } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  description,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  description?: string;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-100 tracking-tight">
            {value.toLocaleString("en-IN")}
          </p>
          {description && (
            <p className="mt-1 text-xs text-slate-400">{description}</p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </Card>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  let totalUploads = 0;
  let totalSlips = 0;
  let totalEmailsSent = 0;
  let recentUploads: Awaited<ReturnType<typeof prisma.payrollUpload.findMany>> = [];

  try {
    [totalUploads, totalSlips, totalEmailsSent, recentUploads] = await Promise.all([
      prisma.payrollUpload.count(),
      prisma.salarySlip.count(),
      prisma.emailLog.count({ where: { status: "SENT" } }),
      prisma.payrollUpload.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { _count: { select: { records: true } } },
      }),
    ]);
  } catch (err) {
    console.error("[Dashboard] Failed to load stats:", err);
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Stats */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-4">
          Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Payroll Uploads"
            value={totalUploads}
            icon={FileUp}
            color="bg-indigo-500"
            description="All time"
          />
          <StatCard
            label="Slips Generated"
            value={totalSlips}
            icon={FileText}
            color="bg-emerald-500"
            description="PDFs ready to send"
          />
          <StatCard
            label="Emails Sent"
            value={totalEmailsSent}
            icon={Mail}
            color="bg-blue-500"
            description="Successfully delivered"
          />
        </div>
      </div>

      {/* Recent Uploads */}
      <Card noPadding>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Recent Payroll Uploads</h2>
            <p className="text-xs text-slate-400 mt-0.5">Latest uploaded payroll data</p>
          </div>
          <Link href="/upload">
            <Button size="sm" icon={<Upload className="w-3.5 h-3.5" />}>
              New Upload
            </Button>
          </Link>
        </div>

        {recentUploads.length === 0 ? (
          <EmptyState
            icon={<FileUp className="w-6 h-6" />}
            title="No payroll uploaded yet"
            description="Upload a CSV file to start generating salary slips."
            action={
              <Link href="/upload">
                <Button size="sm">Upload Payroll CSV</Button>
              </Link>
            }
          />
        ) : (
          <div className="divide-y divide-slate-800">
            {recentUploads.map((upload: typeof recentUploads[0]) => (
              <Link
                key={upload.id}
                href={`/payroll/${upload.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-800/70 transition-colors group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-100 truncate">
                    {upload.fileName}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {formatMonth(upload.month, upload.year)} ·{" "}
                    {(upload as typeof upload & { _count: { records: number } })._count.records} employees ·{" "}
                    {formatDateTime(upload.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <UploadStatusBadge status={upload.status} />
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {recentUploads.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-800">
            <Link
              href="/history"
              className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              View full history
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}
