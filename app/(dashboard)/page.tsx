import Link from "next/link";
import { FileUp, FileText, Mail, ArrowUpRight, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadStatusBadge } from "@/components/shared/status-badge";
import { formatMonth, formatDateTime } from "@/lib/utils";
import { RetryFailedButton } from "@/components/dashboard/retry-failed-button";
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
  // Fetch latest upload and related counts. Keep queries small and focused.
  let latestUpload = null as null | Awaited<ReturnType<typeof prisma.payrollUpload.findFirst>>;
  let recentUploads: Awaited<ReturnType<typeof prisma.payrollUpload.findMany>> = [];
  let pdfsGenerated = 0;
  let emailsSent = 0;
  let failedDeliveries = 0;
  let recentActivity: Awaited<ReturnType<typeof prisma.emailLog.findMany>> = [];

  try {
    latestUpload = await prisma.payrollUpload.findFirst({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { records: true } } },
    });

    // Recent uploads snapshot
    recentUploads = await prisma.payrollUpload.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { _count: { select: { records: true } } },
    });

    if (latestUpload) {
      pdfsGenerated = await prisma.salarySlip.count({
        where: { record: { uploadId: latestUpload.id } },
      });

      emailsSent = await prisma.emailLog.count({
        where: { slip: { record: { uploadId: latestUpload.id } }, status: "SENT" },
      });

      failedDeliveries = await prisma.emailLog.count({
        where: { slip: { record: { uploadId: latestUpload.id } }, status: "FAILED" },
      });

      recentActivity = await prisma.emailLog.findMany({
        where: { slip: { record: { uploadId: latestUpload.id } } },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          slip: {
            include: {
              record: { select: { name: true, employeeCode: true, netSalary: true, month: true, year: true } },
            },
          },
        },
      });
    }
  } catch (err) {
    console.error("[Dashboard] Failed to load stats:", err);
  }

  return (
    <div className="space-y-8 max-w-5xl pb-12">
      {/* Stats for latest upload */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-4">
          Current Payroll Batch
        </h2>
        {latestUpload ? (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <StatCard
              label="Employees in batch"
              value={latestUpload._count.records}
              icon={FileUp}
              color="bg-indigo-500"
              description={`${formatMonth(latestUpload.month, latestUpload.year)}`}
            />
            <StatCard
              label="PDFs generated"
              value={pdfsGenerated}
              icon={FileText}
              color="bg-emerald-500"
            />
            <StatCard
              label="Emails sent"
              value={emailsSent}
              icon={Mail}
              color="bg-blue-500"
            />
            <StatCard
              label="Failed deliveries"
              value={failedDeliveries}
              icon={AlertTriangle}
              color="bg-red-600"
            />
          </div>
        ) : (
          <Card>
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-semibold text-slate-100">No payroll batch available</p>
                <p className="text-xs text-slate-400 mt-1">Upload a payroll file to begin processing your first batch.</p>
              </div>
              <div>
                <Link href="/upload">
                  <Button size="sm">Upload payroll</Button>
                </Link>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Current payroll batch card */}
      {latestUpload && (
        <Card>
          <div className="flex items-start justify-between px-6 py-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-semibold text-slate-100">
                {formatMonth(latestUpload.month, latestUpload.year)} Payroll Batch
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {latestUpload._count.records} employees · Uploaded {formatDateTime(latestUpload.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href={`/payroll/${latestUpload.id}`}>
                <Button size="sm">View Upload</Button>
              </Link>
              {failedDeliveries > 0 && <RetryFailedButton uploadId={latestUpload.id} />}
            </div>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-400">Employee count</p>
                <p className="font-semibold text-slate-100 mt-1">{latestUpload._count.records}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">PDF generation</p>
                <p className="font-semibold text-slate-100 mt-1">{pdfsGenerated}/{latestUpload._count.records} generated</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Email dispatch</p>
                <p className="font-semibold text-slate-100 mt-1">{emailsSent} sent · {failedDeliveries} failed</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Conditional alerts */}
      {latestUpload && failedDeliveries > 0 && (
        <Card>
          <div className="flex items-start gap-4 px-6 py-4">
            <div className="text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-red-300">Failed email deliveries</p>
              <p className="text-sm text-slate-400 mt-1">There are {failedDeliveries} failed email attempts in the latest payroll batch. Retry failed emails to attempt redelivery.</p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity feed */}
        <div className="lg:col-span-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Recent activity</h4>
          <Card noPadding className="h-full flex flex-col">
            {recentActivity.length === 0 ? (
              <div className="flex-1 divide-y divide-slate-800">
                <div className="px-6 py-3 text-sm text-slate-400">No recent activity for this payroll batch.</div>
              </div>
            ) : (
              <div className="flex-1 divide-y divide-slate-800">
                {recentActivity.map((log) => (
                  <div key={log.id} className="px-6 py-3 flex items-start justify-between">
                    <div>
                      <div className="text-sm font-medium text-slate-100">{log.slip.record.name}</div>
                      <div className="text-xs text-slate-400">{log.slip.record.employeeCode} · {formatMonth(log.slip.record.month, log.slip.record.year)}</div>
                    </div>
                    <div className="text-sm text-slate-400 text-right">
                      <div>{log.status}</div>
                      <div className="text-xs mt-1">{log.sentAt ? formatDateTime(log.sentAt) : formatDateTime(log.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* footer to match Recent uploads bottom edge */}
            <div className="px-6 py-3 border-t border-slate-800" />
          </Card>
        </div>

        {/* Recent uploads snapshot */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Recent uploads</h4>
          <Card noPadding className="h-full flex flex-col">
            {recentUploads.length === 0 ? (
              <div className="flex-1 p-6 text-sm text-slate-400">No uploads yet.</div>
            ) : (
              <div className="flex-1 divide-y divide-slate-800">
                {recentUploads.map((upload) => (
                  <Link key={upload.id} href={`/payroll/${upload.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-slate-800/70 transition-colors">
                    <div>
                      <div className="text-sm text-slate-100">{formatMonth(upload.month, upload.year)}</div>
                      <div className="text-xs text-slate-400">{formatDateTime(upload.createdAt)}</div>
                    </div>
                    <div className="text-sm text-slate-400">{(upload as typeof upload & { _count: { records: number } })._count.records} · <UploadStatusBadge status={upload.status} /></div>
                  </Link>
                ))}
              </div>
            )}

            {recentUploads.length > 0 && (
              <div className="px-6 py-3 border-t border-slate-800">
                <Link href="/history" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1.5">
                  View full history
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* End of dashboard content */}
    </div>
  );
}
