"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { getInitials } from "@/lib/utils";

const ROUTE_LABELS: Record<string, string> = {
  "/":        "Dashboard",
  "/upload":  "Upload Payroll",
  "/history": "History",
};

function getBreadcrumb(pathname: string): string {
  if (pathname.startsWith("/payroll/")) return "Payroll Detail";
  return ROUTE_LABELS[pathname] ?? "Dashboard";
}

export function Header() {
  const pathname = usePathname();
  const label = getBreadcrumb(pathname);
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_DISPLAY ?? "Admin";
  const initials = getInitials(adminEmail);

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/90 backdrop-blur px-6 flex items-center justify-between shrink-0">
      {/* Left: page title */}
      <div>
        <h1 className="text-sm font-semibold text-slate-100">{label}</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          {process.env.NEXT_PUBLIC_COMPANY_NAME ?? "PaySlip Pro"}
        </p>
      </div>

      {/* Right: avatar */}
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center
            text-white text-xs font-bold select-none"
          title="Admin"
        >
          {initials || "A"}
        </div>
      </div>
    </header>
  );
}
