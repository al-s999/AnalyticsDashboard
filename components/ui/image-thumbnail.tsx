"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ImageThumbnailProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export function ImageThumbnail({
  src,
  alt,
  width = 24,
  height = 24,
  className,
}: ImageThumbnailProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div
        className={cn(
          "rounded overflow-hidden flex-shrink-0 border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:opacity-80 transition-opacity",
          className
        )}
        onClick={(e) => {
          e.stopPropagation();
          setShowModal(true);
        }}
      >
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="object-cover w-full h-full"
        />
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] p-0">
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
