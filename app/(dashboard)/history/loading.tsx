import { Card } from "@/components/ui/card";

function PulseBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-800/70 ${className}`} />;
}

export default function HistoryLoading() {
  return (
    <div className="max-w-5xl space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <PulseBlock className="h-6 w-32" />
          <PulseBlock className="h-4 w-72" />
        </div>
        <PulseBlock className="h-9 w-40 rounded-xl" />
      </div>

      <section className="space-y-3">
        <PulseBlock className="h-3 w-24" />
        <Card noPadding>
          <div className="divide-y divide-slate-800">
            {[0, 1, 2, 3, 4].map((index) => (
              <div key={index} className="flex items-center justify-between px-6 py-4">
                <div className="space-y-2">
                  <PulseBlock className="h-4 w-40" />
                  <PulseBlock className="h-3 w-64" />
                </div>
                <div className="flex items-center gap-3">
                  <PulseBlock className="h-6 w-20" />
                  <PulseBlock className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="space-y-3">
        <PulseBlock className="h-3 w-32" />
        <Card noPadding>
          <div className="overflow-hidden">
            <div className="border-b border-slate-800 px-6 py-4">
              <PulseBlock className="h-4 w-40" />
            </div>
            <div className="space-y-0 divide-y divide-slate-800">
              {[0, 1, 2, 3, 4].map((row) => (
                <div key={row} className="grid grid-cols-6 gap-4 px-6 py-4">
                  {[0, 1, 2, 3, 4, 5].map((cell) => (
                    <PulseBlock key={cell} className="h-4 w-full" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}