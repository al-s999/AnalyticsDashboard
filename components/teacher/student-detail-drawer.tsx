"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2,
  Clock,
  Target,
  Award,
  Send,
  Sparkles,
  BookOpen,
  ExternalLink
} from "lucide-react";
import { StudentProfile, StudentTask } from "@/data/students-data";
import { getSubmissionStatusLabel } from "@/lib/tasks/utils";
import { toast } from "sonner";

interface StudentDetailDrawerProps {
  student: StudentProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks?: StudentTask[];
  groupId?: string;
  groupName?: string;
}

export function StudentDetailDrawer({
  student,
  open,
  onOpenChange,
  tasks = [],
  groupId,
  groupName
}: StudentDetailDrawerProps) {
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

  if (!student) return null;

  const predictedScore = student.predictedExamScore ?? student.accuracyRate ?? 0;
  const isReady = predictedScore >= 75;
  const pendingCount = Math.max(0, student.totalAssignedTasks - student.completedTasksCount);
  const remedialHref = `/dashboard/teacher/tasks?remedial=1&studentIds=${encodeURIComponent(
    student.id
  )}${groupId ? `&groupId=${encodeURIComponent(groupId)}` : ""}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col">
        <SheetHeader className="p-5 pb-4 border-b bg-muted/20">
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="size-12 border shadow-xs shrink-0">
                <AvatarImage src={student.avatarUrl} alt={student.fullname} />
                <AvatarFallback className="bg-orange-100 text-orange-700 font-bold">
                  {student.fullname.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <SheetTitle className="text-base font-bold truncate">
                  {student.fullname}
                </SheetTitle>
                <SheetDescription className="text-xs flex flex-wrap items-center gap-1.5 mt-0.5">
                  <span>@{student.username}</span>
                  <span>•</span>
                  <span>{groupName || student.grade}</span>
                </SheetDescription>
                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    className={`text-[10px] px-2 py-0.5 ${isReady
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                      }`}
                  >
                    {isReady ? "Siap" : "Belum Siap"}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Aktif: {student.lastActive || "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-3">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs rounded-xl gap-1.5"
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

            <Link href={remedialHref} onClick={() => onOpenChange(false)}>
              <Button
                size="sm"
                className="h-8 text-xs rounded-xl gap-1.5 bg-orange-600 hover:bg-orange-700 text-white"
              >
                <span>Buat Remedial</span>
              </Button>
            </Link>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 p-5">
          <div className="space-y-6">
            {/* 4 Kartu Ringkasan KPI */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl border bg-card space-y-1">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Perkiraan Nilai Ujian</span>
                  <Award className="w-3.5 h-3.5 text-orange-600" />
                </div>
                <div className="text-2xl font-black text-foreground">{predictedScore}</div>
              </div>

              <div className="p-3.5 rounded-2xl border bg-card space-y-1">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Akurasi Jawaban</span>
                  <Target className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-foreground">{student.accuracyRate}%</div>
              </div>

              <div className="p-3.5 rounded-2xl border bg-card space-y-1">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Ketuntasan Tugas</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-foreground">
                  {student.completedTasksCount}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{student.totalAssignedTasks}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border bg-card space-y-1">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Rata-rata Durasi</span>
                  <Clock className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <div className="text-2xl font-black text-foreground">
                  {avgTimeMinutes !== null ? `${avgTimeMinutes} mnt` : "-"}
                </div>
              </div>
            </div>

            {/* Performa per Kategori & Kuis */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-orange-600" />
                Performa per Kategori & Kuis
              </h3>

              {categoryPerformance.length === 0 ? (
                <div className="p-4 rounded-xl border bg-muted/20 text-xs text-muted-foreground text-center">
                  Belum ada riwayat kuis yang selesai dinilai untuk siswa ini.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {categoryPerformance.map((cat) => (
                    <div key={cat.category} className="p-3 rounded-xl border bg-card space-y-2">
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
            </div>

            {/* Riwayat Pengerjaan Tugas & Remedial */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Riwayat Tugas & Remedial ({studentTasksHistory.length})
              </h3>

              {studentTasksHistory.length === 0 ? (
                <div className="p-4 rounded-xl border bg-muted/20 text-xs text-muted-foreground text-center">
                  Belum ada tugas yang diberikan kepada siswa ini.
                </div>
              ) : (
                <div className="divide-y rounded-xl border overflow-hidden bg-card">
                  {studentTasksHistory.map((item) => {
                    const isBelowKkm =
                      item.status === "selesai" &&
                      typeof item.score === "number" &&
                      item.score < item.passingScore;

                    return (
                      <div
                        key={item.taskId}
                        className="p-3 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-1.5 py-0 border-transparent ${item.type === "prescriptive_remedial"
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                                }`}
                            >
                              {item.type === "prescriptive_remedial" ? "Remedial" : "Tugas"}
                            </Badge>
                            <Link
                              href={`/dashboard/teacher/tasks/${item.taskId}`}
                              onClick={() => onOpenChange(false)}
                              className="text-xs font-semibold text-foreground hover:text-orange-600 truncate inline-flex items-center gap-1"
                            >
                              <span className="truncate">{item.title}</span>
                              <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
                            </Link>
                          </div>
                          <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-2">
                            <span>{item.category}</span>
                            {item.timeSpentMinutes ? (
                              <span>• {item.timeSpentMinutes} mnt</span>
                            ) : null}
                            {item.submittedAt ? (
                              <span>• Kumpul: {item.submittedAt}</span>
                            ) : (
                              <span>• Batas: {item.deadline}</span>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0 space-y-1">
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
                          <div className="text-xs font-bold">
                            {item.status === "selesai" && typeof item.score === "number" ? (
                              <span className={isBelowKkm ? "text-rose-600" : "text-emerald-600"}>
                                Nilai: {item.score}
                              </span>
                            ) : (
                              <span className="text-muted-foreground font-normal">-</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

