import { AlertCircle, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { CsvRowError } from "@/types";

interface ValidationErrorsProps {
  errors: CsvRowError[];
}

export function ValidationErrors({ errors }: ValidationErrorsProps) {
  const [expanded, setExpanded] = useState(true);

  if (errors.length === 0) return null;

  return (
    <div className="rounded-xl border border-red-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-3.5 bg-red-50 border-b border-red-200
          hover:bg-red-100 transition-colors text-left"
      >
        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
        <span className="text-sm font-semibold text-red-700 flex-1">
          {errors.length} row{errors.length !== 1 ? "s" : ""} failed validation — these will not be uploaded
        </span>
        <ChevronDown
          className={`w-4 h-4 text-red-400 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {/* Error list */}
      {expanded && (
        <div className="divide-y divide-red-100 max-h-64 overflow-y-auto bg-white">
          {errors.map((err, i) => (
            <div key={i} className="px-5 py-3">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-xs font-mono font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                  Row {err.row}
                </span>
                <span className="text-xs font-medium text-slate-600">
                  {err.employeeId}
                </span>
              </div>
              <ul className="space-y-0.5">
                {err.errors.map((msg, j) => (
                  <li key={j} className="text-xs text-red-700 flex items-start gap-1.5">
                    <span className="mt-0.5 shrink-0">•</span>
                    {msg}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
