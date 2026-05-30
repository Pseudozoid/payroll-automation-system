import { Card, CardHeader } from "@/components/ui/card";

function PulseBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-800/70 ${className}`} />;
}

export default function SettingsLoading() {
  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <PulseBlock className="h-6 w-28" />
          <PulseBlock className="h-4 w-80" />
        </div>
        <PulseBlock className="h-9 w-32 rounded-xl" />
      </div>

      <Card className="border-indigo-500/20 bg-indigo-950/20">
        <div className="space-y-2">
          <PulseBlock className="h-4 w-32" />
          <PulseBlock className="h-3 w-72" />
        </div>
      </Card>

      {[0, 1, 2, 3].map((section) => (
        <Card key={section}>
          <CardHeader title="Loading settings" description="Preparing saved preferences..." />
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1].map((field) => (
              <div key={field} className="space-y-2">
                <PulseBlock className="h-4 w-28" />
                <PulseBlock className="h-11 w-full" />
                <PulseBlock className="h-3 w-40" />
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}