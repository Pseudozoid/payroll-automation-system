"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

interface DialogContentProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function DialogContent({
  children,
  title,
  description,
  className,
}: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        data-radix-dialog-overlay
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
      />
      <DialogPrimitive.Content
        data-radix-dialog-content
        className={cn(
          "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
          "w-full max-w-lg bg-white rounded-2xl shadow-2xl",
          "focus:outline-none",
          className
        )}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-0">
            <div>
              {title && (
                <DialogPrimitive.Title className="text-base font-semibold text-slate-900">
                  {title}
                </DialogPrimitive.Title>
              )}
              {description && (
                <DialogPrimitive.Description className="mt-1 text-sm text-slate-500">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close className="text-slate-400 hover:text-slate-600 transition-colors mt-0.5">
              <X className="w-5 h-5" />
            </DialogPrimitive.Close>
          </div>
        )}

        {/* Body */}
        <div className="p-6">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
