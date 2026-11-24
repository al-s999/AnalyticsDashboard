"use client";

import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Sparkles,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  Send,
  Zap,
  Target,
  FileCheck2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { GAMEFORSMART_STUDENTS } from "@/data/students-data";
import { toast } from "sonner";

export default function TeacherAnalyticsPage() {
  const [selectedSubject, setSelectedSubject] = useState("Matematika");
  const [selectedGrade, setSelectedGrade] = useState("Kelas 10");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(0);
  const [lastUpdate, setLastUpdate] = useState("Hari ini, 00:00 WIB (Auto-Cron Harian)");

  // Trigger On-Demand AI Analytics Process
  const handleTriggerAnalytics = () => {
    setIsRefreshing(true);
    setRefreshProgress(0);

    const interval = setInterval(() => {
      setRefreshProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRefreshing(false);
          const now = new Date();
          const timeStr = `Hari ini, ${now.getHours().toString().padStart(2, "0")}:${now
            .getMinutes()
            .toString()
            .padStart(2, "0")} WIB (Manual Refresh)`;
          setLastUpdate(timeStr);
          toast.success("Snapshot analitik 3 pilar berhasil diperbarui!");
          return 100;
        }
        return prev + 25;
      });
    }, 350);
  };

  const handleSendRemedialAll = () => {
    toast.success(
      "Paket remedial preskriptif telah dibuat dan dibagikan secara otomatis ke 3 siswa yang belum tuntas!"
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Analitik 3 Pilar Pembelajaran</h1>
            <Badge className="bg-orange-600 hover:bg-orange-700 text-white text-xs">
              AI Powered
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Analisis Deskriptif (kemampuan), Prediktif (estimasi skor & kesiapan ujian), dan Preskriptif (materi belum dikuasai & auto-remedial).
          </p>
        </div>

        {/* Filter Mapel & Jenjang + Refresh Button */}
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-36 h-9 text-xs rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Matematika">Matematika</SelectItem>
              <SelectItem value="Fisika">Fisika</SelectItem>
              <SelectItem value="Kimia">Kimia</SelectItem>
              <SelectItem value="Bahasa Inggris">Bahasa Inggris</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
            <SelectTrigger className="w-32 h-9 text-xs rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Kelas 10">Kelas 10 SMA</SelectItem>
              <SelectItem value="Kelas 11">Kelas 11 SMA</SelectItem>
              <SelectItem value="Kelas 12">Kelas 12 SMA</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={handleTriggerAnalytics}
            disabled={isRefreshing}
            className="h-9 rounded-xl gap-1.5 text-xs bg-orange-600 hover:bg-orange-700 text-white shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? "Menganalisa..." : "Perbarui Analitik"}</span>
          </Button>
        </div>
      </div>

      {/* Snapshot Cache & Progress Bar Status */}
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

        {isRefreshing && (
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-orange-600 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 animate-spin" /> Menarik data kuis & menghitung matriks kesiapan...
              </span>
              <span className="font-bold">{refreshProgress}%</span>
            </div>
            <Progress value={refreshProgress} className="h-2 rounded-full" />
          </div>
        )}
      </Card>

      {/* 3 PILARS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PILAR 1: DESKRIPTIF */}
        <Card className="rounded-2xl border shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="p-5 pb-3 border-b">
              <div className="flex items-center justify-between">
                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 text-[10px]">
                  Pilar 1: Deskriptif
                </Badge>
                <BarChart3 className="w-4 h-4 text-blue-600" />
              </div>
              <CardTitle className="text-base font-bold text-foreground mt-2">
                Analisa Kemampuan Siswa
              </CardTitle>
              <CardDescription className="text-xs">
                Performa penguasaan per topik pada mapel {selectedSubject} {selectedGrade}.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="space-y-3">
                {[
                  { topic: "Aljabar & Persamaan Linear", mastery: 86, color: "bg-emerald-500" },
                  { topic: "Fungsi Eksponen & Akar", mastery: 68, color: "bg-amber-500" },
                  { topic: "Trigonometri Dasar", mastery: 78, color: "bg-blue-500" },
                  { topic: "Pertidaksamaan Rasional", mastery: 54, color: "bg-red-500" },
                  { topic: "Statistika & Peluang", mastery: 82, color: "bg-emerald-500" }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{item.topic}</span>
                      <strong className="text-foreground">{item.mastery}%</strong>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{ width: `${item.mastery}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 text-xs text-blue-900 dark:text-blue-200 space-y-1">
                <strong>Insight Kemampuan:</strong>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Siswa memiliki pemahaman solid pada Aljabar dan Statistika, namun membutuhkan penguatan di konsep Pertidaksamaan Rasional.
                </p>
              </div>
            </CardContent>
          </div>
        </Card>

        {/* PILAR 2: PREDIKTIF */}
        <Card className="rounded-2xl border shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="p-5 pb-3 border-b">
              <div className="flex items-center justify-between">
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px]">
                  Pilar 2: Prediktif
                </Badge>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <CardTitle className="text-base font-bold text-foreground mt-2">
                Estimasi Skor & Kesiapan Ujian
              </CardTitle>
              <CardDescription className="text-xs">
                Proyeksi kelulusan dan hasil ujian akhir semester pada {selectedSubject}.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="p-4 rounded-2xl bg-muted/40 border text-center space-y-1">
                <span className="text-xs text-muted-foreground">Proyeksi Rerata Nilai Ujian</span>
                <div className="text-3xl font-black text-foreground">
                  78.4 <span className="text-sm font-normal text-muted-foreground">/ 100</span>
                </div>
                <span className="text-[11px] text-emerald-600 font-semibold block">
                  ↑ +4.2 poin dibanding bulan sebelumnya
                </span>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-foreground">
                  Distribusi Kesiapan Siswa ({GAMEFORSMART_STUDENTS.length} Siswa):
                </span>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200">
                    <span className="text-emerald-800 dark:text-emerald-200 font-medium">Sangat Siap (Skor &gt; 85)</span>
                    <strong className="text-emerald-700">3 Siswa (37.5%)</strong>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200">
                    <span className="text-blue-800 dark:text-blue-200 font-medium">Siap (Skor 75 - 84)</span>
                    <strong className="text-blue-700">3 Siswa (37.5%)</strong>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200">
                    <span className="text-amber-800 dark:text-amber-200 font-medium">Perlu Pendampingan (&lt; 75)</span>
                    <strong className="text-amber-700">2 Siswa (25.0%)</strong>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>

        {/* PILAR 3: PRESKRIPTIF */}
        <Card className="rounded-2xl border shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="p-5 pb-3 border-b">
              <div className="flex items-center justify-between">
                <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 text-[10px]">
                  Pilar 3: Preskriptif
                </Badge>
                <Sparkles className="w-4 h-4 text-purple-600" />
              </div>
              <CardTitle className="text-base font-bold text-foreground mt-2">
                Materi Belum Tuntas & Auto-Remedial
              </CardTitle>
              <CardDescription className="text-xs">
                Rekomendasi tindakan otomatis bagi siswa yang belum mencapai target KKM.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-foreground">
                  Materi yang Memerlukan Intervensi:
                </span>
                <div className="space-y-2">
                  <div className="p-3 rounded-xl border bg-card space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">Pertidaksamaan Rasional</span>
                      <Badge variant="outline" className="text-[10px] text-red-600 border-red-200">
                        2 Siswa Belum Tuntas
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Target Siswa: @reza_aditya, @ahmad_fauzi
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border bg-card space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">Pertidaksamaan Logaritma</span>
                      <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200">
                        1 Siswa Belum Tuntas
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Target Siswa: @siti_rahma
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleSendRemedialAll}
                  className="w-full rounded-xl text-xs gap-1.5 bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Paket Kuis Remedial Otomatis</span>
                </Button>
                <span className="text-[10px] text-muted-foreground text-center block mt-1.5">
                  Menugaskan kuis spesifik sesuai materi yang belum dikuasai siswa.
                </span>
              </div>
            </CardContent>
          </div>
        </Card>
      </div>

      {/* MATRIX SISWA MEMUMPUNI VS PERLU INTERVENSI */}
      <Card className="rounded-2xl border shadow-sm">
        <CardHeader className="p-5 pb-3 border-b">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Target className="w-4 h-4 text-orange-600" />
            Matriks Kesiapan Siswa ({selectedSubject} - {selectedGrade})
          </CardTitle>
          <CardDescription className="text-xs">
            Daftar lengkap siswa dengan indikator kemampuan, estimasi skor, dan rekomendasi tindak lanjut guru.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/40 text-muted-foreground text-left font-medium border-b">
                  <th className="p-3 pl-5">Nama Siswa</th>
                  <th className="p-3">Level & XP</th>
                  <th className="p-3">Akurasi Kuis</th>
                  <th className="p-3">Estimasi Skor Ujian</th>
                  <th className="p-3">Kategori Kesiapan</th>
                  <th className="p-3">Materi Belum Tuntas (Preskriptif)</th>
                  <th className="p-3 pr-5 text-right">Rekomendasi Guru</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {GAMEFORSMART_STUDENTS.map((std) => (
                  <tr key={std.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 pl-5">
                      <div className="font-semibold text-foreground">{std.fullname}</div>
                      <div className="text-[11px] text-muted-foreground">@{std.username}</div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-[10px] font-bold">
                        Lvl {std.level}
                      </Badge>
                    </td>
                    <td className="p-3 font-semibold">{std.accuracyRate}%</td>
                    <td className="p-3">
                      <strong className="text-sm font-bold text-foreground">
                        {std.predictedExamScore}
                      </strong>
                      <span className="text-[10px] text-muted-foreground"> / 100</span>
                    </td>
                    <td className="p-3">
                      <Badge
                        className={`text-[10px] px-2 py-0.5 ${
                          std.readinessStatus === "Sangat Siap"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : std.readinessStatus === "Siap"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}
                      >
                        {std.readinessStatus}
                      </Badge>
                    </td>
                    <td className="p-3 max-w-xs">
                      {std.unmasteredTopics.length === 0 ? (
                        <span className="text-emerald-600 font-medium text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Tuntas
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {std.unmasteredTopics.map((top, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-[9px] bg-red-50 text-red-700 border-red-200"
                            >
                              {top}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="p-3 pr-5 text-right">
                      {std.readinessStatus === "Sangat Siap" ? (
                        <span className="text-[11px] text-emerald-600 font-medium">
                          Pengayaan Soal Olimpiade / HOTS
                        </span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            toast.success(`Paket latihan mandiri dikirimkan ke @${std.username}`);
                          }}
                          className="h-7 text-[11px] rounded-xl text-orange-600 hover:text-orange-700 border-orange-200 hover:bg-orange-50"
                        >
                          Tugaskan Remedial
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

