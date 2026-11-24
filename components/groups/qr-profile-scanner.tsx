"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Camera, RefreshCw, Upload, Sparkles, AlertCircle, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface QrScannerProps {
  onScanSuccess: (username: string) => Promise<boolean | void> | boolean | void;
  onClose?: () => void;
  successMessage?: string | null;
  onDismissSuccess?: () => void;
}

// Fungsi pembantu global untuk mematikan semua MediaStream video di browser secara aman
export function stopAllVideoStreams() {
  try {
    const allVideos = document.querySelectorAll("video");
    allVideos.forEach((video) => {
      const stream = (video as HTMLVideoElement).srcObject as MediaStream;
      if (stream && stream.getTracks) {
        stream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch {}
        });
      }
      try {
        (video as HTMLVideoElement).srcObject = null;
      } catch {}
    });
  } catch (e) {
    console.warn("stopAllVideoStreams error:", e);
  }
}

export function QrProfileScanner({
  onScanSuccess,
  successMessage,
  onDismissSuccess
}: QrScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<any>(null);
  const isMountedRef = useRef(true);
  const isProcessingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse username dari berbagai format QR GameForSmart
  const parseUsernameFromQR = (rawText: string): string => {
    const text = rawText.trim();
    const profileMatch = text.match(/\/profile\/([a-zA-Z0-9_\-\.]+)/);
    if (profileMatch && profileMatch[1]) {
      return profileMatch[1];
    }

    try {
      const parsed = JSON.parse(text);
      if (parsed.username) return parsed.username;
    } catch {}

    const uriMatch = text.match(/user\/([a-zA-Z0-9_\-\.]+)/);
    if (uriMatch && uriMatch[1]) {
      return uriMatch[1];
    }

    return text.replace(/^@/, "");
  };

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    if (scanner) {
      scannerRef.current = null;
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
      } catch (err: any) {
        // Abaikan abort/interrupted exception saat stop normal
      }

      try {
        await scanner.clear();
      } catch {}
    }

    stopAllVideoStreams();

    if (isMountedRef.current) {
      setIsScanning(false);
    }
  }, []);

  const handleDetected = useCallback(
    async (data: string) => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      const username = parseUsernameFromQR(data);
      try {
        await onScanSuccess(username);
      } finally {
        setTimeout(() => {
          if (isMountedRef.current) {
            isProcessingRef.current = false;
          }
        }, 1200);
      }
    },
    [onScanSuccess]
  );

  const startScanner = async () => {
    if (!isMountedRef.current) return;
    setCameraError(null);

    // Patch global play() pada container target untuk menangkap AbortError dari browser
    try {
      const originalPlay = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () {
        const promise = originalPlay.apply(this, arguments as any);
        if (promise !== undefined) {
          promise.catch((error) => {
            if (error?.name === "AbortError" || error?.message?.includes("interrupted")) {
              // Menelan AbortError yang disebabkan oleh media element dilepas dari DOM
              return;
            }
            console.debug("Video play error caught safely:", error);
          });
        }
        return promise;
      };
    } catch {}

    try {
      const { Html5Qrcode } = await import("html5-qrcode");

      if (!isMountedRef.current) return;

      const container = document.getElementById("qr-reader-target");
      if (!container || !isMountedRef.current) {
        return;
      }

      // Bersihkan instance lama jika ada
      if (scannerRef.current) {
        await stopScanner();
      }

      const html5QrCode = new Html5Qrcode("qr-reader-target", {
        verbose: false
      });
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0
        },
        (decodedText: string) => {
          handleDetected(decodedText);
        },
        () => {
          // ignore scan frame errors
        }
      );

      if (isMountedRef.current) {
        setIsScanning(true);
      } else {
        await stopScanner();
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (
        !isMountedRef.current ||
        err?.name === "AbortError" ||
        msg.includes("interrupted") ||
        msg.includes("abort") ||
        msg.includes("stopped")
      ) {
        stopAllVideoStreams();
      } else {
        console.warn("Camera start warning:", err);
        if (isMountedRef.current) {
          setIsScanning(false);
          setCameraError(
            "Kamera tidak tersedia atau izin akses ditolak. Anda dapat menggunakan upload foto QR atau simulasi di bawah."
          );
        }
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    // Gunakan timeout kecil agar DOM element stabil sebelum kamera mengikat surface
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        startScanner();
      }
    }, 100);

    return () => {
      isMountedRef.current = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-file-dummy", { verbose: false });
      const result = await scanner.scanFile(file, true);
      handleDetected(result);
    } catch {
      toast.error("Tidak dapat membaca QR code dari gambar tersebut.");
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 w-full">
      {/* Viewport Kamera / Scanner Area */}
      <div className="relative w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden bg-slate-900 border-2 border-orange-500/30 flex items-center justify-center shadow-inner">
        <div id="qr-reader-target" className="w-full h-full" />
        <div id="qr-file-dummy" className="hidden" />

        {/* Reticle / Target Scanner Overlay */}
        {isScanning && !cameraError && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-48 h-48 border-2 border-orange-500 rounded-xl relative animate-pulse shadow-[0_0_15px_rgba(249,115,22,0.5)]">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-orange-400 -mt-0.5 -ml-0.5" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-orange-400 -mt-0.5 -mr-0.5" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-orange-400 -mb-0.5 -ml-0.5" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-orange-400 -mb-0.5 -mr-0.5" />
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent absolute top-1/2 -translate-y-1/2 animate-bounce" />
            </div>
          </div>
        )}

        {/* Fallback / Error Alert */}
        {cameraError && (
          <div className="p-4 text-center z-10 space-y-3 bg-slate-900/90 text-white">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
            <p className="text-xs text-slate-300 leading-relaxed">{cameraError}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={startScanner}
              className="text-xs bg-slate-800 text-white border-slate-700 hover:bg-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Coba Lagi
            </Button>
          </div>
        )}

        {/* POP UP NOTIFIKASI SUKSES 1 DETIK & DAPAT DITUTUP LANGSUNG */}
        {successMessage && (
          <div
            onClick={onDismissSuccess}
            className="absolute inset-x-3 top-3 z-30 p-3 rounded-2xl bg-emerald-600/95 text-white shadow-xl backdrop-blur-md flex items-center justify-between gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200 cursor-pointer border border-emerald-400/40"
          >
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="w-5 h-5 text-white shrink-0 animate-bounce" />
              <p className="text-xs font-semibold leading-tight truncate">
                {successMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDismissSuccess?.();
              }}
              className="p-1 rounded-full hover:bg-emerald-700/80 transition-colors text-white/90 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Aksi Tambahan: Upload File QR & Kontrol Kamera */}
      <div className="w-full flex items-center justify-between gap-2 pt-2 border-t">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-1/2 text-xs"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload Foto QR
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-1/2 text-xs"
          onClick={isScanning ? stopScanner : startScanner}
        >
          <Camera className="w-3.5 h-3.5 mr-1.5" /> {isScanning ? "Jeda Kamera" : "Aktifkan Kamera"}
        </Button>
      </div>

      {/* Simulasi Cepat QR Profil Siswa */}
      <div className="w-full space-y-2 bg-muted/40 p-3 rounded-xl border">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-orange-500" />
          <span>Simulasi Scan QR Profil Siswa (Scan Berkelanjutan):</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { name: "Budi Santoso", user: "budi_santoso" },
            { name: "Siti Rahma", user: "siti_rahma" },
            { name: "Ahmad Fauzi", user: "ahmad_fauzi" },
            { name: "Dian Permata", user: "dian_permata" },
            { name: "Reza Aditya", user: "reza_aditya" }
          ].map((item) => (
            <button
              key={item.user}
              type="button"
              onClick={() => handleDetected(`/profile/${item.user}`)}
              className="text-xs px-2.5 py-1 bg-background hover:bg-orange-50 dark:hover:bg-orange-950/40 text-foreground border rounded-lg transition-colors font-mono"
            >
              @{item.user}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
