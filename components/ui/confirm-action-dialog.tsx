"use client";

import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

export interface ConfirmActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "warning";
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Iya",
  cancelLabel = "Batal",
  variant = "destructive",
  isLoading = false,
  onConfirm
}: ConfirmActionDialogProps) {
  const isDestructive = variant === "destructive";

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isLoading && onOpenChange(nextOpen)}>
      <DialogContent className="sm:max-w-[380px] p-4 rounded-2xl gap-3">
        <DialogHeader className="text-left min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                isDestructive
                  ? "bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400"
                  : "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
              }`}
            >
              <AlertTriangle className="size-4" />
            </div>
            <DialogTitle className="text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-50 pr-6 truncate">
              {title}
            </DialogTitle>
          </div>
        </DialogHeader>

        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>

        <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 w-full min-w-0">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() => onOpenChange(false)}
            className="flex-1 sm:flex-initial sm:min-w-[80px] text-xs h-8 rounded-xl"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={isDestructive ? "destructive" : "default"}
            disabled={isLoading}
            onClick={onConfirm}
            className={`flex-1 sm:flex-initial sm:min-w-[80px] text-xs font-semibold shadow-xs h-8 rounded-xl ${
              isDestructive
                ? ""
                : "bg-orange-600 hover:bg-orange-700 text-white"
            }`}
          >
            {isLoading && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

