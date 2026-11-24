"use client";

import React, { useState } from "react";
import { useAnalyticsAuth } from "@/contexts/analytics-auth-context";
import {
  StatCard,
  TrendCard,
  TimeFilter,
  TopQuizzesTable,
  DashboardActivityChart,
  DashboardCategoryChart,
  QuickActionsGrid,
  type QuickActionItem
} from "@/components/dashboard";
import type { PeriodFilter, QuizStat, TrendData } from "@/types/evaluation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  QrCode,
  CheckSquare,
  BarChart3,
  RefreshCw,
  ArrowRight,
  Sparkles,
  BookOpen
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function TeacherDashboardPage() {
  const { user } = useAnalyticsAuth();
  const [period, setPeriod] = useState<PeriodFilter>("this_week");
  const [isUpdating, setIsUpdating] = useState(false);

  // Dynamic trend data
  const trendData: TrendData = {
    current: 78.4,
    previous: 74.2,
    percentChange: 4.2
  };

  // Sample weekly activity data
  const activityData = [
    { label: "Senin", sessions: 28 },
    { label: "Selasa", sessions: 45 },
    { label: "Rabu", sessions: 52 },
    { label: "Kamis", sessions: 64 },
    { label: "Jumat", sessions: 48 },
    { label: "Sabtu", sessions: 32 },
    { label: "Minggu", sessions: 18 }
  ];

  // Top evaluated quizzes data
  const topQuizzes: QuizStat[] = [
    {
      id: "quiz-1",
      rank: 1,
      name: "Aljabar Linier & Matriks",
      plays: 68,
      avgScore: 88
    },
    {
      id: "quiz-2",
      rank: 2,
      name: "Eksponen & Logaritma Lanjut",
      plays: 54,
      avgScore: 81
    },
    {
      id: "quiz-3",
      rank: 3,
      name: "Geometri Ruang Tiga Dimensi",
      plays: 46,
      avgScore: 74
    },
    {
      id: "quiz-4",
      rank: 4,
      name: "Trigonometri Sudut Istimewa",
      plays: 42,
      avgScore: 54
    }
  ];

  // Distribution by subject category
  const categoryData = [
    { key: "math", name: "Matematika", value: 92, color: "#f97316" },
    { key: "physics", name: "Fisika", value: 45, color: "#3b82f6" },
    { key: "chemistry", name: "Kimia", value: 38, color: "#10b981" },
    { key: "biology", name: "Biologi", value: 24, color: "#eab308" }
  ];

  // Quick Action items matching gameforsmart UI style
  const quickActions: QuickActionItem[] = [
    {
      title: "Scan QR Murid",
      description: "Onboarding instan via kamera",
      href: "/dashboard/teacher/groups",
      icon: QrCode,
      color: "orange"
    },
    {
      title: "Buat Tugas Kuis",
      description: "Tugaskan asesmen mandiri",
      href: "/dashboard/teacher/tasks",
      icon: CheckSquare,
      color: "blue"
    },
    {
      title: "Analitik 3 Pilar",
      description: "Deskriptif, Prediktif & Preskriptif",
      href: "/dashboard/teacher/analytics",
      icon: BarChart3,
      color: "yellow"
    },
    {
      title: "Kelola Grup Kelas",
      description: "Rombel 10-A & 11-IPA",
      href: "/dashboard/teacher/groups",
      icon: Users,
      color: "emerald"
    }
  ];

  const handleUpdateSnapshot = () => {
    setIsUpdating(true);
    setTimeout(() => {
      setIsUpdating(false);
      toast.success("Snapshot analitik performa kelas berhasil diperbarui!");
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Time Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
            Dashboard
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <TimeFilter period={period} setPeriod={setPeriod} />

          <Button
            onClick={handleUpdateSnapshot}
            disabled={isUpdating}
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs rounded-xl"
          >
            <RefreshCw className={`size-3.5 ${isUpdating ? "animate-spin" : ""}`} />
            <span>{isUpdating ? "Menganalisa..." : "Update Analisa"}</span>
          </Button>

          <Link href="/dashboard/teacher/groups">
            <Button
              size="sm"
              className="h-9 gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded-xl shadow-xs"
            >
              <QrCode className="size-3.5" />
              <span>Scan QR</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Row 1: KPI Metric Cards with Pastel Color Accents */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Siswa Binaan */}
        <StatCard
          title="Total Siswa Binaan"
          value="68 Siswa"
          icon="users"
        />

        {/* Rata-rata Akurasi Kuis */}
        <StatCard
          title="Rata-rata Akurasi"
          value="78.4%"
          icon="accuracy"
        />

        {/* Prediksi Nilai Ujian */}
        <StatCard
          title="Prediksi Nilai Ujian"
          value="81.5"
          icon="prediction"
        />

        {/* Tren Performa Mingguan */}
        <TrendCard
          trendData={trendData}
          title="TREN PERFORMA"
        />
      </div>

      {/* Row 3: Akses Cepat / Quick Actions */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-tight uppercase text-muted-foreground">
            Akses Cepat Pengelolaan
          </h2>
        </div>
        <QuickActionsGrid actions={quickActions} />
      </div>

      {/* Row 4: Analitik 3 Pilar & Distribusi Kategori */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Pilar 1: Deskriptif */}
        <Card className="rounded-2xl border shadow-sm border-t-4 border-t-orange-500">
          <CardHeader className="pb-3">
            <Badge className="w-fit mb-1 bg-orange-100 text-orange-800 border-none dark:bg-orange-950 dark:text-orange-300 text-[10px]">
              Pilar 1: Deskriptif
            </Badge>
            <CardTitle className="text-base font-bold">Kemampuan Siswa</CardTitle>
            <CardDescription className="text-xs">
              Peta penguasaan materi dari histori pengerjaan kuis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between font-medium">
                <span>Aljabar Linier</span>
                <span className="text-emerald-600 font-semibold">88% (Tuntas)</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: "88%" }} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between font-medium">
                <span>Trigonometri Dasar</span>
                <span className="text-amber-600 font-semibold">54% (Kurang)</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: "54%" }} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between font-medium">
                <span>Geometri Ruang</span>
                <span className="text-blue-600 font-semibold">74% (Cukup)</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: "74%" }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pilar 2: Prediktif */}
        <Card className="rounded-2xl border shadow-sm border-t-4 border-t-blue-500">
          <CardHeader className="pb-3">
            <Badge className="w-fit mb-1 bg-blue-100 text-blue-800 border-none dark:bg-blue-950 dark:text-blue-300 text-[10px]">
              Pilar 2: Prediktif
            </Badge>
            <CardTitle className="text-base font-bold">Kesiapan Ujian</CardTitle>
            <CardDescription className="text-xs">
              Estimasi skor ujian & tingkat kesiapan menghadapi tes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="rounded-xl border bg-blue-50/40 dark:bg-blue-950/20 p-3 text-center space-y-1">
              <div className="text-xs text-muted-foreground font-medium">Indeks Kesiapan Rata-Rata Kelas</div>
              <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">82%</div>
              <Badge variant="outline" className="text-[10px] text-blue-700 border-blue-200 bg-background">
                Kategori: Cukup Siap
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground text-center">
              42 dari 68 siswa diprediksi mampu meraih skor &gt; 80 pada ujian semester mendatang.
            </p>
          </CardContent>
        </Card>

        {/* Pilar 3: Preskriptif */}
        <Card className="rounded-2xl border shadow-sm border-t-4 border-t-emerald-500">
          <CardHeader className="pb-3">
            <Badge className="w-fit mb-1 bg-emerald-100 text-emerald-800 border-none dark:bg-emerald-950 dark:text-emerald-300 text-[10px]">
              Pilar 3: Preskriptif
            </Badge>
            <CardTitle className="text-base font-bold">Rekomendasi Remedial</CardTitle>
            <CardDescription className="text-xs">
              Intervensi langsung materi yang belum tuntas dikuasai
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="rounded-xl bg-orange-50/70 p-3.5 dark:bg-zinc-900 border border-orange-100 dark:border-zinc-800 space-y-2">
              <div className="font-semibold text-orange-950 dark:text-orange-200">
                Kuis Remedial: Trigonometri
              </div>
              <p className="text-[11px] text-muted-foreground">
                9 siswa terdeteksi kesulitan pada konsep sin-cos-tan sudut istimewa.
              </p>
              <Link href="/dashboard/teacher/tasks" className="block w-full">
                <Button size="sm" className="w-full h-8 bg-orange-600 hover:bg-orange-700 text-white text-xs mt-1 gap-1 rounded-xl">
                  <span>Tugaskan Remedial Sekarang</span>
                  <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 5: Distribusi Kategori Mapel */}
      <div className="grid gap-4 md:grid-cols-2">
        <DashboardCategoryChart
          data={categoryData}
          title="Distribusi Pengerjaan Kuis Berdasarkan Mapel"
        />

        <Card className="rounded-xl border p-4 shadow-sm flex flex-col justify-between dark:bg-[#111116]">
          <CardHeader className="p-0 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-orange-500" />
              <CardTitle className="text-sm font-bold">Ringkasan Evaluasi Otomatis (AI Engine)</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Sintesis pembelajaran berdasarkan seluruh histori aktivitas kuis GameForSmart
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-2 text-xs text-muted-foreground">
            <p>
              • Tingkat partisipasi kelas aktif mencapai <strong>92.8%</strong>, meningkat 4.5% dari rata-rata bulan lalu.
            </p>
            <p>
              • Kompetensi <strong>Aljabar Linier</strong> menjadi materi dengan penguasaan tertinggi (rata-rata 88%), sementara <strong>Trigonometri</strong> memerlukan intervensi lanjutan sebelum Ujian Tengah Semester.
            </p>
            <div className="pt-2">
              <Link href="/dashboard/teacher/analytics">
                <Button variant="outline" size="sm" className="h-8 text-xs rounded-xl gap-1">
                  <span>Lihat Analisis Detail</span>
                  <ArrowRight className="size-3" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
