"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  Award,
  Users,
  Filter,
  BarChart3,
  School,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useAnalyticsAuth } from "@/contexts/analytics-auth-context";

interface ClassBenchmark {
  className: string;
  grade: string;
  homeroomTeacher: string;
  totalStudents: number;
  averageAccuracy: number;
  predictedExamScore: number;
  readinessRate: number;
  unmasteredCount: number;
  rank: number;
}

const CLASS_BENCHMARKS: ClassBenchmark[] = [
  {
    className: "Kelas 10-A (MIPA)",
    grade: "Kelas 10",
    homeroomTeacher: "Rahmat Hidayat, S.Pd.",
    totalStudents: 34,
    averageAccuracy: 84.5,
    predictedExamScore: 86.2,
    readinessRate: 91.2,
    unmasteredCount: 1,
    rank: 1
  },
  {
    className: "Kelas 10-B (MIPA)",
    grade: "Kelas 10",
    homeroomTeacher: "Drs. Hendro Wibowo",
    totalStudents: 35,
    averageAccuracy: 79.2,
    predictedExamScore: 81.0,
    readinessRate: 82.8,
    unmasteredCount: 3,
    rank: 3
  },
  {
    className: "Kelas 10-C (IPS)",
    grade: "Kelas 10",
    homeroomTeacher: "Sri Wahyuni, M.Pd.",
    totalStudents: 32,
    averageAccuracy: 72.4,
    predictedExamScore: 74.5,
    readinessRate: 68.7,
    unmasteredCount: 5,
    rank: 5
  },
  {
    className: "Kelas 11-IPA 1",
    grade: "Kelas 11",
    homeroomTeacher: "Rahmat Hidayat, S.Pd.",
    totalStudents: 34,
    averageAccuracy: 86.8,
    predictedExamScore: 88.5,
    readinessRate: 94.1,
    unmasteredCount: 0,
    rank: 1
  },
  {
    className: "Kelas 11-IPA 2",
    grade: "Kelas 11",
    homeroomTeacher: "Bambang Sudarsono, S.Si.",
    totalStudents: 33,
    averageAccuracy: 81.1,
    predictedExamScore: 82.7,
    readinessRate: 84.8,
    unmasteredCount: 2,
    rank: 2
  },
  {
    className: "Kelas 12-MIPA Unggulan",
    grade: "Kelas 12",
    homeroomTeacher: "Dr. Nurul Huda, M.Si.",
    totalStudents: 32,
    averageAccuracy: 91.4,
    predictedExamScore: 92.8,
    readinessRate: 96.8,
    unmasteredCount: 0,
    rank: 1
  }
];

export default function SchoolBenchmarkPage() {
  const { user } = useAnalyticsAuth();
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("Matematika");

  const filtered = CLASS_BENCHMARKS.filter((c) => {
    if (selectedGrade !== "all" && c.grade !== selectedGrade) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Benchmark Antarkelas</h1>
            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
              Evaluasi Sekolah
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Komparasi capaian akademik, kesiapan ujian, dan penguasaan materi antar rombel kelas di {user?.scope.schoolName || "SMAN 1 SURABAYA"}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
            <SelectTrigger className="w-36 h-9 text-xs rounded-xl">
              <SelectValue placeholder="Semua Jenjang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Jenjang</SelectItem>
              <SelectItem value="Kelas 10">Kelas 10</SelectItem>
              <SelectItem value="Kelas 11">Kelas 11</SelectItem>
              <SelectItem value="Kelas 12">Kelas 12</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-36 h-9 text-xs rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Matematika">Matematika</SelectItem>
              <SelectItem value="Fisika">Fisika</SelectItem>
              <SelectItem value="Biologi">Biologi</SelectItem>
              <SelectItem value="Bahasa Inggris">Bahasa Inggris</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border bg-card/60">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Kelas Berperforma Tertinggi</CardDescription>
            <CardTitle className="text-lg font-bold text-emerald-600 flex items-center gap-1.5">
              <Award className="w-5 h-5 text-emerald-500" />
              <span>Kelas 12-MIPA Unggulan</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-xs text-muted-foreground">
            Akurasi 91.4% • Prediksi Nilai Ujian 92.8 • 0 Topik Remedial.
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card/60">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Rata-rata Prediksi Nilai Sekolah</CardDescription>
            <CardTitle className="text-2xl font-black text-foreground">
              84.3 <span className="text-xs font-normal text-muted-foreground">/ 100</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-xs text-muted-foreground">
            Mengungguli rerata KKM sekolah (75.0) sebesar +9.3 poin.
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card/60">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Rombel Butuh Intervensi</CardDescription>
            <CardTitle className="text-lg font-bold text-amber-600 flex items-center gap-1.5">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Kelas 10-C (IPS)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-xs text-muted-foreground">
            Kesiapan 68.7% • Memerlukan program penguatan konsep dasar matematika.
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard & Comparison Table */}
      <Card className="rounded-2xl border shadow-sm">
        <CardHeader className="p-5 pb-3 border-b">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-orange-600" />
            Tabel Komparasi & Pemeringkatan Antarkelas ({selectedSubject})
          </CardTitle>
          <CardDescription className="text-xs">
            Evaluasi menyeluruh untuk supervisi kepala sekolah dan penetapan target remedial.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/40 text-muted-foreground text-left font-medium border-b">
                  <th className="p-3 pl-5">Peringkat</th>
                  <th className="p-3">Rombel / Kelas</th>
                  <th className="p-3">Wali Kelas</th>
                  <th className="p-3">Jumlah Siswa</th>
                  <th className="p-3">Rerata Akurasi</th>
                  <th className="p-3">Estimasi Skor Ujian</th>
                  <th className="p-3">Tingkat Kesiapan</th>
                  <th className="p-3 pr-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((item, idx) => (
                  <tr key={idx} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 pl-5 font-bold">
                      <span className="w-6 h-6 rounded-full bg-muted inline-flex items-center justify-center text-xs">
                        {idx + 1}
                      </span>
                    </td>
                    <td className="p-3">
                      <strong className="text-foreground block">{item.className}</strong>
                      <span className="text-[11px] text-muted-foreground">{item.grade}</span>
                    </td>
                    <td className="p-3 text-muted-foreground">{item.homeroomTeacher}</td>
                    <td className="p-3">{item.totalStudents} Siswa</td>
                    <td className="p-3 font-semibold">{item.averageAccuracy}%</td>
                    <td className="p-3 font-bold text-foreground text-sm">
                      {item.predictedExamScore}
                    </td>
                    <td className="p-3">
                      <div className="space-y-1 w-28">
                        <div className="flex justify-between text-[10px]">
                          <span>{item.readinessRate}%</span>
                        </div>
                        <Progress value={item.readinessRate} className="h-1.5 rounded-full" />
                      </div>
                    </td>
                    <td className="p-3 pr-5 text-right">
                      {item.readinessRate >= 90 ? (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px]">
                          Sangat Siap
                        </Badge>
                      ) : item.readinessRate >= 75 ? (
                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 text-[10px]">
                          Siap
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 text-[10px]">
                          Perlu Intervensi
                        </Badge>
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

