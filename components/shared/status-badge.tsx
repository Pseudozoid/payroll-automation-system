import { Badge } from "@/components/ui/badge";
import type { SlipStatus, EmailStatus, UploadStatus } from "@/types";

export function SlipStatusBadge({ status }: { status: SlipStatus }) {
  const config = {
    GENERATED: { label: "Generated",  variant: "info"    as const, dot: true },
    EMAILED:   { label: "Emailed",    variant: "success" as const, dot: true },
    FAILED:    { label: "Failed",     variant: "danger"  as const, dot: true },
  }[status];

  return <Badge variant={config.variant} dot={config.dot}>{config.label}</Badge>;
}

export function EmailStatusBadge({ status }: { status: EmailStatus }) {
  const config = {
    PENDING: { label: "Pending", variant: "warning" as const },
    SENT:    { label: "Sent",    variant: "success" as const },
    FAILED:  { label: "Failed",  variant: "danger"  as const },
  }[status];

  return <Badge variant={config.variant} dot>{config.label}</Badge>;
}

export function UploadStatusBadge({ status }: { status: UploadStatus }) {
  const config = {
    PENDING:    { label: "Pending",    variant: "warning" as const },
    PROCESSING: { label: "Processing", variant: "info"    as const },
    DONE:       { label: "Done",       variant: "success" as const },
    FAILED:     { label: "Failed",     variant: "danger"  as const },
  }[status];

  return <Badge variant={config.variant} dot>{config.label}</Badge>;
}
