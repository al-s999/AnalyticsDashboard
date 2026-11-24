"use client";

import { useState } from "react";
import { Maximize2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ImageViewerModalProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
}

export function ImageViewerModal({
  src,
  alt,
  className,
  containerClassName,
}: ImageViewerModalProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {/* Clickable Image */}
      <div
        className={cn(
          "relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer group",
          containerClassName
        )}
        onClick={() => setShowModal(true)}
      >
        <img
          src={src}
          alt={alt}
          className={cn(
            "w-full max-h-60 object-contain bg-slate-50 dark:bg-slate-800/50 transition-transform group-hover:scale-105",
            className
          )}
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Maximize2 className="h-8 w-8 text-white drop-shadow-lg" />
          </div>
        </div>
      </div>

      {/* Modal — close icon comes only from DialogContent (avoid duplicate X) */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-5xl w-full max-h-[95vh] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2 pr-12">
            <DialogTitle className="text-lg font-semibold">{alt}</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-[80vh] bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
