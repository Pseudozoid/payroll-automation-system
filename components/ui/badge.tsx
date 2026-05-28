import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "muted";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-indigo-950/50 text-indigo-200 ring-indigo-500/30",
  success: "bg-emerald-950/50 text-emerald-200 ring-emerald-500/30",
  warning: "bg-amber-950/50  text-amber-200  ring-amber-500/30",
  danger:  "bg-red-950/50    text-red-200    ring-red-500/30",
  info:    "bg-blue-950/50   text-blue-200   ring-blue-500/30",
  muted:   "bg-slate-800     text-slate-200  ring-slate-500/30",
};

const dotClasses: Record<BadgeVariant, string> = {
  default: "bg-indigo-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger:  "bg-red-500",
  info:    "bg-blue-500",
  muted:   "bg-slate-400",
};

export function Badge({ children, variant = "default", className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        variantClasses[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotClasses[variant])}
        />
      )}
      {children}
    </span>
  );
}
