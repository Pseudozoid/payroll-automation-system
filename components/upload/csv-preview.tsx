import { CheckCircle, AlertTriangle } from "lucide-react";
import { formatINR, formatMonth } from "@/lib/utils";
import type { ValidatedCsvRow } from "@/types";

interface CsvPreviewProps {
  rows: ValidatedCsvRow[];
  month: number;
  year: number;
  errorCount: number;
}

export function CsvPreview({ rows, month, year, errorCount }: CsvPreviewProps) {
  if (rows.length === 0) return null;

  const totalGross = rows.reduce((s, r) => s + r.grossSalary, 0);
  const totalNet = rows.reduce((s, r) => s + r.netSalary, 0);

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between gap-4 p-4 bg-slate-900 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-medium text-slate-200">
            {rows.length} valid row{rows.length !== 1 ? "s" : ""} for{" "}
            <strong>{formatMonth(month, year)}</strong>
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-slate-400">Total Gross:</span>{" "}
            <span className="font-semibold text-slate-100">{formatINR(totalGross)}</span>
          </div>
          <div>
            <span className="text-slate-400">Total Net:</span>{" "}
            <span className="font-semibold text-emerald-300">{formatINR(totalNet)}</span>
          </div>
          {errorCount > 0 && (
            <div className="flex items-center gap-1.5 text-amber-700">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{errorCount} row{errorCount !== 1 ? "s" : ""} skipped</span>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full data-table">
          <thead>
            <tr>
              <th className="text-left">Employee ID</th>
              <th className="text-left">Name</th>
              <th className="text-left">Designation</th>
              <th className="text-right">Basic</th>
              <th className="text-right">HRA</th>
              <th className="text-right">Allowances</th>
              <th className="text-right">Deductions</th>
              <th className="text-right">Net Salary</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td className="font-mono text-xs font-medium text-slate-300">
                  {row.employeeCode}
                </td>
                <td>
                  <div className="font-medium text-slate-100">{row.name}</div>
                  <div className="text-xs text-slate-500">{row.email}</div>
                </td>
                <td className="text-slate-300">{row.designation}</td>
                <td className="text-right font-medium">{formatINR(row.baseSalary)}</td>
                <td className="text-right text-slate-300">{formatINR(row.hra)}</td>
                <td className="text-right text-slate-300">{formatINR(row.allowances)}</td>
                <td className="text-right text-red-600">−{formatINR(row.deductions)}</td>
                <td className="text-right font-semibold text-emerald-300">
                  {formatINR(row.netSalary)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
