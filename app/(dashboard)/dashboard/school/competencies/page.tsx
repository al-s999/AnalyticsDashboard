"use client";

import React, { useState } from "react";
import {
  Award,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  School,
  FileText
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useAnalyticsAuth } from "@/contexts/analytics-auth-context";

interface SubjectCompetency {
  kdCode: string;
  kdTitle: string;
  subject: string;
  grade: string;
  masteryPercentage: number;
  totalStudentsTuntas: number;
  totalStudentsEvaluated: number;
  status: "TUNTAS" | "CUKUP" | "PERLU_PENDAMPINGAN";
}

const COMPETENCY_DATA: SubjectCompetency[] = [
  {
    kdCode: "KD 3.1",
    kdTitle: "Persamaan dan Pertidaksamaan Nilai Mutlak Linier Satu Variabel",
    subject: "Matematika",
    grade: "Kelas 10",
    masteryPercentage: 86.4,
    totalStudentsTuntas: 88,
    totalStudentsEvaluated: 102,
    status: "TUNTAS"
  },
  {
    kdCode: "KD 3.2",
    kdTitle: "Pertidaksamaan Rasional dan Irasional Satu Variabel",
    subject: "Matematika",
    grade: "Kelas 10",
    masteryPercentage: 62.1,
    totalStudentsTuntas: 63,
    totalStudentsEvaluated: 102,
    status: "PERLU_PENDAMPINGAN"
  },
  {
    kdCode: "KD 3.3",
    kdTitle: "Sistem Persamaan Linier Tiga Variabel (SPLTV)",
    subject: "Matematika",
    grade: "Kelas 10",
    masteryPercentage: 74.8,
    totalStudentsTuntas: 76,
    totalStudentsEvaluated: 102,
    status: "CUKUP"
  },
  {
    kdCode: "KD 3.4",
    kdTitle: "Fungsi Eksponen dan Logaritma Lanjut",
    subject: "Matematika",
    grade: "Kelas 10",
    masteryPercentage: 71.2,
    totalStudentsTuntas: 72,
    totalStudentsEvaluated: 102,
    status: "CUKUP"
  },
  {
    kdCode: "KD 3.5",
    kdTitle: "Trigonometri Dasar pada Segitiga Siku-Siku",
    subject: "Matematika",
    grade: "Kelas 10",
    masteryPercentage: 81.5,
    totalStudentsTuntas: 83,
    totalStudentsEvaluated: 102,
    status: "TUNTAS"
  }
];

export default function SchoolCompetenciesPage() {
  const { user } = useAnalyticsAuth();
  const [selectedSubject, setSelectedSubject] = useState("Matematika");
  const [selectedGrade, setSelectedGrade] = useState("Kelas 10");

  const totalEvaluated = COMPETENCY_DATA.length;
  const countTuntas = COMPETENCY_DATA.filter((c) => c.status === "TUNTAS").length;
  const countPerluPendampingan = COMPETENCY_DATA.filter(
    (c) => c.status === "PERLU_PENDAMPINGAN"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Ketuntasan Kompetensi Satuan Pendidikan</h1>
            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
              Audit Kurikulum
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Peta capaian target Kompetensi Dasar (KD) per mata pelajaran pada {user?.scope.schoolName || "SMAN 1 SURABAYA"}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-36 h-9 text-xs rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Matematika">Matematika</SelectItem>
              <SelectItem value="Fisika">Fisika</SelectItem>
              <SelectItem value="Kimia">Kimia</SelectItem>
              <SelectItem value="Biologi">Biologi</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
            <SelectTrigger className="w-32 h-9 text-xs rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Kelas 10">Kelas 10</SelectItem>
              <SelectItem value="Kelas 11">Kelas 11</SelectItem>
              <SelectItem value="Kelas 12">Kelas 12</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border bg-card/60">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Kompetensi Tuntas Penuh</CardDescription>
            <CardTitle className="text-2xl font-black text-emerald-600 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>{countTuntas} / {totalEvaluated} KD</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-xs text-muted-foreground">
            Materi dengan ketuntasan klasikal &gt; 80% di seluruh kelas.
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card/60">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Kompetensi Butuh Intervensi</CardDescription>
            <CardTitle className="text-2xl font-black text-amber-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>{countPerluPendampingan} KD Kritis</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-xs text-muted-foreground">
            KD 3.2 Pertidaksamaan Rasional membutuhkan modul remedial sekolah.
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card/60">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Rerata Ketuntasan Sekolah</CardDescription>
            <CardTitle className="text-2xl font-black text-foreground">
              75.2% <span className="text-xs font-normal text-muted-foreground">Klasikal</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-xs text-muted-foreground">
            Target ketuntasan kurikulum semester ini berada pada jalur hijau.
          </CardContent>
        </Card>
      </div>

      {/* Competencies Table */}
      <Card className="rounded-2xl border shadow-sm">
        <CardHeader className="p-5 pb-3 border-b">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-orange-600" />
            Rincian Ketuntasan Indikator Kompetensi ({selectedSubject} - {selectedGrade})
          </CardTitle>
          <CardDescription className="text-xs">
            Indikator pencapaian target kurikulum nasional GameForSmart.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/40 text-muted-foreground text-left font-medium border-b">
                  <th className="p-3 pl-5">Kode KD</th>
                  <th className="p-3">Deskripsi Kompetensi</th>
                  <th className="p-3">Siswa Tuntas</th>
                  <th className="p-3">Persentase Ketuntasan</th>
                  <th className="p-3 pr-5 text-right">Status Evaluasi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {COMPETENCY_DATA.map((kd) => (
                  <tr key={kd.kdCode} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 pl-5 font-bold text-orange-600">{kd.kdCode}</td>
                    <td className="p-3 max-w-md">
                      <span className="font-semibold text-foreground block">{kd.kdTitle}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {kd.subject} • {kd.grade}
                      </span>
                    </td>
                    <td className="p-3">
                      {kd.totalStudentsTuntas} / {kd.totalStudentsEvaluated} Siswa
                    </td>
                    <td className="p-3">
                      <div className="space-y-1 w-32">
                        <div className="flex justify-between font-semibold">
                          <span>{kd.masteryPercentage}%</span>
                        </div>
                        <Progress value={kd.masteryPercentage} className="h-2 rounded-full" />
                      </div>
                    </td>
                    <td className="p-3 pr-5 text-right">
                      {kd.status === "TUNTAS" ? (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px]">
                          Tuntas
                        </Badge>
                      ) : kd.status === "CUKUP" ? (
                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 text-[10px]">
                          Cukup
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 text-[10px]">
                          Perlu Remedial Sekolah
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

