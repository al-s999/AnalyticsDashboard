"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Send,
  Sparkles,
  Target,
  AlertTriangle
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { AcademicGroup, StudentProfile, StudentTask } from "@/data/students-data";
import { useAnalyticsAuth } from "@/contexts/analytics-auth-context";
import { fetchTeacherTasks } from "@/lib/tasks/client";
import { getSubmissionStatusLabel } from "@/lib/tasks/utils";
import { toast } from "sonner";

export default function StudentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const studentId = params?.id;
  const { user } = useAnalyticsAuth();

  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [groupInfo, setGroupInfo] = useState<{ id: string; name: string } | null>(null);
  const [tasks, setTasks] = useState<StudentTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    const loadStudentData = async () => {
      setIsLoading(true);
      try {
        const queryParam = user?.id ? `?creator_id=${encodeURIComponent(user.id)}` : "";
        const [groupsRes, loadedTasks] = await Promise.all([
          fetch(`/api/groups${queryParam}`).then((r) => r.json()),
          fetchTeacherTasks(user?.id).catch(() => [] as StudentTask[])
        ]);

        setTasks(loadedTasks);

        let foundStudent: StudentProfile | null = null;
        let foundGroup: { id: string; name: string } | null = null;

        if (groupsRes?.success && Array.isArray(groupsRes.groups)) {
          for (const g of groupsRes.groups as AcademicGroup[]) {
            const match = (g.students || []).find((s) => s.id === studentId);
            if (match) {
              foundStudent = match;
              foundGroup = { id: g.id, name: g.name };
              break;
            }
          }
        }

        // Fallback dari submissions tugas jika belum ketemu di rombel
        if (!foundStudent) {
          for (const t of loadedTasks) {
            const sub = (t.submissions || []).find((s) => s.studentId === studentId);
            if (sub) {
              const score = typeof sub.score === "number" ? sub.score : 0;
              foundStudent = {
                id: sub.studentId,
                username: sub.studentUsername,
                fullname: sub.studentName,
                email: `${sub.studentUsername}@gameforsmart.com`,
                avatarUrl: sub.avatarUrl,
                grade: t.groupName,
                schoolNpsn: "",
                schoolName: "",
                accuracyRate: score,
                predictedExamScore: score,
                readinessStatus: score >= 75 ? "Baik" : score >= 65 ? "Cukup" : "Kurang",
                unmasteredTopics: sub.unmasteredSubtopics || [],
                completedTasksCount: sub.status === "selesai" ? 1 : 0,
                totalAssignedTasks: 1,
                lastActive: sub.submittedAt || "-"
              };
              foundGroup = { id: t.groupId, name: t.groupName };
              break;
            }
          }
        }

        setStudent(foundStudent);
        setGroupInfo(foundGroup);
      } catch (err) {
        console.error("Gagal memuat detail siswa:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadStudentData();
  }, [studentId, user?.id]);

  const studentTasksHistory = useMemo(() => {
    if (!student) return [];
    const list: {
      taskId: string;
      title: string;
      quizTitle: string;
      category: string;
      type: "reguler" | "prescriptive_remedial";
      passingScore: number;
      deadline: string;
      status: "selesai" | "sedang_mengerjakan" | "belum_mulai";
      score?: number;
      timeSpentMinutes?: number;
      submittedAt?: string;
    }[] = [];

    tasks.forEach((task) => {
      const sub = task.submissions?.find((s) => s.studentId === student.id);
      if (sub) {
        list.push({
          taskId: task.id,
          title: task.title,
          quizTitle: task.quizTitle || task.title,
          category: task.subject || "Umum",
          type: task.type,
          passingScore: task.passingScore,
          deadline: task.deadline,
          status: sub.status,
          score: sub.score,
          timeSpentMinutes: sub.timeSpentMinutes,
          submittedAt: sub.submittedAt
        });
      }
    });

    return list;
  }, [student, tasks]);

  const categoryPerformance = useMemo(() => {
    const map = new Map<
      string,
      { category: string; totalScore: number; count: number; lowQuizzes: string[] }
    >();

    studentTasksHistory.forEach((item) => {
      if (item.status === "selesai" && typeof item.score === "number") {
        const current = map.get(item.category) || {
          category: item.category,
          totalScore: 0,
          count: 0,
          lowQuizzes: []
        };
        current.totalScore += item.score;
        current.count += 1;
        if (item.score < item.passingScore && !current.lowQuizzes.includes(item.quizTitle)) {
          current.lowQuizzes.push(item.quizTitle);
        }
        map.set(item.category, current);
      }
    });

    return Array.from(map.values()).map((entry) => ({
      category: entry.category,
      avgScore: Math.round(entry.totalScore / entry.count),
      quizCount: entry.count,
      lowQuizzes: entry.lowQuizzes
    }));
  }, [studentTasksHistory]);

  const avgTimeMinutes = useMemo(() => {
    const durations = studentTasksHistory
      .map((t) => t.timeSpentMinutes)
      .filter((d): d is number => typeof d === "number" && d > 0);
    if (durations.length === 0) return null;
    return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
  }, [studentTasksHistory]);

  if (isLoading) {
    return (
      <div className="p-20 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
        <span>Memuat detail siswa...</span>
      </div>
    );
  }

  if (!student) {
    return (
      <Card className="rounded-2xl border p-12 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
        <h2 className="text-base font-bold">Siswa Tidak Ditemukan</h2>
        <p className="text-xs text-muted-foreground">
          Data siswa tidak tersedia atau belum terdaftar pada kelas Anda.
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.back()}
          className="rounded-xl text-xs"
        >
          Kembali
        </Button>
      </Card>
    );
  }

  const predictedScore = student.predictedExamScore ?? student.accuracyRate ?? 0;
  const isReady = predictedScore >= 75;
  const pendingCount = Math.max(0, student.totalAssignedTasks - student.completedTasksCount);
  const remedialHref = `/dashboard/teacher/tasks?remedial=1&studentIds=${encodeURIComponent(
    student.id
  )}${groupInfo?.id ? `&groupId=${encodeURIComponent(groupInfo.id)}` : ""}`;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Header */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali</span>
        </button>

        <Card className="rounded-2xl border shadow-xs">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <Avatar className="size-14 border shadow-xs shrink-0">
                <AvatarImage src={student.avatarUrl} alt={student.fullname} />
                <AvatarFallback className="bg-orange-100 text-orange-700 font-bold text-base">
                  {student.fullname.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight truncate">{student.fullname}</h1>
                  <Badge
                    className={`text-[10px] px-2 py-0.5 ${isReady
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                      }`}
                  >
                    {isReady ? "Siap" : "Belum Siap"}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                  <span>@{student.username}</span>
                  <span>•</span>
                  <span>{groupInfo?.name || student.grade}</span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Aktif: {student.lastActive || "-"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="h-9 text-xs rounded-xl gap-1.5"
                onClick={() =>
                  toast.success(
                    pendingCount > 0
                      ? `Pengingat ${pendingCount} tugas dikirim ke ${student.fullname}`
                      : `Notifikasi apresiasi dikirim ke ${student.fullname}`
                  )
                }
              >
                <Send className="w-3.5 h-3.5 text-orange-600" />
                <span>Kirim Pengingat</span>
              </Button>

              <Link href={remedialHref}>
                <Button
                  size="sm"
                  className="h-9 text-xs rounded-xl gap-1.5 bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <span>Buat Remedial</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4 Kartu Ringkasan KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Perkiraan Nilai Ujian</span>
              <Award className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-2xl font-black text-foreground">{predictedScore}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Akurasi Jawaban</span>
              <Target className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-foreground">{student.accuracyRate}%</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Ketuntasan Tugas</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-foreground">
              {student.completedTasksCount}
              <span className="text-sm font-normal text-muted-foreground">
                /{student.totalAssignedTasks}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Rata-rata Durasi</span>
              <Clock className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-foreground">
              {avgTimeMinutes !== null ? `${avgTimeMinutes} mnt` : "-"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performa per Kategori & Kuis */}
      <Card className="rounded-2xl border shadow-sm">
        <CardHeader className="p-5 pb-3 border-b">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-orange-600" />
            Performa per Kategori & Kuis
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          {categoryPerformance.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              Belum ada riwayat kuis yang selesai dinilai untuk siswa ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categoryPerformance.map((cat) => (
                <div key={cat.category} className="p-3.5 rounded-xl border bg-card space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{cat.category}</span>
                    <span className="font-bold text-foreground">
                      Rata-rata {cat.avgScore} ({cat.quizCount} kuis)
                    </span>
                  </div>
                  <Progress value={cat.avgScore} className="h-1.5 rounded-full" />
                  {cat.lowQuizzes.length > 0 && (
                    <div className="pt-1 flex flex-wrap gap-1">
                      {cat.lowQuizzes.map((quizTitle) => (
                        <Badge
                          key={quizTitle}
                          variant="outline"
                          className="text-[10px] bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
                        >
                          Perlu latihan: {quizTitle}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Riwayat Tugas & Remedial */}
      <Card className="rounded-2xl border shadow-sm overflow-hidden">
        <CardHeader className="p-5 pb-3 border-b">
          <CardTitle className="text-base font-bold">
            Riwayat Tugas & Remedial ({studentTasksHistory.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {studentTasksHistory.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Belum ada tugas yang diberikan kepada siswa ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-xs font-semibold pl-5">Judul Tugas</TableHead>
                    <TableHead className="text-xs font-semibold">Tipe</TableHead>
                    <TableHead className="text-xs font-semibold">Kategori</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold">Nilai</TableHead>
                    <TableHead className="text-xs font-semibold">Durasi</TableHead>
                    <TableHead className="text-xs font-semibold pr-5">Waktu Kumpul / Batas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentTasksHistory.map((item) => {
                    const isBelowKkm =
                      item.status === "selesai" &&
                      typeof item.score === "number" &&
                      item.score < item.passingScore;

                    return (
                      <TableRow key={item.taskId} className="hover:bg-muted/30 transition-colors text-xs">
                        <TableCell className="pl-5 py-3">
                          <Link
                            href={`/dashboard/teacher/tasks/${item.taskId}`}
                            className="font-semibold text-foreground hover:text-orange-600 inline-flex items-center gap-1"
                          >
                            <span>{item.title}</span>
                            <ExternalLink className="w-3 h-3 opacity-60" />
                          </Link>
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-2 py-0 border-transparent ${item.type === "prescriptive_remedial"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                              }`}
                          >
                            {item.type === "prescriptive_remedial" ? "Remedial" : "Tugas"}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-muted-foreground">{item.category}</TableCell>
                        <TableCell className="py-3">
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-2 py-0 ${item.status === "selesai"
                              ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                              : item.status === "sedang_mengerjakan"
                                ? "bg-blue-500/10 text-blue-700 border-blue-500/20"
                                : "bg-muted text-muted-foreground"
                              }`}
                          >
                            {getSubmissionStatusLabel(item.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 font-bold">
                          {item.status === "selesai" && typeof item.score === "number" ? (
                            <span className={isBelowKkm ? "text-rose-600" : "text-emerald-600"}>
                              {item.score}
                            </span>
                          ) : (
                            <span className="text-muted-foreground font-normal">-</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3 text-muted-foreground">
                          {item.timeSpentMinutes ? `${item.timeSpentMinutes} mnt` : "-"}
                        </TableCell>
                        <TableCell className="py-3 pr-5 text-muted-foreground">
                          {item.submittedAt || item.deadline}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

