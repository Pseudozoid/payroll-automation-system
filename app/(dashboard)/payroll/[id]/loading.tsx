import { Card, CardHeader } from "@/components/ui/card";

function PulseBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-800/70 ${className}`} />;
}

export default function PayrollDetailLoading() {
  return (
    <div className="max-w-5xl space-y-6">
      <div className="space-y-3">
        <PulseBlock className="h-3 w-24" />
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <PulseBlock className="h-6 w-64" />
            <PulseBlock className="h-4 w-80" />
          </div>
          <div className="flex gap-2">
            <PulseBlock className="h-8 w-28" />
            <PulseBlock className="h-8 w-28" />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <PulseBlock className="h-9 w-36 rounded-xl" />
        <PulseBlock className="h-9 w-32 rounded-xl" />
        <PulseBlock className="h-9 w-20 rounded-xl" />
        <PulseBlock className="h-9 w-28 rounded-xl" />
      </div>

      <Card>
        <div className="space-y-3">
          <PulseBlock className="h-4 w-48" />
          <PulseBlock className="h-3 w-40" />
        </div>
      </Card>

      <Card noPadding>
        <div className="px-6 py-4 border-b border-slate-800">
          <CardHeader className="mb-0" title="Employee Salary Records" description="Loading payroll data..." />
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-225">
            <div className="grid grid-cols-6 gap-4 border-b border-slate-800 px-6 py-3 text-xs uppercase tracking-wide text-slate-400">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <PulseBlock key={index} className="h-3 w-full" />
              ))}
            </div>
            {[0, 1, 2, 3, 4].map((index) => (
              <div key={index} className="grid grid-cols-6 gap-4 border-b border-slate-800 px-6 py-5">
                {[0, 1, 2, 3, 4, 5].map((cell) => (
                  <div key={cell} className="space-y-2">
                    <PulseBlock className="h-4 w-4/5" />
                    <PulseBlock className="h-3 w-3/5" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}