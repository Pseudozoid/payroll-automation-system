"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Upload,
  History,
  LogOut,
  Banknote,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const [dashboardHref, setDashboardHref] = useState("/");

  const syncDashboardHref = useCallback(() => {
    const storedUploadId = window.localStorage.getItem("salary-slip-dashboard:selected-upload-id");
    setDashboardHref(storedUploadId ? `/?uploadId=${encodeURIComponent(storedUploadId)}` : "/");
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      syncDashboardHref();
    }, 0);

    window.addEventListener("salary-slip-dashboard-selection-changed", syncDashboardHref);
    window.addEventListener("storage", syncDashboardHref);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("salary-slip-dashboard-selection-changed", syncDashboardHref);
      window.removeEventListener("storage", syncDashboardHref);
    };
  }, [syncDashboardHref]);

  const navItems = [
    { href: dashboardHref, label: "Dashboard", icon: LayoutDashboard },
    { href: "/upload", label: "Upload Payroll", icon: Upload },
    { href: "/history", label: "History", icon: History },
  ];

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  }

  return (
    <aside className="w-64 flex flex-col shrink-0 bg-slate-950 border-r border-slate-800/60">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-800/60">
        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30">
          <Banknote className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-none">Payroll Automation System</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Admin Console</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            item.label === "Dashboard"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 1 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/70"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0", isActive && "text-indigo-400")} />
                <span>{item.label}</span>
                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 ml-auto text-indigo-500" />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="px-3 py-4 border-t border-slate-800/60">
        <button
          id="sidebar-logout-btn"
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium
            text-slate-500 hover:text-slate-200 hover:bg-slate-800/70 transition-all duration-150"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
