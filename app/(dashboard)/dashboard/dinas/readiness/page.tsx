"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  School,
  Sparkles,
  BarChart3,
  ShieldAlert,
  Send,
  ArrowRight
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
import { toast } from "sonner";

interface SchoolReadinessData {
  npsn: string;
  name: string;
  level: string;
  city: string;
  totalStudents: number;
  competencyTargetReachedRate: number; // % siswa yang mencapai target kompetensi
  predictedAvgExamScore: number;
  category: "UNGGULAN" | "MANDIRI" | "BUTUH_INTERVENSI";
  criticalGaps: string[];
}

const READINESS_DATA: SchoolReadinessData[] = [
  {
    npsn: "20532247",
    name: "SMAN 1 SURABAYA",
    level: "SMA",
    city: "Kota Surabaya",
    totalStudents: 1045,
    competencyTargetReachedRate: 91.2,
    predictedAvgExamScore: 88.4,
    category: "UNGGULAN",
    criticalGaps: []
  },
  {
    npsn: "20532249",
    name: "SMAN 5 SURABAYA",
    level: "SMA",
    city: "Kota Surabaya",
    totalStudents: 1120,
    competencyTargetReachedRate: 94.6,
    predictedAvgExamScore: 90.1,
    category: "UNGGULAN",
    criticalGaps: []
  },
  {
    npsn: "20532248",
    name: "SMAN 2 SURABAYA",
    level: "SMA",
    city: "Kota Surabaya",
    totalStudents: 1080,
    competencyTargetReachedRate: 85.3,
    predictedAvgExamScore: 84.7,
    category: "MANDIRI",
    criticalGaps: ["Trigonometri Lanjut"]
  },
  {
    npsn: "20532250",
    name: "SMKN 1 SURABAYA",
    level: "SMK",
    city: "Kota Surabaya",
    totalStudents: 1450,
    competencyTargetReachedRate: 82.0,
    predictedAvgExamScore: 81.2,
    category: "MANDIRI",
    criticalGaps: ["Kalkulus Terapan"]
  },
  {
    npsn: "20533801",
    name: "SMAN 1 MALANG",
    level: "SMA",
    city: "Kota Malang",
    totalStudents: 980,
    competencyTargetReachedRate: 89.4,
    predictedAvgExamScore: 87.2,
    category: "UNGGULAN",
    criticalGaps: []
  },
  {
    npsn: "20501830",
    name: "SMAN 1 SIDOARJO",
    level: "SMA",
    city: "Kab. Sidoarjo",
    totalStudents: 1050,
    competencyTargetReachedRate: 84.8,
    predictedAvgExamScore: 83.5,
    category: "MANDIRI",
    criticalGaps: ["Logika Matematika"]
  },
  {
    npsn: "20532251",
    name: "SMPN 1 SURABAYA",
    level: "SMP",
    city: "Kota Surabaya",
    totalStudents: 960,
    competencyTargetReachedRate: 64.2,
    predictedAvgExamScore: 68.5,
    category: "BUTUH_INTERVENSI",
    criticalGaps: ["Pertidaksamaan Aljabar", "Geometri Ruang Dasar"]
  }
];

