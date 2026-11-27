"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  TrendingUp,
  RefreshCw,
  Clock,
  CheckCircle2,
  Target,
  Search,
  Sparkles,
  Users,
  BookOpen,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { AcademicGroup, StudentProfile, StudentTask } from "@/data/students-data";
import { useAnalyticsAuth } from "@/contexts/analytics-auth-context";
import { fetchTeacherTasks } from "@/lib/tasks/client";
import { toast } from "sonner";

export default function TeacherAnalyticsPage() {
  const { user } = useAnalyticsAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<AcademicGroup[]>([]);
  const [tasks, setTasks] = useState<StudentTask[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [readinessFilter, setReadinessFilter] = useState<"all" | "siap" | "belum_siap">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState("Baru saja");

  const loadAnalyticsData = useCallback(
    async (showToast = false) => {
      try {
        if (showToast) setIsRefreshing(true);
        const queryParam = user?.id ? `?creator_id=${encodeURIComponent(user.id)}` : "";
        const [groupsRes, loadedTasks] = await Promise.all([
          fetch(`/api/groups${queryParam}`).then((r) => r.json()),
          fetchTeacherTasks(user?.id).catch(() => [] as StudentTask[])
        ]);

        if (groupsRes?.success && Array.isArray(groupsRes.groups)) {
          setGroups(groupsRes.groups);
        }
        setTasks(loadedTasks);

        const now = new Date();
        setLastUpdate(
          `Hari ini, ${now.getHours().toString().padStart(2, "0")}:${now
            .getMinutes()
            .toString()
            .padStart(2, "0")} WIB`
        );

        if (showToast) {
          toast.success("Data kesiapan & perkembangan siswa berhasil diperbarui!");
        }
      } catch (err) {
        console.error("Gagal memuat analitik guru:", err);
        if (showToast) toast.error("Gagal memperbarui data dari server.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [user?.id]
  );

  useEffect(() => {
    loadAnalyticsData(false);
  }, [loadAnalyticsData]);

  // Gabungkan siswa unik sesuai rombel yang dipilih
  const scopedStudents = useMemo(() => {
    const targetGroups =
      selectedGroupId === "all" ? groups : groups.filter((g) => g.id === selectedGroupId);

    const map = new Map<string, { student: StudentProfile; groupId: string; groupName: string }>();
    targetGroups.forEach((g) => {
      (g.students || []).forEach((s) => {
        if (!map.has(s.id)) {
          map.set(s.id, { student: s, groupId: g.id, groupName: g.name });
        }
      });
    });

    return Array.from(map.values());
  }, [groups, selectedGroupId]);

  // Tugas yang sesuai dengan rombel & kategori terpilih
  const scopedTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchGroup = selectedGroupId === "all" || t.groupId === selectedGroupId;
      const matchCategory = selectedCategory === "all" || t.subject === selectedCategory;
      return matchGroup && matchCategory;
    });
  }, [tasks, selectedGroupId, selectedCategory]);

  // Daftar kategori unik dari tugas & rombel
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (t.subject) set.add(t.subject);
    });
    groups.forEach((g) => {
      (g.subjects || []).forEach((s) => set.add(s));
    });
    return Array.from(set);
  }, [tasks, groups]);

  // Agregasi performa per Kategori & Judul Kuis (dari data real task_submissions)
  const categoryStats = useMemo(() => {
    const catMap = new Map<
      string,
      { category: string; totalScore: number; count: number; quizzes: Set<string> }
    >();

    scopedTasks.forEach((t) => {
      const cat = t.subject || "Umum";
      const completedSubs = (t.submissions || []).filter(
        (s) => s.status === "selesai" && typeof s.score === "number"
      );
      if (completedSubs.length > 0) {
        const current = catMap.get(cat) || {
          category: cat,
          totalScore: 0,
          count: 0,
          quizzes: new Set<string>()
        };
        completedSubs.forEach((s) => {
          current.totalScore += s.score as number;
          current.count += 1;
        });
        current.quizzes.add(t.quizTitle || t.title);
        catMap.set(cat, current);
      }
    });

    return Array.from(catMap.values())
      .map((entry) => ({
        category: entry.category,
        avgScore: Math.round(entry.totalScore / entry.count),
        submissionCount: entry.count,
        quizCount: entry.quizzes.size
      }))
      .sort((a, b) => a.avgScore - b.avgScore);
  }, [scopedTasks]);

  // Kuis dengan rata-rata terendah (untuk rekomendasi latihan/remedial)
  const lowPerformingQuizzes = useMemo(() => {
    return scopedTasks
      .filter((t) => t.averageScore > 0 && t.averageScore < t.passingScore)
      .map((t) => {
        const belowCount = (t.submissions || []).filter(
          (s) => s.status === "selesai" && typeof s.score === "number" && s.score < t.passingScore
        ).length;
        return {
          id: t.id,
          title: t.quizTitle || t.title,
          category: t.subject,
          avgScore: t.averageScore,
          passingScore: t.passingScore,
          belowCount
        };
      })
      .slice(0, 3);
  }, [scopedTasks]);

  // Hitung metrik kesiapan biner (Siap vs Belum Siap)
  const { readyStudents, notReadyStudents, classAverageScore } = useMemo(() => {
    const ready: typeof scopedStudents = [];
    const notReady: typeof scopedStudents = [];
    let scoreSum = 0;
    let scoreCount = 0;

    scopedStudents.forEach((item) => {
      const score = item.student.predictedExamScore ?? item.student.accuracyRate ?? 0;
      if (score > 0) {
        scoreSum += score;
        scoreCount += 1;
      }
      if (score >= 75) {
        ready.push(item);
      } else {
        notReady.push(item);
      }
    });

    return {
      readyStudents: ready,
      notReadyStudents: notReady,
      classAverageScore: scoreCount > 0 ? (scoreSum / scoreCount).toFixed(1) : "0.0"
    };
  }, [scopedStudents]);

  // Filter tabel siswa
  const filteredTableStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return scopedStudents
      .filter((item) => {
        const score = item.student.predictedExamScore ?? item.student.accuracyRate ?? 0;
        const isReady = score >= 75;
        if (readinessFilter === "siap" && !isReady) return false;
        if (readinessFilter === "belum_siap" && isReady) return false;
        if (
          q &&
          !item.student.fullname.toLowerCase().includes(q) &&
          !item.student.username.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const sa = a.student.predictedExamScore ?? a.student.accuracyRate ?? 0;
        const sb = b.student.predictedExamScore ?? b.student.accuracyRate ?? 0;
        return sa - sb;
      });
  }, [scopedStudents, readinessFilter, searchQuery]);

  const notReadyIds = notReadyStudents.map((item) => item.student.id).join(",");
  const remedialHref = `/dashboard/teacher/tasks?remedial=1${
    selectedGroupId !== "all" ? `&groupId=${encodeURIComponent(selectedGroupId)}` : ""
  }${notReadyIds ? `&studentIds=${encodeURIComponent(notReadyIds)}` : ""}&title=${encodeURIComponent(
    "Remedial Kesiapan Ujian"
  )}`;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Perkembangan Belajar Siswa</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pantau kesiapan ujian, perkiraan nilai, dan performa kuis siswa secara real-time
          </p>
        </div>

        {/* Filter Rombel & Kategori + Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
            <SelectTrigger className="w-40 h-9 text-xs rounded-xl">
              <SelectValue placeholder="Semua Kelas" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="text-xs">
                Semua Kelas
              </SelectItem>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id} className="text-xs">
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40 h-9 text-xs rounded-xl">
              <SelectValue placeholder="Semua Kategori" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="text-xs">
                Semua Kategori
              </SelectItem>
              {availableCategories.map((cat) => (
                <SelectItem key={cat} value={cat} className="text-xs">
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={() => loadAnalyticsData(true)}
            disabled={isRefreshing}
            className="h-9 rounded-xl gap-1.5 text-xs bg-orange-600 hover:bg-orange-700 text-white shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? "Memperbarui..." : "Perbarui Data"}</span>
          </Button>
        </div>
      </div>

      {/* Status Pembaruan Terakhir */}
      <Card className="rounded-2xl border bg-card/60 px-4 py-3 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4 text-orange-500" />
            <span>
              Terakhir Diperbarui: <strong className="text-foreground">{lastUpdate}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4 text-blue-500" />
            <span>
              Total Siswa Dievaluasi:{" "}
              <strong className="text-foreground">{scopedStudents.length} Siswa</strong>
            </span>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground border rounded-2xl bg-card">
          <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
          <span>Memuat data perkembangan siswa...</span>
        </div>
      ) : (
        <>
          {/* 3 KARTU INFORMASI UTAMA */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* KARTU 1: PERFORMA PER KATEGORI */}
            <Card className="rounded-2xl border shadow-sm flex flex-col justify-between">
              <div>
                <CardHeader className="p-5 pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold text-foreground">
                      Performa per Kategori
                    </CardTitle>
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                  {categoryStats.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      Belum ada data nilai tugas yang terkumpul pada kategori ini.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {categoryStats.map((item) => {
                        const barColor =
                          item.avgScore >= 80
                            ? "bg-emerald-500"
                            : item.avgScore >= 75
                            ? "bg-blue-500"
                            : item.avgScore >= 60
                            ? "bg-amber-500"
                            : "bg-red-500";

                        return (
                          <div key={item.category} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground font-medium">
                                {item.category}{" "}
                                <span className="text-[10px]">({item.quizCount} kuis)</span>
                              </span>
                              <strong className="text-foreground">{item.avgScore}</strong>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${barColor}`}
                                style={{ width: `${Math.min(100, item.avgScore)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </div>
            </Card>

            {/* KARTU 2: KESIAPAN UJIAN (SIAP VS BELUM SIAP) */}
            <Card className="rounded-2xl border shadow-sm flex flex-col justify-between">
              <div>
                <CardHeader className="p-5 pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold text-foreground">
                      Perkiraan Nilai & Kesiapan Ujian
                    </CardTitle>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                  <div className="p-4 rounded-2xl bg-muted/40 border text-center space-y-1">
                    <span className="text-xs text-muted-foreground">Rata-rata Nilai Kelas</span>
                    <div className="text-3xl font-black text-foreground">
                      {classAverageScore}{" "}
                      <span className="text-sm font-normal text-muted-foreground">/ 100</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        setReadinessFilter((prev) => (prev === "siap" ? "all" : "siap"))
                      }
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                        readinessFilter === "siap"
                          ? "bg-emerald-100 border-emerald-400 dark:bg-emerald-950/60"
                          : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 hover:border-emerald-300"
                      }`}
                    >
                      <span className="text-emerald-800 dark:text-emerald-200 font-semibold">
                        Siap
                      </span>
                      <strong className="text-emerald-700 dark:text-emerald-300">
                        {readyStudents.length} Siswa
                      </strong>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setReadinessFilter((prev) => (prev === "belum_siap" ? "all" : "belum_siap"))
                      }
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                        readinessFilter === "belum_siap"
                          ? "bg-amber-100 border-amber-400 dark:bg-amber-950/60"
                          : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 hover:border-amber-300"
                      }`}
                    >
                      <span className="text-amber-800 dark:text-amber-200 font-semibold">
                        Belum Siap
                      </span>
                      <strong className="text-amber-700 dark:text-amber-300">
                        {notReadyStudents.length} Siswa
                      </strong>
                    </button>
                  </div>
                </CardContent>
              </div>
            </Card>

            {/* KARTU 3: BANTUAN & REKOMENDASI REMEDIAL */}
            <Card className="rounded-2xl border shadow-sm flex flex-col justify-between">
              <div>
                <CardHeader className="p-5 pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold text-foreground">
                      Bantuan & Latihan Tambahan
                    </CardTitle>
                    <BookOpen className="w-4 h-4 text-orange-600" />
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-3">
                  {lowPerformingQuizzes.length === 0 && notReadyStudents.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground">
                      Seluruh siswa berada di jalur yang baik dan siap menghadapi ujian.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {lowPerformingQuizzes.map((q) => (
                        <div key={q.id} className="p-3 rounded-xl border bg-card space-y-1">
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-semibold text-foreground truncate">
                              {q.title}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px] text-rose-600 border-rose-200 shrink-0"
                            >
                              Rata-rata {q.avgScore}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {q.category} • {q.belowCount} siswa di bawah KKM ({q.passingScore})
                          </p>
                        </div>
                      ))}

                      {notReadyStudents.length > 0 && (
                        <div className="p-3 rounded-xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200/70 space-y-2">
                          <div className="text-xs font-semibold text-foreground">
                            {notReadyStudents.length} Siswa Belum Siap Ujian
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-2">
                            {notReadyStudents.map((s) => s.student.fullname).join(", ")}
                          </p>
                          <Link href={remedialHref} className="block pt-1">
                            <Button
                              size="sm"
                              className="w-full h-8 rounded-xl text-xs gap-1.5 bg-orange-600 hover:bg-orange-700 text-white"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Buat Tugas Remedial ({notReadyStudents.length} Siswa)</span>
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </div>
            </Card>
          </div>

          {/* TABEL RINCIAN SISWA */}
          <Card className="rounded-2xl border shadow-sm overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-600" />
                Daftar Nilai & Kesiapan Siswa
              </CardTitle>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-52">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Cari siswa..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs rounded-xl"
                  />
                </div>

                <Select
                  value={readinessFilter}
                  onValueChange={(v) => setReadinessFilter(v as "all" | "siap" | "belum_siap")}
                >
                  <SelectTrigger className="w-36 h-8 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all" className="text-xs">
                      Semua Status
                    </SelectItem>
                    <SelectItem value="siap" className="text-xs">
                      Siap
                    </SelectItem>
                    <SelectItem value="belum_siap" className="text-xs">
                      Belum Siap
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {filteredTableStudents.length === 0 ? (
                <div className="p-10 text-center text-xs text-muted-foreground">
                  Tidak ada siswa yang sesuai dengan filter saat ini.
                </div>
              ) : (
                <div className="divide-y overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/40 text-muted-foreground text-left font-medium border-b">
                        <th className="p-3 pl-5">Nama Siswa</th>
                        <th className="p-3">Kelas</th>
                        <th className="p-3">Ketepatan Jawaban</th>
                        <th className="p-3">Perkiraan Nilai</th>
                        <th className="p-3">Kesiapan</th>
                        <th className="p-3 pr-5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredTableStudents.map(({ student: std, groupId, groupName }) => {
                        const score = std.predictedExamScore ?? std.accuracyRate ?? 0;
                        const isReady = score >= 75;

                        return (
                          <tr
                            key={std.id}
                            className="hover:bg-muted/30 transition-colors cursor-pointer"
                            onClick={() =>
                              router.push(
                                `/dashboard/teacher/students/${encodeURIComponent(std.id)}`
                              )
                            }
                          >
                            <td className="p-3 pl-5">
                              <div className="flex items-center gap-2.5">
                                <Avatar className="size-8 border">
                                  <AvatarImage src={std.avatarUrl} alt={std.fullname} />
                                  <AvatarFallback className="text-[10px] bg-orange-100 text-orange-700">
                                    {std.fullname.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-semibold text-foreground">{std.fullname}</div>
                                  <div className="text-[11px] text-muted-foreground">
                                    @{std.username}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge variant="outline" className="text-[10px]">
                                {groupName}
                              </Badge>
                            </td>
                            <td className="p-3 font-semibold">{std.accuracyRate}%</td>
                            <td className="p-3">
                              <strong className="text-sm font-bold text-foreground">{score}</strong>
                            </td>
                            <td className="p-3">
                              <Badge
                                className={`text-[10px] px-2 py-0.5 ${
                                  isReady
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                    : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                                }`}
                              >
                                {isReady ? "Siap" : "Belum Siap"}
                              </Badge>
                            </td>
                            <td className="p-3 pr-5 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="inline-flex items-center gap-1.5">
                                <Link
                                  href={`/dashboard/teacher/students/${encodeURIComponent(
                                    std.id
                                  )}`}
                                >
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-[11px]"
                                  >
                                    Detail
                                  </Button>
                                </Link>
                                {!isReady && (
                                  <Link
                                    href={`/dashboard/teacher/tasks?remedial=1&groupId=${encodeURIComponent(
                                      groupId
                                    )}&studentIds=${encodeURIComponent(std.id)}`}
                                  >
                                    <Button
                                      size="sm"
                                      className="h-7 px-2.5 text-[11px] bg-orange-600 hover:bg-orange-700 text-white rounded-lg"
                                    >
                                      Remedial
                                    </Button>
                                  </Link>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

    </div>
  );
}
