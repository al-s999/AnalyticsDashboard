"use client";

import { useState, useId } from "react";
import Image from "next/image";
import { Button } from "./button";
import { Trash2, Upload, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { validateImageFile, createCompressedPreview } from "@/lib/image-compression";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CompactImageUploadProps {
  imageUrl: string | null;
  onImageChange: (url: string | null) => void;
  className?: string;
}

/**
 * CompactImageUpload – deferred upload mode.
 * Stores a data:URL preview locally. The actual upload to Supabase
 * happens when the user presses Save (handled by the parent hook).
 */
export default function CompactImageUpload({
  imageUrl,
  onImageChange,
  className,
}: CompactImageUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const reactId = useId();
  const uniqueId = `image-upload-${reactId}`;
  const [showImageModal, setShowImageModal] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || "Invalid file");
      return;
    }

    try {
      // Create a data URL preview — no upload yet
      const dataUrl = await createCompressedPreview(file, {
        maxWidth: 800,
        maxHeight: 600,
        quality: 0.85,
      });
      onImageChange(dataUrl);
    } catch (processingError) {
      console.error("Error processing image:", processingError);
      setError("Failed to process image. Please try again.");
    }
  };

  const handleRemoveImage = () => {
    onImageChange(null);
    setError(null);
  };

  // Check if it's a data URL or regular URL
  const isDataUrl = imageUrl?.startsWith("data:");
  const isValidUrl = imageUrl && (
    isDataUrl || 
    imageUrl.startsWith("http://") || 
    imageUrl.startsWith("https://") ||
    imageUrl.startsWith("/")
  );

  return (
    <div className={cn("relative", className)}>
      {isValidUrl ? (
        <div className="relative group h-full">
          <div 
            className="relative w-full h-full min-h-[64px] rounded-lg overflow-hidden border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 cursor-pointer"
            onClick={() => setShowImageModal(true)}
          >
            {/* Use <img> for data URLs to avoid next/image hostname restriction */}
            {isDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt="Preview"
                className="object-cover w-full h-full transition-transform group-hover:scale-110"
              />
            ) : (
              <Image
                src={imageUrl}
                alt="Answer image"
                fill
                className="object-cover transition-transform group-hover:scale-110"
                unoptimized
              />
            )}
            {/* Hover overlay with maximize icon */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <Maximize2 className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {/* Delete button */}
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="destructive"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage();
                }}
                className="h-6 w-6 p-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative h-full">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="sr-only"
            id={uniqueId}
            suppressHydrationWarning
          />
          <label
            htmlFor={uniqueId}
            className={cn(
              "block w-full h-full min-h-[64px] rounded-lg cursor-pointer transition-colors border-2 border-dashed",
              "border-zinc-300 hover:border-orange-400 dark:border-zinc-700 dark:hover:border-orange-500",
              "bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800",
              "flex flex-col items-center justify-center p-4"
            )}
          >
            <div className="flex flex-col items-center space-y-2 text-zinc-500 dark:text-zinc-400">
              <Upload className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
              <span className="text-xs font-medium">Tambah Gambar</span>
            </div>
          </label>
        </div>
      )}

      {error && <div className="text-xs text-red-500 mt-1">{error}</div>}

      {/* Image Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Preview Gambar</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-[70vh] bg-gray-100 dark:bg-gray-900">
            {isDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl!}
                alt="Preview"
                className="object-contain w-full h-full"
              />
            ) : (
              <Image
                src={imageUrl!}
                alt="Preview"
                fill
                className="object-contain"
                unoptimized
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
