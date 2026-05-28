"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, AlertTriangle, FileText, FileUp, Loader2, Mail } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RetryFailedButton } from "@/components/dashboard/retry-failed-button";
import { UploadStatusBadge } from "@/components/shared/status-badge";
import type { UploadStatus } from "@/types";
import { cn, formatDateTime, formatMonth } from "@/lib/utils";

const SELECTED_UPLOAD_STORAGE_KEY = "salary-slip-dashboard:selected-upload-id";

type EmailLog = {
  id: string;
  status: string;
  sentAt: string | null;
  errorMsg: string | null;
  createdAt: string;
};

type SalarySlip = {
  id: string;
  status: string;
  emailLogs: EmailLog[];
};

type SalaryRecord = {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  designation: string;
  month: number;
  year: number;
  salarySlip: SalarySlip | null;
};

export type DashboardUploadSummary = {
  id: string;
  fileName: string;
  month: number;
  year: number;
  status: UploadStatus;
  createdAt: string;
  _count: { records: number };
};

export type DashboardUploadDetail = DashboardUploadSummary & {
  _count?: { records: number };
  records: SalaryRecord[];
};

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
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-100">{value.toLocaleString("en-IN")}</p>
          {description && <p className="mt-1 text-xs text-slate-400">{description}</p>}
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", color)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </Card>
  );
}

function getLogTimestamp(log: EmailLog) {
  return log.sentAt ?? log.createdAt;
}

