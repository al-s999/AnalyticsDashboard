"use client";

import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  RefreshCw,
  Clock,
  CheckCircle2,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
  const [lastUpdate, setLastUpdate] = useState("Hari ini, 00:00 WIB");

  // Perbarui data nilai dan pemahaman siswa
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
            .padStart(2, "0")} WIB`;
          setLastUpdate(timeStr);
          toast.success("Data perkembangan siswa berhasil diperbarui!");
          return 100;
        }
        return prev + 25;
      });
    }, 350);
  };

  // Siswa dianggap "Siap" jika nilai >= 75, dan "Tidak Siap" jika < 75
  const readyStudentsCount = GAMEFORSMART_STUDENTS.filter(
    (std) => std.predictedExamScore >= 75
  ).length;
  const notReadyStudentsCount = GAMEFORSMART_STUDENTS.length - readyStudentsCount;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Perkembangan Belajar Siswa</h1>
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
            <span>{isRefreshing ? "Memperbarui Data..." : "Perbarui Data"}</span>
          </Button>
        </div>
      </div>

      {/* Status Pembaruan Terakhir */}
      <Card className="rounded-2xl border bg-card/60 p-4 shadow-sm">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4 text-orange-500" />
            <span>Terakhir Diperbarui: <strong className="text-foreground">{lastUpdate}</strong></span>
          </div>
        </div>

        {isRefreshing && (
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-orange-600 font-semibold">
                Sedang mengumpulkan nilai kuis dan aktivitas belajar siswa...
              </span>
              <span className="font-bold">{refreshProgress}%</span>
            </div>
            <Progress value={refreshProgress} className="h-2 rounded-full" />
          </div>
        )}
      </Card>

      {/* 3 KARTU INFORMASI UTAMA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KARTU 1: PENGUASAAN MATERI */}
        <Card className="rounded-2xl border shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="p-5 pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-foreground">
                  Tingkat Pemahaman Materi
                </CardTitle>
                <BarChart3 className="w-4 h-4 text-blue-600" />
              </div>
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
                <strong>Catatan Guru:</strong>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Sebagian besar siswa sudah sangat baik di Aljabar dan Statistika, namun perlu latihan tambahan pada Pertidaksamaan Rasional.
                </p>
              </div>
            </CardContent>
          </div>
        </Card>

        {/* KARTU 2: KESIAPAN UJIAN */}
        <Card className="rounded-2xl border shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="p-5 pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-foreground">
                  Perkiraan Nilai Ujian
                </CardTitle>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="p-4 rounded-2xl bg-muted/40 border text-center space-y-1">
                <span className="text-xs text-muted-foreground">Rata-rata Nilai Kelas</span>
                <div className="text-3xl font-black text-foreground">
                  78.4 <span className="text-sm font-normal text-muted-foreground">/ 100</span>
                </div>
                <span className="text-[11px] text-emerald-600 font-semibold block">
                  ↑ Meningkat 4.2 poin
                </span>
              </div>

              <div className="space-y-2">
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200">
                    <span className="text-emerald-800 dark:text-emerald-200 font-medium">Siap</span>
                    <strong className="text-emerald-700">{readyStudentsCount} Siswa</strong>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200">
                    <span className="text-amber-800 dark:text-amber-200 font-medium">Tidak Siap</span>
                    <strong className="text-amber-700">{notReadyStudentsCount} Siswa</strong>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>

        {/* KARTU 3: MATERI PERLU PERBAIKAN */}
        <Card className="rounded-2xl border shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="p-5 pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-foreground">
                  Bantuan & Latihan Tambahan
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="space-y-2">
                <div className="space-y-2">
                  <div className="p-3 rounded-xl border bg-card space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">Pertidaksamaan Rasional</span>
                      <Badge variant="outline" className="text-[10px] text-red-600 border-red-200">
                        2 Siswa
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Siswa: Reza Aditya, Ahmad Fauzi
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border bg-card space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">Pertidaksamaan Logaritma</span>
                      <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200">
                        1 Siswa
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Siswa: Siti Rahma
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      </div>

      {/* TABEL RINCIAN SISWA */}
      <Card className="rounded-2xl border shadow-sm">
        <CardHeader className="p-5 pb-3 border-b">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Target className="w-4 h-4 text-orange-600" />
            Daftar Nilai & Kesiapan Siswa
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/40 text-muted-foreground text-left font-medium border-b">
                  <th className="p-3 pl-5">Nama Siswa</th>
                  <th className="p-3">Ketepatan Jawaban</th>
                  <th className="p-3">Perkiraan Nilai</th>
                  <th className="p-3">Kesiapan</th>
                  <th className="p-3 pr-5">Materi Perlu Latihan</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {GAMEFORSMART_STUDENTS.map((std) => {
                  const isReady = std.predictedExamScore >= 75;
                  return (
                    <tr key={std.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 pl-5">
                        <div className="font-semibold text-foreground">{std.fullname}</div>
                        <div className="text-[11px] text-muted-foreground">{std.username}</div>
                      </td>
                      <td className="p-3 font-semibold">{std.accuracyRate}%</td>
                      <td className="p-3">
                        <strong className="text-sm font-bold text-foreground">
                          {std.predictedExamScore}
                        </strong>
                        <span className="text-[10px] text-muted-foreground"></span>
                      </td>
                      <td className="p-3">
                        <Badge
                          className={`text-[10px] px-2 py-0.5 ${isReady
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                            }`}
                        >
                          {isReady ? "Siap" : "Tidak Siap"}
                        </Badge>
                      </td>
                      <td className="p-3 pr-5 max-w-xs">
                        {std.unmasteredTopics.length === 0 ? (
                          <span className="text-emerald-600 font-medium text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
