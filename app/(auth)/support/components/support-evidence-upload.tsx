"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Maximize2,
  FileImage
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { compressToWebP, uploadImage } from "@/lib/upload-image";
import { validateImageFile } from "@/lib/image-compression";
import { toast } from "sonner";
import { useI18n } from "@/hooks/use-i18n";

export interface EvidenceFileItem {
  id: string;
  name: string;
  size: number; // Ukuran file setelah di-resize & compress (bytes)
  originalSize?: number;
  previewUrl: string;
  uploadedUrl?: string;
  status: "uploading" | "success" | "error";
  errorMessage?: string;
}

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function extractFileNameFromUrl(url: string, fallback?: string): string {
  if (!url) return fallback || "";
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;
    const segments = pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1];
    if (last && last.trim()) {
      return decodeURIComponent(last.trim());
    }
  } catch {
    const clean = url.split("?")[0].split("#")[0];
    const segments = clean.split("/").filter(Boolean);
    const last = segments[segments.length - 1];
    if (last && last.trim()) {
      return decodeURIComponent(last.trim());
    }
  }
  return fallback || "";
}

export type SupportEvidenceUploadChangeHandler =
  | React.Dispatch<React.SetStateAction<EvidenceFileItem[]>>
  | ((items: EvidenceFileItem[]) => void);

interface SupportEvidenceUploadProps {
  items: EvidenceFileItem[];
  onChange: SupportEvidenceUploadChangeHandler;
  maxFiles?: number;
  className?: string;
  disabled?: boolean;
  compact?: boolean;
}

