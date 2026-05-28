import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "muted";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-indigo-50 text-indigo-700 ring-indigo-600/10",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  warning: "bg-amber-50  text-amber-700  ring-amber-600/10",
  danger:  "bg-red-50    text-red-700    ring-red-600/10",
  info:    "bg-blue-50   text-blue-700   ring-blue-600/10",
  muted:   "bg-slate-100 text-slate-600  ring-slate-600/10",
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
