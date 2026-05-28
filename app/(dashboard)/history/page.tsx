import Link from "next/link";
import { FileUp, Mail, ChevronRight, Inbox } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { UploadDeleteAction } from "@/components/shared/upload-delete-action";
import { UploadStatusBadge, EmailStatusBadge } from "@/components/shared/status-badge";
import { formatMonth, formatDateTime, formatINR } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "History" };
export const dynamic = "force-dynamic";

// emailLog.findMany with slip→record include
// Using a simpler interface to avoid Prisma generic complexity
interface EmailLogRecord {
  id: string;
  slipId: string;
  sentTo: string;
  status: "PENDING" | "SENT" | "FAILED";
  errorMsg: string | null;
  sentAt: Date | null;
  createdAt: Date;
  slip: {
    record: {
      name: string;
      employeeCode: string;
      netSalary: number;
      month: number;
      year: number;
    };
  };
}

export default async function HistoryPage() {
  let uploads: Awaited<ReturnType<typeof prisma.payrollUpload.findMany>> = [];
  let emailLogs: EmailLogRecord[] = [];

  try {
    [uploads, emailLogs] = await Promise.all([
      prisma.payrollUpload.findMany({
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { records: true } } },
      }),
      prisma.emailLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          slip: {
            include: {
              record: {
                select: {
                  name: true,
                  employeeCode: true,
                  netSalary: true,
                  month: true,
                  year: true,
                },
              },
            },
          },
        },
      }),
    ]);
  } catch (err) {
    console.error("[History] DB error:", err);
  }

  return (
    <div className="max-w-5xl space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">History</h1>
          <p className="text-sm text-slate-400 mt-1">
            All payroll uploads and email dispatch records.
          </p>
        </div>

        {uploads.length > 0 && (
          <UploadDeleteAction
            clearAll
            uploadCount={uploads.length}
            buttonLabel="Clear history"
            dialogTitle="Clear all payroll history?"
            dialogDescription="This will remove every payroll upload and its related data."
            confirmLabel="Clear history"
          />
        )}
      </div>

      {/* ── Payroll Uploads ──────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
          Payroll Uploads
        </h2>
        <Card noPadding>
          {uploads.length === 0 ? (
            <EmptyState
              icon={<FileUp className="w-5 h-5" />}
              title="No uploads yet"
              description="Upload a payroll CSV to get started."
              action={
                <Link
                  href="/upload"
                  className="text-sm font-medium text-indigo-600 hover:underline"
                >
                  Go to Upload →
                </Link>
              }
            />
          ) : (
            <div className="divide-y divide-slate-800">
              {uploads.map((upload: typeof uploads[0]) => (
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
                      Uploaded {formatDateTime(upload.createdAt)}
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
        </Card>
      </section>

      {/* ── Email Dispatch History ───────────────────────────────────────────── */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
          Email Dispatch History
        </h2>
        <Card noPadding>
          {emailLogs.length === 0 ? (
            <EmptyState
              icon={<Mail className="w-5 h-5" />}
              title="No emails sent yet"
              description="Generate PDFs and dispatch emails from a payroll upload page."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th className="text-left">Employee</th>
                    <th className="text-left">Pay Period</th>
                    <th className="text-left">Sent To</th>
                    <th className="text-right">Net Salary</th>
                    <th className="text-center">Status</th>
                    <th className="text-left">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {emailLogs.map((log: typeof emailLogs[0]) => (
                    <tr key={log.id}>
                      <td>
                        <div className="font-medium text-slate-100">
                          {log.slip.record.name}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          {log.slip.record.employeeCode}
                        </div>
                      </td>
                      <td className="text-sm text-slate-300">
                        {formatMonth(log.slip.record.month, log.slip.record.year)}
                      </td>
                      <td className="text-sm text-slate-300">{log.sentTo}</td>
                      <td className="text-right font-medium text-sm">
                        {formatINR(log.slip.record.netSalary)}
                      </td>
                      <td className="text-center">
                        <EmailStatusBadge status={log.status} />
                      </td>
                      <td className="text-sm text-slate-400">
                        {log.sentAt
                          ? formatDateTime(log.sentAt)
                          : log.errorMsg
                          ? (
                            <span className="text-xs text-red-600" title={log.errorMsg}>
                              {log.errorMsg.slice(0, 40)}…
                            </span>
                          )
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