export function SupportEvidenceUpload({
  items,
  onChange,
  maxFiles = 5,
  className,
  disabled = false,
  compact = false
}: SupportEvidenceUploadProps) {
  const { t } = useI18n();
  const [isDragging, setIsDragging] = useState(false);
  const [previewItem, setPreviewItem] = useState<{ url: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Helper agar update state selalu atomik & tidak tertimpa saat multi-file diproses bersamaan
  const updateState = useCallback(
    (updater: (prev: EvidenceFileItem[]) => EvidenceFileItem[]) => {
      try {
        (onChange as any)((prev: any) => {
          if (Array.isArray(prev)) {
            return updater(prev);
          }
          return updater(itemsRef.current);
        });
      } catch {
        onChange(updater(itemsRef.current));
      }
    },
    [onChange]
  );

  const processFiles = useCallback(
    async (rawFiles: FileList | File[]) => {
      const filesArray = Array.from(rawFiles);
      if (filesArray.length === 0) return;

      const currentItems = itemsRef.current;
      const availableSlots = maxFiles - currentItems.length;
      if (availableSlots <= 0) {
        toast.error(t("support.evidence.maxReached", { max: maxFiles }));
        return;
      }

      const filesToProcess = filesArray.slice(0, availableSlots);
      if (filesArray.length > availableSlots) {
        toast.warning(
          t("support.evidence.maxSlotWarning", { slots: availableSlots, max: maxFiles })
        );
      }

      // 1. Validasi & siapkan initial item untuk seluruh file sekaligus
      const validFiles: { file: File; initialItem: EvidenceFileItem }[] = [];

      for (const file of filesToProcess) {
        const validation = validateImageFile(file);
        if (!validation.valid) {
          toast.error(`${file.name}: ${validation.error || t("support.evidence.invalidFile")}`);
          continue;
        }

        const tempId = `evidence-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        validFiles.push({
          file,
          initialItem: {
            id: tempId,
            name: file.name,
            size: file.size,
            originalSize: file.size,
            previewUrl: URL.createObjectURL(file),
            status: "uploading"
          }
        });
      }

      if (validFiles.length === 0) return;

      // 2. Tambahkan semua file valid sekaligus ke state agar tidak saling menimpa
      const initialItems = validFiles.map((vf) => vf.initialItem);
      updateState((prev) => [...prev, ...initialItems]);

      // Helper untuk mengupdate 1 file tertentu berdasarkan ID tanpa mempengaruhi file lain
      const updateSpecificItem = (id: string, patch: Partial<EvidenceFileItem>) => {
        updateState((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
        );
      };

      // 3. Jalankan kompresi dan upload secara paralel untuk setiap file
      validFiles.forEach(async ({ file, initialItem }) => {
        try {
          // Kompresi & Resize ke WebP
          const compressedWebP = await compressToWebP(file, 0.82, 1920, 1080);
          const compressedUrl = URL.createObjectURL(compressedWebP);

          // Update info kompresi
          updateSpecificItem(initialItem.id, {
            size: compressedWebP.size,
            previewUrl: compressedUrl
          });

          // Upload file terkompresi ke Supabase Storage
          const remoteUrl = await uploadImage(compressedWebP, "quiz_images");

          if (remoteUrl) {
            const remoteName = extractFileNameFromUrl(remoteUrl, file.name);
            updateSpecificItem(initialItem.id, {
              name: remoteName,
              size: compressedWebP.size,
              previewUrl: remoteUrl,
              uploadedUrl: remoteUrl,
              status: "success"
            });
          } else {
            throw new Error(t("support.evidence.uploadErrorServer"));
          }
        } catch (err: unknown) {
          console.error("Gagal memproses/mengunggah gambar:", err);
          const msg = err instanceof Error ? err.message : t("support.evidence.uploadFailed");
          updateSpecificItem(initialItem.id, {
            status: "error",
            errorMessage: msg
          });
          toast.error(t("support.evidence.uploadFailedFor", { name: file.name }));
        }
      });
    },
    [maxFiles, t, updateState]
  );

  // Desktop Drag & Drop Handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      setIsDragging(false);
      dragCounterRef.current = 0;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    // Reset file input agar bisa memilih ulang file yang sama jika dihapus
    e.target.value = "";
  };

  const removeItem = (id: string) => {
    updateState((prev) => prev.filter((item) => item.id !== id));
  };

  const isFull = items.length >= maxFiles;

  return (
    <div className={cn("w-full min-w-0", compact ? "space-y-2" : "space-y-3", className)}>
      {/* Dropzone Area (Mendukung Desktop Drag & Drop dan Klik Pemilihan) */}
      {!isFull && (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={cn(
            "relative group w-full min-w-0 rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer flex",
            compact
              ? "p-2.5 flex-row items-center justify-start gap-3 text-left"
              : "p-4 flex-col items-center justify-center text-center",
            isDragging
              ? "border-orange-500 bg-orange-500/10 dark:bg-orange-500/15 scale-[1.005]"
              : "border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 hover:bg-zinc-100/70 dark:bg-zinc-900/50 dark:hover:bg-zinc-800/60 hover:border-orange-400 dark:hover:border-orange-500",
            disabled && "opacity-50 cursor-not-allowed"
          )}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleFileChange}
            disabled={disabled}
            className="sr-only"
            suppressHydrationWarning
          />
          {compact ? (
            <>
              <div
                className={cn(
                  "w-8 h-8 shrink-0 rounded-full flex items-center justify-center transition-colors",
                  isDragging
                    ? "bg-orange-500 text-white animate-bounce"
                    : "bg-zinc-200/80 dark:bg-zinc-800 text-muted-foreground group-hover:text-orange-500 group-hover:bg-orange-500/10"
                )}>
                <Upload className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">
                  {isDragging
                    ? t("support.evidence.dropActive")
                    : t("support.evidence.dropIdle")}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {t("support.evidence.dropHint", { max: maxFiles })}
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1.5 py-1">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                  isDragging
                    ? "bg-orange-500 text-white animate-bounce"
                    : "bg-zinc-200/80 dark:bg-zinc-800 text-muted-foreground group-hover:text-orange-500 group-hover:bg-orange-500/10"
                )}>
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-foreground">
                {isDragging
                  ? t("support.evidence.dropActive")
                  : t("support.evidence.dropIdle")}
              </p>
              <p className="text-[11px] text-muted-foreground max-w-sm">
                {t("support.evidence.dropHint", { max: maxFiles })}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Daftar Kartu Lampiran Bukti (Card Lebar Horizontal) */}
      {items.length > 0 && (
        <div className="w-full min-w-0 space-y-2">
          {items.map((item) => {
            const isUploading = item.status === "uploading";
            const isSuccess = item.status === "success";
            const isError = item.status === "error";

            return (
              <div
                key={item.id}
                onClick={() => setPreviewItem({ url: item.previewUrl, name: item.name })}
                className={cn(
                  "group relative w-full min-w-0 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-card hover:bg-zinc-50 dark:hover:bg-zinc-900/70 flex items-center justify-between gap-2.5 shadow-2xs hover:border-orange-500/40 transition-all cursor-pointer",
                  compact ? "p-2" : "p-2.5 sm:p-3"
                )}>
                {/* Bagian Kiri: Status Icon (Check/Alert/Spinner), Nama File, & Ukuran Terkompresi */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="shrink-0 flex items-center justify-center">
                    {isUploading && (
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    )}
                    {isSuccess && (
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                    {isError && (
                      <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-xs sm:text-sm font-semibold text-foreground truncate pr-2" title={item.name}>
                      {item.name}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="font-medium text-foreground/80">
                        {formatBytes(item.size)}
                      </span>
                      {isError && <span className="text-red-500">{item.errorMessage || t("support.evidence.uploadFailed")}</span>}
                    </div>
                  </div>
                </div>

                {/* Bagian Kanan: Preview Gambar Kecil + Tombol Hapus 'X' */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <div
                    className={cn(
                      "relative rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 group/thumb shrink-0 flex items-center justify-center",
                      compact ? "w-10 h-10" : "w-12 h-12 sm:w-14 sm:h-14"
                    )}
                    title={t("support.history.clickToEnlarge")}>
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform group-hover/thumb:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/30 transition-colors flex items-center justify-center">
                      <Maximize2 className="w-3.5 h-3.5 text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity" />
                    </div>
                  </div>

                  {/* Tombol Hapus: Menggunakan ikon 'X' saja */}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(item.id);
                      }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
                      title={t("support.evidence.removeTooltip")}>
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Zoom Gambar Penuh (Langsung Gambar Ukuran Besar & Tombol 'X' di Luar Gambar) */}
      <Dialog
        open={!!previewItem}
        onOpenChange={(open) => {
          if (!open) setPreviewItem(null);
        }}>
        <DialogContent
          showCloseIcon={false}
          className="p-0 border-0 bg-transparent shadow-none max-w-fit max-h-[96vh] w-auto flex items-center justify-center overflow-visible focus:outline-hidden">
          <VisuallyHidden>
            <DialogTitle>
              {previewItem?.name || t("support.evidence.previewModalTitle") || "Preview Bukti"}
            </DialogTitle>
          </VisuallyHidden>
          <div className="relative max-w-[94vw] max-h-[90vh] flex items-center justify-center">
            <button
              type="button"
              onClick={() => setPreviewItem(null)}
              className="absolute -top-11 right-0 sm:-top-12 sm:-right-4 z-50 flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-2xl border border-white/20 cursor-pointer"
              title={t("common.close") || "Close"}>
              <X className="w-5 h-5" />
              <span className="sr-only">{t("common.close") || "Close"}</span>
            </button>
            {previewItem?.url && (
              <img
                src={previewItem.url}
                alt={previewItem.name || t("support.evidence.previewModalTitle") || "Preview Bukti Penuh"}
                className="max-w-[92vw] max-h-[88vh] object-contain rounded-xl shadow-2xl select-none"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Komponen Card Lampiran Bukti untuk Tampilan Read-Only (misal di Detail Riwayat Laporan)
 */
export function EvidenceCardReadonly({
  url,
  index,
  onZoom
}: {
  url: string;
  index: number;
  onZoom: (url: string, title: string) => void;
}) {
  const { t } = useI18n();
  const fallbackTitle = t("support.evidence.itemTitle", { index: index + 1 });
  const fileName = extractFileNameFromUrl(url, fallbackTitle);

  return (
    <div
      onClick={() => onZoom(url, fileName)}
      className="group w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-card hover:bg-zinc-50 dark:hover:bg-zinc-900/70 p-2.5 sm:p-3 flex items-center justify-between gap-3 shadow-2xs hover:border-orange-500/40 transition-all cursor-pointer">
      {/* Sisi Kiri: Icon Sukses & Nama File Asli (misal: dea6a262-6c21-4317-b36a-f8dbe0237c95.webp) */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1 space-y-0.5">
          <p
            className="text-xs sm:text-sm font-semibold text-foreground truncate pr-2"
            title={fileName}>
            {fileName}
          </p>
        </div>
      </div>

      {/* Sisi Kanan: Mini Thumbnail dengan Hover Maximize */}
      <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 group/thumb shrink-0 flex items-center justify-center">
        <img
          src={url}
          alt={fileName}
          className="w-full h-full object-cover transition-transform group-hover/thumb:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/30 transition-colors flex items-center justify-center">
          <Maximize2 className="w-3.5 h-3.5 text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity" />
        </div>
      </div>
    </div>
  );
}

