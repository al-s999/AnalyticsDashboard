"use client";

import React, { useState } from "react";
import { useAnalyticsAuth } from "@/contexts/analytics-auth-context";
import {
  StatCard,
  TrendCard,
  TimeFilter
} from "@/components/dashboard";
import type { PeriodFilter, TrendData } from "@/types/evaluation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Landmark, School, CheckCircle2, AlertOctagon, TrendingUp, RefreshCw, MapPin, Clock, Sparkles } from "lucide-react";
import { ROLE_LABELS } from "@/types/auth-roles";
import { toast } from "sonner";
import Link from "next/link";

export default function DinasDashboardPage() {
  const { user, role } = useAnalyticsAuth();
  const [period, setPeriod] = useState<PeriodFilter>("this_month");
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastUpdate, setLastUpdate] = useState("Hari ini, 00:00 WIB (Auto-Cron Berkala)");

  const trendData: TrendData = {
    current: 79.8,
    previous: 76.5,
    percentChange: 3.3
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUpdating(false);
          const now = new Date();
          setLastUpdate(`Hari ini, ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")} WIB`);
          toast.success("Snapshot agregasi dinas berhasil diperbarui!");
          return 100;
        }
        return prev + 25;
      });
    }, 300);

    try {
      await fetch("/api/analytics/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scopeType: role,
          targetId: user?.scope.city || user?.scope.province || "dinas-wilayah",
          targetName: user?.fullname || "Dinas Pendidikan"
        })
      });
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Regional Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
              {role === "dinas_nasional" ? "Dasbor Analitik Nasional" : `Dasbor Wilayah: ${user?.scope.city || user?.scope.province}`}
            </h1>
            <Badge variant="outline" className="text-xs border-blue-300 text-blue-800 bg-blue-50/50 dark:bg-blue-950 dark:text-blue-300">
              {ROLE_LABELS[role].badge}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pemetaan Mutu Pendidikan & Capaian Standar Kompetensi Satuan Pendidikan Berbasis NPSN
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TimeFilter period={period} setPeriod={setPeriod} />
          <Link href="/dashboard/dinas/readiness">
            <Button variant="outline" size="sm" className="h-9 text-xs rounded-xl">
              Kesiapan Ujian Wilayah
            </Button>
          </Link>
          <Button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="h-9 gap-1.5 text-xs rounded-xl bg-orange-600 hover:bg-orange-700 text-white"
          >
            <RefreshCw className={`size-3.5 ${isUpdating ? "animate-spin" : ""}`} />
            <span>{isUpdating ? "Menganalisa..." : "Update Agregasi Wilayah"}</span>
          </Button>
        </div>
      </div>

      {/* Snapshot Status & Progress Bar */}
      <Card className="rounded-2xl border bg-card/60 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4 text-orange-500" />
            <span>Snapshot Terakhir: <strong className="text-foreground">{lastUpdate}</strong></span>
            <Badge variant="outline" className="text-[10px] bg-background">
              Auto-Cron 00:00 WIB
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            Format Penyimpanan: <code className="font-mono text-orange-600">JSON Snapshot</code>
          </div>
        </div>

        {isUpdating && (
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-orange-600 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 animate-spin" /> Menghitung agregasi mutu antarsekolah di yurisdiksi dinas...
              </span>
              <span className="font-bold">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2 rounded-full" />
          </div>
        )}
      </Card>

      {/* Regional Metric Summary with Pastel Colors */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Sekolah Terpantau"
          value="148 Sekolah"
          icon="school"
          subtitle="Terdaftar dengan NPSN valid"
        />

        <StatCard
          title="Target Kompetensi Tercapai"
          value="112 Sekolah"
          icon="accuracy"
          subtitle="75.6% sekolah tuntas KKM &ge; 75"
        />

        <StatCard
          title="Butuh Intervensi"
          value="36 Sekolah"
          icon="alert"
          subtitle="24.4% prioritas pembinaan dinas"
        />

        <TrendCard
          trendData={trendData}
          title="KESIAPAN WILAYAH"
          comparisonLabel="vs semester lalu"
        />
      </div>

      {/* School Mapping Table */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold">Daftar Satuan Pendidikan Berdasarkan Capaian Mutu</CardTitle>
          <CardDescription className="text-xs">
            Data teragregasi dari sesi kuis GameForSmart siswa per sekolah di bawah naungan dinas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-muted/50 border-b font-semibold text-muted-foreground">
                <tr>
                  <th className="p-3">NPSN</th>
                  <th className="p-3">Nama Satuan Pendidikan</th>
                  <th className="p-3">Jenjang / Status</th>
                  <th className="p-3">Siswa Aktif</th>
                  <th className="p-3">Capaian Target (%)</th>
                  <th className="p-3">Prediksi Nilai</th>
                  <th className="p-3 text-right">Status Evaluasi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr className="hover:bg-muted/30">
                  <td className="p-3 font-mono font-semibold text-orange-600">20532247</td>
                  <td className="p-3 font-medium">SMAN 1 SURABAYA</td>
                  <td className="p-3"><Badge variant="outline" className="text-[10px]">SMA • Negeri</Badge></td>
                  <td className="p-3">1,024</td>
                  <td className="p-3 text-emerald-600 font-semibold">91.2%</td>
                  <td className="p-3 font-bold text-emerald-600">88.4</td>
                  <td className="p-3 text-right">
                    <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Unggulan</Badge>
                  </td>
                </tr>
                <tr className="hover:bg-muted/30">
                  <td className="p-3 font-mono font-semibold text-orange-600">20532249</td>
                  <td className="p-3 font-medium">SMAN 5 SURABAYA</td>
                  <td className="p-3"><Badge variant="outline" className="text-[10px]">SMA • Negeri</Badge></td>
                  <td className="p-3">1,120</td>
                  <td className="p-3 text-emerald-600 font-semibold">94.6%</td>
                  <td className="p-3 font-bold text-emerald-600">90.1</td>
                  <td className="p-3 text-right">
                    <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Unggulan</Badge>
                  </td>
                </tr>
                <tr className="hover:bg-muted/30">
                  <td className="p-3 font-mono font-semibold text-orange-600">20532252</td>
                  <td className="p-3 font-medium">SMAN 2 SURABAYA</td>
                  <td className="p-3"><Badge variant="outline" className="text-[10px]">SMA • Negeri</Badge></td>
                  <td className="p-3">980</td>
                  <td className="p-3 text-emerald-600 font-semibold">89.8%</td>
                  <td className="p-3 font-bold text-emerald-600">86.2</td>
                  <td className="p-3 text-right">
                    <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Unggulan</Badge>
                  </td>
                </tr>
                <tr className="hover:bg-muted/30">
                  <td className="p-3 font-mono font-semibold text-orange-600">20532260</td>
                  <td className="p-3 font-medium">SMAN 9 SURABAYA</td>
                  <td className="p-3"><Badge variant="outline" className="text-[10px]">SMA • Negeri</Badge></td>
                  <td className="p-3">890</td>
                  <td className="p-3 text-amber-600 font-semibold">68.4%</td>
                  <td className="p-3 font-bold text-amber-600">71.0</td>
                  <td className="p-3 text-right">
                    <Badge className="bg-amber-100 text-amber-700 text-[10px]">Butuh Pendampingan</Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
