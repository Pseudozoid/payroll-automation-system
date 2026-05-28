"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

interface UploadDeleteActionProps {
  uploadId?: string;
  clearAll?: boolean;
  uploadCount?: number;
  buttonLabel: string;
  dialogTitle: string;
  dialogDescription: string;
  confirmLabel?: string;
  redirectTo?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function UploadDeleteAction({
  uploadId,
  clearAll = false,
  uploadCount,
  buttonLabel,
  dialogTitle,
  dialogDescription,
  confirmLabel,
  redirectTo,
  className,
  size = "sm",
}: UploadDeleteActionProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endpoint = clearAll ? "/api/payroll" : `/api/payroll/${uploadId}`;

  async function handleDelete() {
    if (!clearAll && !uploadId) {
      setError("Missing upload id.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error ?? "Delete failed.");
      }

      setOpen(false);

      if (redirectTo) {
        router.replace(redirectTo);
        return;
      }

      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="danger"
          size={size}
          icon={<Trash2 className="w-3.5 h-3.5" />}
          className={className}
        >
          {buttonLabel}
        </Button>
      </DialogTrigger>

      <DialogContent title={dialogTitle} description={dialogDescription}>
        <div className="space-y-4">
          <div className="rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-100">
            {clearAll
              ? `This will permanently delete ${uploadCount ?? 0} payroll upload${(uploadCount ?? 0) === 1 ? "" : "s"} and all related salary records, slips, and email logs.`
              : "This will permanently delete the upload and all related salary records, slips, and email logs."}
          </div>

          {error && (
            <div className="rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <DialogClose asChild>
              <Button variant="secondary" size="sm" disabled={loading}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="danger"
              size="sm"
              loading={loading}
              onClick={handleDelete}
            >
              {confirmLabel ?? buttonLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}