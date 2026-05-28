"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { FileUploadZone } from "@/components/upload/file-upload-zone";
import { CsvPreview } from "@/components/upload/csv-preview";
import { ValidationErrors } from "@/components/upload/validation-errors";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { validateCsvHeaders } from "@/validations/csv";
import { validateAndProcessCsvRows } from "@/lib/csv";
import type { CsvValidationResult, RawCsvRow } from "@/types";

// ─── State machine ─────────────────────────────────────────────────────────────

type Step = "idle" | "parsing" | "preview" | "uploading" | "success" | "error";

interface PreviewState {
  result: CsvValidationResult;
  fileName: string;
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function UploadPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("idle");
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [headerError, setHeaderError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // ─── File select handler ─────────────────────────────────────────────────────

  const handleFileSelect = useCallback((file: File) => {
    setStep("parsing");
    setHeaderError(null);
    setUploadError(null);
    setPreview(null);

    const reader = new FileReader();

    reader.onerror = () => {
      setHeaderError("Failed to read the file. Please try again.");
      setStep("idle");
    };

    reader.onload = (e) => {
      const text = e.target?.result as string;

      Papa.parse<RawCsvRow>(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h: string) => h.trim().toLowerCase().replace(/\s+/g, "_"),
        complete: (result: { data: RawCsvRow[]; meta: { fields?: string[] }; errors: unknown[] }) => {
          const headers = result.meta.fields ?? [];

          // Header validation
          const missingHeaders = validateCsvHeaders(headers);
          if (missingHeaders.length > 0) {
            setHeaderError(
              `Missing required column${missingHeaders.length > 1 ? "s" : ""}: ${missingHeaders.join(", ")}`
            );
            setStep("idle");
            return;
          }

          const rows = result.data;
          if (rows.length === 0) {
            setHeaderError("The CSV file contains no data rows. Please check the file.");
            setStep("idle");
            return;
          }

          // Full validation + processing
          const validationResult = validateAndProcessCsvRows(rows);
          setPreview({ result: validationResult, fileName: file.name });
          setStep("preview");
        },
        error: (err: { message: string }) => {
          setHeaderError(`Could not parse the CSV: ${err.message}`);
          setStep("idle");
        },
      });
    };

    reader.readAsText(file);
  }, []);

  // ─── Reset handler ────────────────────────────────────────────────────────────

  function handleReset() {
    setStep("idle");
    setPreview(null);
    setHeaderError(null);
    setUploadError(null);
  }

  // ─── Upload handler ───────────────────────────────────────────────────────────

  async function handleUpload() {
    if (!preview || preview.result.valid.length === 0) return;

    setStep("uploading");
    setUploadError(null);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: preview.fileName,
          month: preview.result.month,
          year: preview.result.year,
          records: preview.result.valid,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error ?? `Upload failed (${res.status})`);
      }

      // Navigate to the upload detail page
      router.push(`/payroll/${json.id}`);
    } catch (err) {
      setUploadError((err as Error).message);
      setStep("preview");
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  const hasValidRows = (preview?.result.valid.length ?? 0) > 0;
  const hasErrors = (preview?.result.errors.length ?? 0) > 0;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Upload Payroll</h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload a CSV file with employee payroll data. All rows are validated before saving.
        </p>
      </div>

      {/* CSV format guide */}
      <Card className="bg-slate-50 border-slate-200">
        <div className="flex items-start gap-3">
          <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-1.5">Required CSV columns</p>
            <code className="text-xs text-indigo-700 bg-indigo-50 px-2 py-1 rounded font-mono">
              employee_id, name, email, designation, base_salary, hra, allowances, deductions, month, year
            </code>
            <p className="text-xs text-slate-500 mt-2">
              All rows must share the same <strong>month</strong> and <strong>year</strong> values (1–12 and 4-digit year).
              Net salary = (base_salary + hra + allowances) − deductions.
            </p>
          </div>
        </div>
      </Card>

      <AnimatePresence mode="wait">
        {/* ── Upload zone ─────────────────────────────────────────────────────── */}
        {(step === "idle" || step === "parsing") && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card>
              <FileUploadZone
                onFileSelect={handleFileSelect}
                disabled={step === "parsing"}
              />

              {step === "parsing" && (
                <div className="flex items-center justify-center gap-2 mt-4 text-sm text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                  Parsing and validating file…
                </div>
              )}

              {headerError && (
                <div className="flex items-start gap-2.5 mt-4 p-3.5 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{headerError}</p>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* ── Preview state ────────────────────────────────────────────────────── */}
        {(step === "preview" || step === "uploading") && preview && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Validation errors */}
            {hasErrors && (
              <ValidationErrors errors={preview.result.errors} />
            )}

            {/* Valid rows preview */}
            {hasValidRows ? (
              <Card noPadding>
                <div className="px-6 py-4 border-b border-slate-100">
                  <CardHeader
                    className="mb-0"
                    title="Payroll Preview"
                    description={`${preview.result.valid.length} employees ready to upload · ${preview.fileName}`}
                    action={
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<RotateCcw className="w-3.5 h-3.5" />}
                        onClick={handleReset}
                        disabled={step === "uploading"}
                      >
                        Reset
                      </Button>
                    }
                  />
                </div>
                <div className="p-6 space-y-4">
                  <CsvPreview
                    rows={preview.result.valid}
                    month={preview.result.month}
                    year={preview.result.year}
                    errorCount={preview.result.errors.length}
                  />
                </div>
              </Card>
            ) : (
              <Card>
                <div className="text-center py-10">
                  <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-700">All rows failed validation</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Fix the errors above and re-upload your CSV.
                  </p>
                  <Button className="mt-4" variant="secondary" onClick={handleReset}>
                    Upload a different file
                  </Button>
                </div>
              </Card>
            )}

            {/* Upload error */}
            {uploadError && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {uploadError}
              </div>
            )}

            {/* Action bar */}
            {hasValidRows && (
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="secondary"
                  onClick={handleReset}
                  disabled={step === "uploading"}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  loading={step === "uploading"}
                  icon={<Upload className="w-4 h-4" />}
                >
                  {step === "uploading"
                    ? "Saving payroll…"
                    : `Upload ${preview.result.valid.length} employee${preview.result.valid.length !== 1 ? "s" : ""}`}
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