export default function DinasReadinessPage() {
  const { role, user } = useAnalyticsAuth();
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  const filtered = READINESS_DATA.filter((item) => {
    if (selectedFilter === "all") return true;
    return item.category === selectedFilter;
  });

  const countUnggulan = READINESS_DATA.filter((s) => s.category === "UNGGULAN").length;
  const countMandiri = READINESS_DATA.filter((s) => s.category === "MANDIRI").length;
  const countIntervensi = READINESS_DATA.filter((s) => s.category === "BUTUH_INTERVENSI").length;

  const handleSendSupervisionNotice = (schoolName: string) => {
    toast.success(
      `Paket rekomendasi intervensi kurikulum dan modul remedial dinas telah dikirimkan ke Kepala Sekolah ${schoolName}.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Kesiapan Ujian & Pemetaan Mutu Wilayah</h1>
            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
              Evaluasi Dinas
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Identifikasi sekolah mana saja yang siswanya sudah mencapai target kompetensi dan skornya baik vs sekolah butuh pendampingan dinas.
          </p>
        </div>

        <Select value={selectedFilter} onValueChange={setSelectedFilter}>
          <SelectTrigger className="w-48 h-9 text-xs rounded-xl">
            <SelectValue placeholder="Kategori Kesiapan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            <SelectItem value="UNGGULAN">Sekolah Unggulan (Skor &gt; 85)</SelectItem>
            <SelectItem value="MANDIRI">Sekolah Mandiri (Skor 75-84)</SelectItem>
            <SelectItem value="BUTUH_INTERVENSI">Prioritas Intervensi (&lt; 75)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 3 Categories Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs text-emerald-800 dark:text-emerald-300">
              Kategori 1: Sekolah Unggulan
            </CardDescription>
            <CardTitle className="text-2xl font-black text-emerald-700 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              <span>{countUnggulan} Sekolah</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-xs text-muted-foreground">
            Siswa telah melampaui target kompetensi (Rerata skor &gt; 85). Siap untuk tes seleksi perguruan tinggi / olimpiade.
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-blue-50/30 dark:bg-blue-950/20 border-blue-200">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs text-blue-800 dark:text-blue-300">
              Kategori 2: Sekolah Mandiri
            </CardDescription>
            <CardTitle className="text-2xl font-black text-blue-700 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              <span>{countMandiri} Sekolah</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-xs text-muted-foreground">
            Target kompetensi tercapai dengan aman (Rerata skor 75–84). Memerlukan pendampingan ringan.
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-amber-50/30 dark:bg-amber-950/20 border-amber-200">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs text-amber-800 dark:text-amber-300">
              Kategori 3: Prioritas Intervensi Dinas
            </CardDescription>
            <CardTitle className="text-2xl font-black text-amber-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>{countIntervensi} Sekolah</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-xs text-muted-foreground">
            Di bawah batas KKM regional (&lt; 75). Menjadi sasaran program pembinaan kurikulum dinas.
          </CardContent>
        </Card>
      </div>

      {/* School Readiness Table */}
      <Card className="rounded-2xl border shadow-sm">
        <CardHeader className="p-5 pb-3 border-b">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-600" />
            Matriks Kesiapan Ujian Satuan Pendidikan ({filtered.length} Sekolah)
          </CardTitle>
          <CardDescription className="text-xs">
            Menampilkan tingkat capaian kompetensi, prediksi nilai ujian, dan rekomendasi intervensi dinas.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/40 text-muted-foreground text-left font-medium border-b">
                  <th className="p-3 pl-5">NPSN</th>
                  <th className="p-3">Nama Satuan Pendidikan</th>
                  <th className="p-3">Jenjang / Kota</th>
                  <th className="p-3">Siswa Tuntas Target</th>
                  <th className="p-3">Prediksi Nilai Ujian</th>
                  <th className="p-3">Status Mutu</th>
                  <th className="p-3 pr-5 text-right">Tindak Lanjut Dinas</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((item) => (
                  <tr key={item.npsn} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 pl-5 font-mono font-semibold text-orange-600">
                      {item.npsn}
                    </td>
                    <td className="p-3">
                      <strong className="text-foreground block">{item.name}</strong>
                      <span className="text-[11px] text-muted-foreground">{item.totalStudents} Siswa</span>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-[10px]">
                        {item.level} • {item.city}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="space-y-1 w-28">
                        <div className="flex justify-between font-semibold">
                          <span>{item.competencyTargetReachedRate}%</span>
                        </div>
                        <Progress value={item.competencyTargetReachedRate} className="h-1.5 rounded-full" />
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-foreground text-sm">
                        {item.predictedAvgExamScore}
                      </span>
                      <span className="text-[10px] text-muted-foreground"> / 100</span>
                    </td>
                    <td className="p-3">
                      {item.category === "UNGGULAN" ? (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px]">
                          Unggulan
                        </Badge>
                      ) : item.category === "MANDIRI" ? (
                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 text-[10px]">
                          Mandiri
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 text-[10px]">
                          Prioritas Intervensi
                        </Badge>
                      )}
                    </td>
                    <td className="p-3 pr-5 text-right">
                      {item.category === "BUTUH_INTERVENSI" ? (
                        <Button
                          size="sm"
                          onClick={() => handleSendSupervisionNotice(item.name)}
                          className="h-7 text-[11px] rounded-xl bg-orange-600 hover:bg-orange-700 text-white gap-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>Kirim Supervisi</span>
                        </Button>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">Pembinaan Rutin</span>
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