export function BatchSwitcher({
  initialUpload,
  recentUploads,
}: {
  initialUpload: DashboardUploadDetail | null;
  recentUploads: DashboardUploadSummary[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedUpload, setSelectedUpload] = useState<DashboardUploadDetail | null>(initialUpload);
  const [loadingUploadId, setLoadingUploadId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const restoredSelectionRef = useRef(false);

  const loadUpload = useCallback(async (uploadId: string, options?: { silent?: boolean }) => {

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setLoadingUploadId(uploadId);
    if (!options?.silent) {
      setLoadError(null);
    }

    try {
      const response = await fetch(`/api/payroll/${uploadId}`);
      if (!response.ok) {
        throw new Error("Payroll upload not found.");
      }

      const data = (await response.json()) as DashboardUploadDetail;

      if (requestIdRef.current === requestId) {
        setSelectedUpload(data);
        localStorage.setItem(SELECTED_UPLOAD_STORAGE_KEY, uploadId);
        window.dispatchEvent(new Event("salary-slip-dashboard-selection-changed"));
        const nextParams = new URLSearchParams(searchParams.toString());
        nextParams.set("uploadId", uploadId);
        router.replace(`/?${nextParams.toString()}`, { scroll: false });
      }
    } catch (error) {
      if (requestIdRef.current === requestId) {
        if (options?.silent) {
          localStorage.removeItem(SELECTED_UPLOAD_STORAGE_KEY);
        } else {
          setLoadError((error as Error).message || "Failed to load payroll batch.");
        }
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setLoadingUploadId(null);
      }
    }
  }, [router, searchParams]);

  useEffect(() => {
    if (restoredSelectionRef.current || !initialUpload) {
      return;
    }

    restoredSelectionRef.current = true;

    const urlUploadId = searchParams.get("uploadId");

    if (urlUploadId) {
      window.localStorage.setItem(SELECTED_UPLOAD_STORAGE_KEY, urlUploadId);
      window.dispatchEvent(new Event("salary-slip-dashboard-selection-changed"));
      return;
    }

    const storedUploadId = window.localStorage.getItem(SELECTED_UPLOAD_STORAGE_KEY);

    if (storedUploadId && storedUploadId !== initialUpload.id) {
      const restoreTimer = window.setTimeout(() => {
        void loadUpload(storedUploadId, { silent: true });
      }, 0);

      return () => window.clearTimeout(restoreTimer);
    }

    window.localStorage.setItem(SELECTED_UPLOAD_STORAGE_KEY, initialUpload.id);
  }, [initialUpload, loadUpload, searchParams]);

  async function handleSelectUpload(uploadId: string) {
    if (!selectedUpload || uploadId === selectedUpload.id || loadingUploadId === uploadId) {
      return;
    }

    await loadUpload(uploadId);
  }

  if (!selectedUpload) {
    return (
      <div className="space-y-8 max-w-5xl pb-12">
        <div>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Current Payroll Batch</h2>
          <Card>
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-semibold text-slate-100">No payroll batch available</p>
                <p className="mt-1 text-xs text-slate-400">Upload a payroll file to begin processing your first batch.</p>
              </div>
              <Link href="/upload">
                <Button size="sm">Upload payroll</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const slipsGenerated = selectedUpload.records.filter((record) => record.salarySlip).length;
  const emailsSent = selectedUpload.records.filter((record) =>
    record.salarySlip?.emailLogs?.some((log) => log.status === "SENT")
  ).length;
  const failedDeliveries = selectedUpload.records.filter((record) =>
    record.salarySlip?.emailLogs?.[0]?.status === "FAILED"
  ).length;
  const selectedUploadRecordCount = selectedUpload._count?.records ?? selectedUpload.records.length;

  const recentActivity = selectedUpload.records
    .map((record) => {
      const latestLog = record.salarySlip?.emailLogs?.[0];
      if (!latestLog) {
        return null;
      }

      return {
        id: latestLog.id,
        status: latestLog.status,
        sentAt: latestLog.sentAt,
        createdAt: latestLog.createdAt,
        errorMsg: latestLog.errorMsg,
        slip: {
          record: {
            name: record.name,
            employeeCode: record.employeeCode,
            month: record.month,
            year: record.year,
          },
        },
      };
    })
    .filter((log): log is NonNullable<typeof log> => log !== null)
    .sort((left, right) => new Date(getLogTimestamp(right)).getTime() - new Date(getLogTimestamp(left)).getTime())
    .slice(0, 8);

  return (
    <div className="space-y-8 max-w-5xl pb-12">
      <div>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Current Payroll Batch</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <StatCard
            label="Employees in batch"
            value={selectedUploadRecordCount}
            icon={FileUp}
            color="bg-indigo-500"
            description={formatMonth(selectedUpload.month, selectedUpload.year)}
          />
          <StatCard label="PDFs generated" value={slipsGenerated} icon={FileText} color="bg-emerald-500" />
          <StatCard label="Emails sent" value={emailsSent} icon={Mail} color="bg-blue-500" />
          <StatCard label="Failed deliveries" value={failedDeliveries} icon={AlertTriangle} color="bg-red-600" />
        </div>
      </div>

      <Card>
        <div className="flex items-start justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-lg font-semibold text-slate-100">{formatMonth(selectedUpload.month, selectedUpload.year)} Payroll Batch</h3>
              <UploadStatusBadge status={selectedUpload.status} />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {selectedUploadRecordCount} employees · Uploaded {formatDateTime(selectedUpload.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/payroll/${selectedUpload.id}`}>
              <Button size="sm">View Upload</Button>
            </Link>
            {failedDeliveries > 0 && <RetryFailedButton uploadId={selectedUpload.id} />}
          </div>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-slate-400">Employee count</p>
              <p className="mt-1 font-semibold text-slate-100">{selectedUploadRecordCount}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">PDF generation</p>
              <p className="mt-1 font-semibold text-slate-100">
                {slipsGenerated}/{selectedUploadRecordCount} generated
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Email dispatch</p>
              <p className="mt-1 font-semibold text-slate-100">
                {emailsSent} sent · {failedDeliveries} failed
              </p>
            </div>
          </div>
        </div>
      </Card>

      {loadError && (
        <Card>
          <div className="flex items-start gap-4 px-6 py-4">
            <div className="text-red-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-red-300">Unable to switch batch</p>
              <p className="mt-1 text-sm text-slate-400">{loadError}</p>
            </div>
          </div>
        </Card>
      )}

      {failedDeliveries > 0 && (
        <Card>
          <div className="flex items-start gap-4 px-6 py-4">
            <div className="text-red-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-red-300">Failed email deliveries</p>
              <p className="mt-1 text-sm text-slate-400">
                There are {failedDeliveries} failed email attempts in the selected payroll batch. Retry failed emails to attempt redelivery.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Recent activity</h4>
          <Card noPadding className="flex h-full flex-col">
            {recentActivity.length === 0 ? (
              <div className="flex-1 divide-y divide-slate-800">
                <div className="px-6 py-3 text-sm text-slate-400">No recent activity for this payroll batch.</div>
              </div>
            ) : (
              <div className="flex-1 divide-y divide-slate-800">
                {recentActivity.map((log) => (
                  <div key={log.id} className="flex items-start justify-between px-6 py-3">
                    <div>
                      <div className="text-sm font-medium text-slate-100">{log.slip.record.name}</div>
                      <div className="text-xs text-slate-400">
                        {log.slip.record.employeeCode} · {formatMonth(log.slip.record.month, log.slip.record.year)}
                      </div>
                    </div>
                    <div className="text-right text-sm text-slate-400">
                      <div>{log.status}</div>
                      <div className="mt-1 text-xs">{log.sentAt ? formatDateTime(log.sentAt) : formatDateTime(log.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-slate-800 px-6 py-3" />
          </Card>
        </div>

        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Recent uploads</h4>
          <Card noPadding className="flex h-full flex-col">
            {recentUploads.length === 0 ? (
              <div className="flex-1 p-6 text-sm text-slate-400">No uploads yet.</div>
            ) : (
              <div className="flex-1 divide-y divide-slate-800">
                {recentUploads.map((upload) => {
                  const isSelected = upload.id === selectedUpload.id;
                  const isLoading = loadingUploadId === upload.id;

                  return (
                    <button
                      key={upload.id}
                      type="button"
                      onClick={() => handleSelectUpload(upload.id)}
                      className={cn(
                        "flex w-full items-center justify-between px-6 py-3 text-left transition-colors hover:bg-slate-800/70",
                        isSelected && "bg-slate-800/60"
                      )}
                      disabled={isLoading}
                    >
                      <div>
                        <div className="text-sm text-slate-100">{formatMonth(upload.month, upload.year)}</div>
                        <div className="text-xs text-slate-400">{formatDateTime(upload.createdAt)}</div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <span>{upload._count.records}</span>
                        <UploadStatusBadge status={upload.status} />
                        {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-300" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {recentUploads.length > 0 && (
              <div className="border-t border-slate-800 px-6 py-3">
                <Link href="/history" className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-700">
                  View full history
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}