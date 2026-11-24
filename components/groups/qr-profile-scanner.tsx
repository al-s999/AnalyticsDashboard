"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Camera, RefreshCw, Upload, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface QrScannerProps {
  onScanSuccess: (username: string) => void;
  onClose?: () => void;
}

export function QrProfileScanner({ onScanSuccess }: QrScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detectedText, setDetectedText] = useState<string | null>(null);
  const scannerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse username dari berbagai kemungkinan format QR GameForSmart
  const parseUsernameFromQR = (rawText: string): string => {
    const text = rawText.trim();
    // 1. Format URL: https://.../profile/budi_santoso atau /profile/budi_santoso
    const profileMatch = text.match(/\/profile\/([a-zA-Z0-9_\-\.]+)/);
    if (profileMatch && profileMatch[1]) {
      return profileMatch[1];
    }

    // 2. Format JSON: {"username": "budi_santoso"}
    try {
      const parsed = JSON.parse(text);
      if (parsed.username) return parsed.username;
    } catch {}

    // 3. Format custom URI: gameforsmart://user/budi_santoso
    const uriMatch = text.match(/user\/([a-zA-Z0-9_\-\.]+)/);
    if (uriMatch && uriMatch[1]) {
      return uriMatch[1];
    }

    // 4. Format string username polos: budi_santoso
    return text.replace(/^@/, "");
  };

  const handleDetected = useCallback((data: string) => {
    const username = parseUsernameFromQR(data);
    setDetectedText(username);
    stopScanner();
    toast.success(`QR Profil Siswa Terdeteksi: @${username}`);
    onScanSuccess(username);
  }, [onScanSuccess]);

  const startScanner = async () => {
    setCameraError(null);
    setDetectedText(null);
    try {
      setIsScanning(true);
      const { Html5Qrcode } = await import("html5-qrcode");

      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch {}
      }

      const html5QrCode = new Html5Qrcode("qr-reader-target");
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
    } catch (err: any) {
      console.warn("Camera start warning:", err);
      setIsScanning(false);
      setCameraError(
        "Kamera tidak tersedia atau izin akses ditolak. Anda dapat menggunakan upload foto QR atau simulasi di bawah."
      );
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch {}
    }
    setIsScanning(false);
  };

  useEffect(() => {
    // Autostart scanner saat tab dibuka
    startScanner();
    return () => {
      stopScanner();
    };
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-file-dummy");
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

        {detectedText && (
          <div className="absolute inset-0 bg-emerald-950/90 z-20 flex flex-col items-center justify-center p-4 text-white text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-2 animate-bounce" />
            <span className="text-xs text-emerald-200">Terbaca:</span>
            <span className="text-lg font-bold">@{detectedText}</span>
          </div>
        )}
      </div>

      {/* Aksi Tambahan: Upload File QR */}
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

      {/* Simulasi Cepat QR Profil Siswa (Untuk Kemudahan Testing) */}
      <div className="w-full space-y-2 bg-muted/40 p-3 rounded-xl border">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-orange-500" />
          <span>Simulasi Scan QR Profil GameForSmart:</span>
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

