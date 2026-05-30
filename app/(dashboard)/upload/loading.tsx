import { Card } from "@/components/ui/card";

function PulseBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-800/70 ${className}`} />;
}

export default function UploadLoading() {
  return (
    <div className="max-w-4xl space-y-6">
      <div className="space-y-2">
        <PulseBlock className="h-6 w-48" />
        <PulseBlock className="h-4 w-96 max-w-full" />
      </div>

      <Card className="space-y-4">
        <div className="space-y-2">
          <PulseBlock className="h-4 w-56" />
          <PulseBlock className="h-3 w-full max-w-2xl" />
          <PulseBlock className="h-3 w-80" />
        </div>
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/40 px-6 py-10">
          <div className="mx-auto flex max-w-md flex-col items-center space-y-3 text-center">
            <PulseBlock className="h-10 w-10 rounded-full" />
            <PulseBlock className="h-4 w-44" />
            <PulseBlock className="h-3 w-64" />
          </div>
        </div>
      </Card>
    </div>
  );
}