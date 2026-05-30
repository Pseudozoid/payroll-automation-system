import { Card } from "@/components/ui/card";

function PulseBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-800/70 ${className}`} />;
}

export default function DashboardLoading() {
  return (
    <div className="max-w-5xl space-y-8 pb-12">
      <div className="space-y-2">
        <PulseBlock className="h-6 w-48" />
        <PulseBlock className="h-4 w-80" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <Card key={index}>
            <div className="space-y-4">
              <PulseBlock className="h-3 w-28" />
              <PulseBlock className="h-8 w-20" />
              <PulseBlock className="h-3 w-32" />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card noPadding className="lg:col-span-2 overflow-hidden">
          <div className="border-b border-slate-800 px-6 py-4">
            <PulseBlock className="h-4 w-32" />
          </div>
          <div className="divide-y divide-slate-800">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="flex items-center justify-between px-6 py-4">
                <div className="space-y-2">
                  <PulseBlock className="h-4 w-40" />
                  <PulseBlock className="h-3 w-56" />
                </div>
                <div className="space-y-2 text-right">
                  <PulseBlock className="h-5 w-20 ml-auto" />
                  <PulseBlock className="h-3 w-16 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card noPadding className="overflow-hidden">
          <div className="border-b border-slate-800 px-6 py-4">
            <PulseBlock className="h-4 w-28" />
          </div>
          <div className="divide-y divide-slate-800">
            {[0, 1, 2, 3, 4].map((index) => (
              <div key={index} className="px-6 py-3 space-y-2">
                <PulseBlock className="h-4 w-32" />
                <PulseBlock className="h-3 w-24" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}