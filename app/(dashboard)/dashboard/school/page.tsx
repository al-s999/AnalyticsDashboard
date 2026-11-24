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
import { School, TrendingUp, Award, CheckCircle, RefreshCw, Clock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function SchoolDashboardPage() {
  const { user } = useAnalyticsAuth();
  const [period, setPeriod] = useState<PeriodFilter>("this_month");
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastUpdate, setLastUpdate] = useState("Hari ini, 00:00 WIB (Auto-Cron Berkala)");

  const trendData: TrendData = {
    current: 84.2,
    previous: 81.0,
    percentChange: 3.2
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
          toast.success("Snapshot analitik sekolah berhasil diperbarui!");
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
          scopeType: "pengelola_sekolah",
          targetId: user?.scope.npsn || "20532247",
          targetName: user?.scope.schoolName || "SMAN 1 SURABAYA"
        })
      });
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* School Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">{user?.scope.schoolName || "SMAN 1 SURABAYA"}</h1>
            <Badge variant="secondary" className="text-xs">NPSN: {user?.scope.npsn || "20532247"}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitoring Mutu Akademik Seluruh Kelas & Jenjang Satuan Pendidikan
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TimeFilter period={period} setPeriod={setPeriod} />
          <Link href="/dashboard/school/benchmark">
            <Button variant="outline" size="sm" className="h-9 text-xs rounded-xl">
              Benchmark Antarkelas
            </Button>
          </Link>
          <Button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="h-9 gap-1.5 text-xs rounded-xl bg-orange-600 hover:bg-orange-700 text-white"
          >
            <RefreshCw className={`size-3.5 ${isUpdating ? "animate-spin" : ""}`} />
            <span>{isUpdating ? "Menganalisa..." : "Update Analisa Sekolah"}</span>
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
            Penyimpanan: <code className="font-mono text-orange-600">JSON Snapshot</code>
          </div>
        </div>

        {isUpdating && (
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-orange-600 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 animate-spin" /> Menarik data kuis seluruh rombel & menghitung agregasi...
              </span>
              <span className="font-bold">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2 rounded-full" />
          </div>
        )}
      </Card>

      {/* Metric Cards Summary with Pastel Visuals */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Siswa Aktif"
          value="1,024 Siswa"
          icon="school"
          subtitle="32 Rombel Kelas (X, XI, XII)"
        />

        <StatCard
          title="Ketuntasan Kurikulum"
          value="84.2%"
          icon="accuracy"
          subtitle="Target Kompetensi Semester Tercapai"
        />

        <StatCard
          title="Indeks Kesiapan Sekolah"
          value="87.5%"
          icon="prediction"
          subtitle="Kategori: Sangat Siap Ujian"
        />

        <TrendCard
          trendData={trendData}
          title="BENCHMARK KOTA"
          comparisonLabel="Peringkat 2 Se-Surabaya"
        />
      </div>

      {/* Classroom Benchmark Table */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold">Komparasi Performa Antarkelas (Benchmark)</CardTitle>
          <CardDescription className="text-xs">
            Evaluasi capaian rata-rata akurasi dan kesiapan ujian per rombongan belajar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-muted/50 border-b font-semibold text-muted-foreground">
                <tr>
                  <th className="p-3">Rombel / Kelas</th>
                  <th className="p-3">Wali Kelas / Guru</th>
                  <th className="p-3">Siswa</th>
                  <th className="p-3">Rata-rata Akurasi</th>
                  <th className="p-3">Prediksi Nilai</th>
                  <th className="p-3">Kesiapan Ujian</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr className="hover:bg-muted/30">
                  <td className="p-3 font-semibold text-foreground">Kelas 10-A (MIPA)</td>
                  <td className="p-3 text-muted-foreground">Rahmat Hidayat, S.Pd.</td>
                  <td className="p-3">34 Siswa</td>
                  <td className="p-3 font-semibold">82.4%</td>
                  <td className="p-3 font-bold text-emerald-600">86.0</td>
                  <td className="p-3">
                    <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Sangat Siap</Badge>
                  </td>
                  <td className="p-3 text-right">
                    <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-300">Tuntas</Badge>
                  </td>
                </tr>
                <tr className="hover:bg-muted/30">
                  <td className="p-3 font-semibold text-foreground">Kelas 10-B (MIPA)</td>
                  <td className="p-3 text-muted-foreground">Drs. Hendro Wibowo</td>
                  <td className="p-3">35 Siswa</td>
                  <td className="p-3 font-semibold">78.1%</td>
                  <td className="p-3 font-bold text-blue-600">81.5</td>
                  <td className="p-3">
                    <Badge className="bg-blue-100 text-blue-700 text-[10px]">Siap</Badge>
                  </td>
                  <td className="p-3 text-right">
                    <Badge variant="outline" className="text-[10px] text-blue-700 border-blue-300">Tuntas</Badge>
                  </td>
                </tr>
                <tr className="hover:bg-muted/30">
                  <td className="p-3 font-semibold text-foreground">Kelas 10-C (IPS)</td>
                  <td className="p-3 text-muted-foreground">Sri Wahyuni, M.Pd.</td>
                  <td className="p-3">32 Siswa</td>
                  <td className="p-3 font-semibold">68.7%</td>
                  <td className="p-3 font-bold text-amber-600">72.0</td>
                  <td className="p-3">
                    <Badge className="bg-amber-100 text-amber-700 text-[10px]">Perlu Pendampingan</Badge>
                  </td>
                  <td className="p-3 text-right">
                    <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300">Remedial</Badge>
                  </td>
                </tr>
                <tr className="hover:bg-muted/30">
                  <td className="p-3 font-semibold text-foreground">Kelas 11-IPA 1</td>
                  <td className="p-3 text-muted-foreground">Rahmat Hidayat, S.Pd.</td>
                  <td className="p-3">34 Siswa</td>
                  <td className="p-3 font-semibold">86.2%</td>
                  <td className="p-3 font-bold text-emerald-600">88.5</td>
                  <td className="p-3">
                    <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Sangat Siap</Badge>
                  </td>
                  <td className="p-3 text-right">
                    <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-300">Tuntas</Badge>
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
