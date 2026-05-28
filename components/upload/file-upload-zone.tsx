"use client";

import { useRef, useState } from "react";
import { Upload, FileText, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  disabled?: boolean;
}

export function FileUploadZone({
  onFileSelect,
  accept = ".csv,.xlsx,.xls",
  disabled = false,
}: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);

  function isValidFile(file: File): boolean {
    const name = file.name.toLowerCase();

    return (
      name.endsWith(".csv") ||
      name.endsWith(".xlsx") ||
      name.endsWith(".xls") ||
      file.type === "text/csv" ||
      file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.type === "application/vnd.ms-excel"
    );
  }

  function handleFile(file: File) {
    setDragError(null);
    if (!isValidFile(file)) {
      setDragError("Only CSV or Excel files are supported. Please upload a .csv, .xlsx, or .xls file.");
      return;
    }
    onFileSelect(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so same file can be re-uploaded
    e.target.value = "";
  }

  return (
    <div className="space-y-3">
      <div
        id="csv-upload-zone"
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload CSV file"
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && !disabled && inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center gap-3",
          "border-2 border-dashed rounded-2xl p-12 cursor-pointer",
          "transition-all duration-200",
          isDragging
            ? "upload-zone-drag"
            : "border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/30",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none"
        )}
      >
        <div
          className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
            isDragging ? "bg-indigo-100" : "bg-slate-100"
          )}
        >
          <Upload
            className={cn(
              "w-6 h-6 transition-colors",
              isDragging ? "text-indigo-500" : "text-slate-400"
            )}
          />
        </div>

        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700">
            {isDragging ? "Drop your payroll file here" : "Upload payroll CSV or Excel"}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Drag and drop, or{" "}
            <span className="text-indigo-600 font-medium">browse to select</span>
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <FileText className="w-3.5 h-3.5" />
          <span>CSV, .xlsx, or .xls files · first sheet is used</span>
        </div>
      </div>

      {dragError && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {dragError}
          <button
            onClick={() => setDragError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="sr-only"
        tabIndex={-1}
      />
    </div>
  );
}
