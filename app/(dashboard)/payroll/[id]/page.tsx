"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Mail,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  Send,
} from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { UploadDeleteAction } from "@/components/shared/upload-delete-action";
import { SlipStatusBadge } from "@/components/shared/status-badge";
import { Spinner } from "@/components/ui/spinner";
import { formatINR, formatMonth, formatDateTime } from "@/lib/utils";
import type { PayrollUpload, SalaryRecord, GenerateResult, DispatchResult } from "@/types";

interface UploadWithRecords extends PayrollUpload {
  records: (SalaryRecord & {
    salarySlip: {
      id: string;
      status: string;
      emailLogs: { status: string; sentAt: string | null; errorMsg: string | null }[];
    } | null;
  })[];
}

type ActionState = "idle" | "loading" | "done" | "error";

interface ActionFeedback {
  state: ActionState;
  result?: GenerateResult | DispatchResult;
  error?: string;
}

export default function PayrollDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [upload, setUpload] = useState<UploadWithRecords | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [generateState, setGenerateState] = useState<ActionFeedback>({ state: "idle" });
  const [emailState, setEmailState] = useState<ActionFeedback>({ state: "idle" });

  // ─── Fetch upload ───────────────────────────────────────────────────────────

  const fetchUpload = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/payroll/${id}`);
      if (!res.ok) throw new Error("Payroll upload not found.");
      const data = await res.json();
      setUpload(data);
    } catch (err) {
      setFetchError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchUpload(); }, [fetchUpload]);

  // ─── Generate PDFs ──────────────────────────────────────────────────────────

  async function handleGenerate() {
    setGenerateState({ state: "loading" });
    try {
      const res = await fetch("/api/salary-slips/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId: id }),
      });
      const data: GenerateResult = await res.json();
      setGenerateState({ state: "done", result: data });
      await fetchUpload(); // Refresh data
    } catch (err) {
      setGenerateState({ state: "error", error: (err as Error).message });
    }
  }

  // ─── Dispatch Emails ────────────────────────────────────────────────────────

  async function handleDispatch() {
    setEmailState({ state: "loading" });
    try {
      const res = await fetch("/api/email/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId: id }),
      });
      const data: DispatchResult = await res.json();
      setEmailState({ state: "done", result: data });
      await fetchUpload();
    } catch (err) {
      setEmailState({ state: "error", error: (err as Error).message });
    }
  }

  // ─── Derived state ──────────────────────────────────────────────────────────

  const slipsGenerated = upload?.records.filter((r) => r.salarySlip).length ?? 0;
  const slipsTotal = upload?.records.length ?? 0;
  const allGenerated = slipsGenerated === slipsTotal && slipsTotal > 0;

  const emailsSent = upload?.records.filter(
    (r) => r.salarySlip?.emailLogs?.some((l) => l.status === "SENT")
  ).length ?? 0;

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (fetchError || !upload) {
    return (
      <Card>
        <EmptyState
          icon={<AlertCircle className="w-6 h-6" />}
          title="Upload not found"
          description={fetchError ?? "This payroll upload does not exist."}
          action={<Link href="/"><Button variant="secondary">Back to Dashboard</Button></Link>}
        />
      </Card>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      {/* Back + header */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 mb-3 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Dashboard
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">
              {upload.fileName}
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {formatMonth(upload.month, upload.year)} · {slipsTotal} employees ·
              Uploaded {formatDateTime(upload.createdAt)}
            </p>
          </div>

          {/* Stats chips */}
          <div className="flex gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-950/40 border border-indigo-900/70 rounded-lg text-xs font-medium text-indigo-200">
              <FileText className="w-3.5 h-3.5" />
              {slipsGenerated}/{slipsTotal} PDFs
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/40 border border-emerald-900/70 rounded-lg text-xs font-medium text-emerald-200">
              <Mail className="w-3.5 h-3.5" />
              {emailsSent}/{slipsTotal} Sent
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          id="generate-pdfs-btn"
          onClick={handleGenerate}
          loading={generateState.state === "loading"}
          icon={<FileText className="w-4 h-4" />}
          variant={allGenerated ? "secondary" : "primary"}
          disabled={generateState.state === "loading" || emailState.state === "loading"}
        >
          {allGenerated ? "Regenerate PDFs" : "Generate PDFs"}
        </Button>

        <Button
          id="send-emails-btn"
          onClick={handleDispatch}
          loading={emailState.state === "loading"}
          icon={<Send className="w-4 h-4" />}
          variant="success"
          disabled={!allGenerated || emailState.state === "loading" || generateState.state === "loading"}
        >
          Send All Emails
        </Button>

        <Button
          variant="ghost"
          size="sm"
          icon={<RefreshCw className="w-3.5 h-3.5" />}
          onClick={fetchUpload}
          disabled={loading}
        >
          Refresh
        </Button>

        <UploadDeleteAction
          uploadId={id}
          buttonLabel="Delete upload"
          dialogTitle="Delete this payroll upload?"
          dialogDescription="This action cannot be undone."
          confirmLabel="Delete upload"
          redirectTo="/history"
        />
      </div>

      {/* Action feedback */}
      {generateState.state !== "idle" && (
        <FeedbackBanner state={generateState} type="generate" />
      )}
      {emailState.state !== "idle" && (
        <FeedbackBanner state={emailState} type="email" />
      )}

      {/* Records table */}
      <Card noPadding>
        <div className="px-6 py-4 border-b border-slate-800">
          <CardHeader
            className="mb-0"
            title="Employee Salary Records"
            description={`${slipsTotal} employees in this upload`}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="text-left">Employee</th>
                <th className="text-left">Designation</th>
                <th className="text-right">Basic</th>
                <th className="text-right">Net Salary</th>
                <th className="text-center">Slip Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {upload.records.map((record) => (
                <tr key={record.id}>
                  <td>
                    <div className="font-medium text-slate-100">{record.name}</div>
                    <div className="text-xs text-slate-500 font-mono">{record.employeeCode}</div>
                    <div className="text-xs text-slate-400">{record.email}</div>
                  </td>
                  <td className="text-slate-300 text-sm">{record.designation}</td>
                  <td className="text-right font-medium text-sm">{formatINR(record.baseSalary)}</td>
                  <td className="text-right font-semibold text-emerald-300">
                    {formatINR(record.netSalary)}
                  </td>
                  <td className="text-center">
                    {record.salarySlip ? (
                      <SlipStatusBadge status={record.salarySlip.status as "GENERATED" | "EMAILED" | "FAILED"} />
                    ) : (
                      <span className="text-xs text-slate-400">Not generated</span>
                    )}
                  </td>
                  <td className="text-center">
                    {record.salarySlip && (
                      <a
                        href={`/api/salary-slips/${record.salarySlip.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-indigo-300 hover:text-indigo-200 font-medium transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        PDF
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── Feedback Banner ────────────────────────────────────────────────────────────

function FeedbackBanner({
  state,
  type,
}: {
  state: ActionFeedback;
  type: "generate" | "email";
}) {
  if (state.state === "loading") {
    return (
      <div className="flex items-center gap-2.5 p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-sm text-indigo-700">
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        {type === "generate" ? "Generating PDFs…" : "Sending emails…"}
      </div>
    );
  }

  if (state.state === "error") {
    return (
      <div className="flex items-start gap-2.5 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        {state.error}
      </div>
    );
  }

  if (state.state === "done" && state.result) {
    const r = state.result as GenerateResult & DispatchResult;
    const ok = type === "generate" ? r.success : r.sent;
    const fail = r.failed;

    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-start gap-2.5 p-4 rounded-xl text-sm border ${
          fail > 0
            ? "bg-amber-50 border-amber-200 text-amber-800"
            : "bg-emerald-50 border-emerald-200 text-emerald-800"
        }`}
      >
        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">
            {type === "generate"
              ? `${ok} PDF${ok !== 1 ? "s" : ""} generated`
              : `${ok} email${ok !== 1 ? "s" : ""} sent`}
            {fail > 0 && `, ${fail} failed`}
          </p>
          {r.errors?.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {r.errors.slice(0, 5).map((e, i) => (
                <li key={i} className="text-xs opacity-80">• {e}</li>
              ))}
              {r.errors.length > 5 && (
                <li className="text-xs opacity-60">…and {r.errors.length - 5} more</li>
              )}
            </ul>
          )}
        </div>
      </motion.div>
    );
  }

  return null;
}
