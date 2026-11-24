"use client";

import React, { useState, useEffect } from "react";
import {
  CheckSquare,
  Plus,
  Clock,
  Award,
  Users,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Sparkles,
  BarChart2,
  Calendar,
  Filter,
  Eye,
  FileCheck2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  INITIAL_TASKS,
  INITIAL_TEACHER_GROUPS,
  StudentTask,
  AcademicGroup,
  GAMEFORSMART_STUDENTS
} from "@/data/students-data";
import { toast } from "sonner";

export default function TeacherTasksPage() {
  const [tasks, setTasks] = useState<StudentTask[]>(INITIAL_TASKS);
  const [selectedTaskId, setSelectedTaskId] = useState<string>(INITIAL_TASKS[0]?.id || "");
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [evaluatingSubmission, setEvaluatingSubmission] = useState<any | null>(null);

  // New Task Form State
  const [newTitle, setNewTitle] = useState("");
  const [newGroupId, setNewGroupId] = useState(INITIAL_TEACHER_GROUPS[0].id);
  const [newQuizTitle, setNewQuizTitle] = useState("Kuis Eksponen & Logaritma Tingkat Lanjut");
  const [newCompetency, setNewCompetency] = useState("KD 3.1 Fungsi Eksponen dan Logaritma");
  const [newType, setNewType] = useState<"reguler" | "prescriptive_remedial">("reguler");
  const [newTargetScope, setNewTargetScope] = useState<"all" | "remedial_only">("all");
  const [newDeadline, setNewDeadline] = useState("2026-12-05 23:59 WIB");
  const [newPassingScore, setNewPassingScore] = useState(75);

  const activeTask = tasks.find((t) => t.id === selectedTaskId) || tasks[0] || null;

  // Handler: Buat Penugasan Baru
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error("Judul penugasan wajib diisi.");
      return;
    }

    const group = INITIAL_TEACHER_GROUPS.find((g) => g.id === newGroupId) || INITIAL_TEACHER_GROUPS[0];
    
    // Tentukan target siswa
    let targetStudents = group.students;
    if (newTargetScope === "remedial_only") {
      targetStudents = group.students.filter(
        (s) => s.readinessStatus === "Perlu Pendampingan" || s.readinessStatus === "Kritis" || s.unmasteredTopics.length > 0
      );
      if (targetStudents.length === 0) {
        targetStudents = group.students.slice(0, 2);
      }
    }

    const newTask: StudentTask = {
      id: `task-${Date.now().toString(36)}`,
      title: newTitle.trim(),
      quizId: `quiz-${Date.now().toString(36)}`,
      subject: group.subject,
      groupId: group.id,
      groupName: group.name,
      type: newType,
      targetCompetency: newCompetency,
      deadline: newDeadline,
      passingScore: newPassingScore,
      totalAssigned: targetStudents.length,
      completedCount: 0,
      inProgressCount: 0,
      notStartedCount: targetStudents.length,
      averageScore: 0,
      createdAt: new Date().toISOString().split("T")[0],
      submissions: targetStudents.map((s) => ({
        studentId: s.id,
        studentName: s.fullname,
        studentUsername: s.username,
        avatarUrl: s.avatarUrl,
        status: "belum_mulai",
        unmasteredSubtopics: s.unmasteredTopics
      }))
    };

    setTasks([newTask, ...tasks]);
    setSelectedTaskId(newTask.id);
    setIsCreateTaskOpen(false);
    setNewTitle("");
    toast.success(`Penugasan "${newTask.title}" berhasil dibagikan ke ${targetStudents.length} siswa!`);
  };

  // Handler: Beri Rekomendasi Remedial Instan
  const handleTriggerRemedial = (studentName: string, unmasteredTopic: string) => {
    toast.success(
      `Paket kuis remedial untuk topik "${unmasteredTopic || 'Materi Prasyarat'}" otomatis dikirim ke @${studentName}.`
    );
    setEvaluatingSubmission(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Penugasan Task & Monitoring</h1>
            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 dark:bg-orange-950/40">
              Evaluasi Hasil
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Berikan tugas kuis GameForSmart ke siswa grup, pantau progres pengerjaan secara langsung, dan evaluasi capaian kompetensi.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateTaskOpen(true)}
          className="rounded-xl gap-2 bg-orange-600 hover:bg-orange-700 text-white shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Penugasan Baru</span>
        </Button>
      </div>

      {/* Task List Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.map((task) => {
          const isSelected = task.id === selectedTaskId;
          const percentCompleted =
            task.totalAssigned > 0
              ? Math.round((task.completedCount / task.totalAssigned) * 100)
              : 0;

          return (
            <Card
              key={task.id}
              onClick={() => setSelectedTaskId(task.id)}
              className={`cursor-pointer rounded-2xl transition-all border ${
                isSelected
                  ? "ring-2 ring-orange-500 border-orange-500 bg-orange-50/20 dark:bg-orange-950/20"
                  : "hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`text-[10px] px-2 py-0 ${
                          task.type === "prescriptive_remedial"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                        }`}
                      >
                        {task.type === "prescriptive_remedial" ? "Preskriptif Remedial" : "Reguler"}
                      </Badge>
                      <span className="text-xs font-semibold text-muted-foreground">
                        {task.groupName}
                      </span>
                    </div>
                    <CardTitle className="text-base font-bold text-foreground mt-1.5">
                      {task.title}
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    KKM: {task.passingScore}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-2 space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-orange-500" />
                    Batas: {task.deadline}
                  </span>
                  <span className="font-semibold text-foreground">
                    {task.completedCount}/{task.totalAssigned} Selesai ({percentCompleted}%)
                  </span>
                </div>

                <Progress value={percentCompleted} className="h-2 rounded-full" />

                <div className="flex items-center justify-between text-xs pt-1 border-t text-muted-foreground">
                  <span>Target: {task.targetCompetency}</span>
                  {task.averageScore > 0 && (
                    <span className="font-bold text-foreground">
                      Rerata Nilai: {task.averageScore}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Active Task Details & Submissions Evaluation Table */}
      {activeTask && (
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="p-5 pb-3 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge
                  className={`text-[10px] px-2 py-0.5 ${
                    activeTask.type === "prescriptive_remedial"
                      ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                  }`}
                >
                  {activeTask.type === "prescriptive_remedial" ? "Remedial Preskriptif" : "Penugasan Reguler"}
                </Badge>
                <span className="text-xs text-muted-foreground">{activeTask.groupName}</span>
              </div>
              <CardTitle className="text-lg font-bold text-foreground mt-1">
                {activeTask.title}
              </CardTitle>
              <CardDescription className="text-xs">
                Target Kompetensi: <strong className="text-foreground">{activeTask.targetCompetency}</strong>
              </CardDescription>
            </div>

            <div className="flex items-center gap-4 text-xs bg-muted/30 p-2.5 rounded-xl border">
              <div>
                <span className="text-muted-foreground block text-[10px]">Tuntas:</span>
                <span className="font-bold text-emerald-600 text-sm">
                  {activeTask.completedCount} Siswa
                </span>
              </div>
              <div className="h-6 w-px bg-border" />
              <div>
                <span className="text-muted-foreground block text-[10px]">Sedang Pengerjaan:</span>
                <span className="font-bold text-blue-600 text-sm">
                  {activeTask.inProgressCount} Siswa
                </span>
              </div>
              <div className="h-6 w-px bg-border" />
              <div>
                <span className="text-muted-foreground block text-[10px]">Belum Mulai:</span>
                <span className="font-bold text-muted-foreground text-sm">
                  {activeTask.notStartedCount} Siswa
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="divide-y overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/40 text-muted-foreground text-left font-medium border-b">
                    <th className="p-3 pl-5">Siswa</th>
                    <th className="p-3">Status Pengerjaan</th>
                    <th className="p-3">Nilai Kuis</th>
                    <th className="p-3">Waktu Selesai</th>
                    <th className="p-3">Materi Belum Dikuasai</th>
                    <th className="p-3 pr-5 text-right">Evaluasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {activeTask.submissions.map((sub) => {
                    const isPassing = sub.score !== undefined && sub.score >= activeTask.passingScore;
                    return (
                      <tr key={sub.studentId} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 pl-5">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="w-8 h-8 border">
                              <AvatarImage src={sub.avatarUrl} alt={sub.studentName} />
                              <AvatarFallback>{sub.studentName.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="font-semibold text-foreground block">{sub.studentName}</span>
                              <span className="text-[11px] text-muted-foreground">@{sub.studentUsername}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          {sub.status === "selesai" ? (
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 gap-1 text-[10px]">
                              <CheckCircle2 className="w-3 h-3" /> Selesai
                            </Badge>
                          ) : sub.status === "sedang_mengerjakan" ? (
                            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 gap-1 text-[10px] animate-pulse">
                              <Clock className="w-3 h-3" /> Sedang Dikerjakan
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">
                              Belum Mulai
                            </Badge>
                          )}
                        </td>
                        <td className="p-3">
                          {sub.score !== undefined ? (
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`font-bold text-sm ${
                                  isPassing ? "text-emerald-600" : "text-red-600"
                                }`}
                              >
                                {sub.score}
                              </span>
                              <span className="text-[10px] text-muted-foreground">/ 100</span>
                              {isPassing ? (
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] px-1 py-0">
                                  Tuntas
                                </Badge>
                              ) : (
                                <Badge className="bg-red-50 text-red-700 border-red-200 text-[9px] px-1 py-0">
                                  Remedial
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {sub.submittedAt ? (
                            <div>
                              <span className="text-foreground block">{sub.submittedAt}</span>
                              <span className="text-[10px]">{sub.timeSpentMinutes} Menit pengerjaan</span>
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="p-3 max-w-xs">
                          {sub.unmasteredSubtopics && sub.unmasteredSubtopics.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {sub.unmasteredSubtopics.map((t, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="text-[10px] bg-amber-50 text-amber-700 border-amber-200"
                                >
                                  {t}
                                </Badge>
                              ))}
                            </div>
                          ) : sub.status === "selesai" ? (
                            <span className="text-emerald-600 text-[11px] font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Tuntas Penuh
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-[11px]">-</span>
                          )}
                        </td>
                        <td className="p-3 pr-5 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEvaluatingSubmission(sub)}
                            className="h-7 text-[11px] rounded-xl gap-1 text-orange-600 hover:text-orange-700 border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-950/40"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Evaluasi</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MODAL 1: BUAT PENUGASAN TASK BARU */}
      <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
        <DialogContent className="sm:max-w-[500px] p-6 rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-orange-600" />
              Buat Penugasan Task Baru
            </DialogTitle>
            <DialogDescription className="text-xs">
              Pilih kuis dari GameForSmart dan targetkan ke seluruh kelas atau kelompok intervensi remedial.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTask} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Judul Penugasan</Label>
              <Input
                placeholder="Contoh: Latihan Mandiri: Eksponen & Logaritma"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Grup Kelas Sasaran</Label>
                <Select value={newGroupId} onValueChange={(v) => setNewGroupId(v)}>
                  <SelectTrigger className="rounded-xl text-xs">
                    <SelectValue placeholder="Pilih Grup" />
                  </SelectTrigger>
                  <SelectContent>
                    {INITIAL_TEACHER_GROUPS.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Tipe Penugasan</Label>
                <Select
                  value={newType}
                  onValueChange={(v: any) => setNewType(v)}
                >
                  <SelectTrigger className="rounded-xl text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reguler">Reguler Seluruh Kelas</SelectItem>
                    <SelectItem value="prescriptive_remedial">Preskriptif Remedial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Pilih Kuis GameForSmart</Label>
              <Select value={newQuizTitle} onValueChange={(v) => setNewQuizTitle(v)}>
                <SelectTrigger className="rounded-xl text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Kuis Eksponen & Logaritma Tingkat Lanjut">
                    Kuis Eksponen & Logaritma Tingkat Lanjut (15 Soal)
                  </SelectItem>
                  <SelectItem value="Latihan Aljabar & Persamaan Linear">
                    Latihan Aljabar & Persamaan Linear (10 Soal)
                  </SelectItem>
                  <SelectItem value="Kuis Trigonometri Dasar Segitiga Siku-Siku">
                    Kuis Trigonometri Dasar Segitiga Siku-Siku (12 Soal)
                  </SelectItem>
                  <SelectItem value="Remedial Terarah: Operasi Bentuk Akar">
                    Remedial Terarah: Operasi Bentuk Akar (8 Soal)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Target Sasaran Siswa</Label>
              <Select
                value={newTargetScope}
                onValueChange={(v: any) => setNewTargetScope(v)}
              >
                <SelectTrigger className="rounded-xl text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Seluruh Siswa dalam Grup</SelectItem>
                  <SelectItem value="remedial_only">
                    Siswa Belum Tuntas / Butuh Pendampingan Saja
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Batas Waktu (Deadline)</Label>
                <Input
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Nilai KKM Minimal</Label>
                <Input
                  type="number"
                  value={newPassingScore}
                  onChange={(e) => setNewPassingScore(parseInt(e.target.value) || 75)}
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateTaskOpen(false)}
                className="rounded-xl text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="rounded-xl text-xs bg-orange-600 hover:bg-orange-700 text-white"
              >
                Tugaskan Sekarang
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: EVALUASI DETAIL SISWA */}
      <Dialog open={!!evaluatingSubmission} onOpenChange={(open) => !open && setEvaluatingSubmission(null)}>
        {evaluatingSubmission && (
          <DialogContent className="sm:max-w-[480px] p-6 rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-orange-600" />
                Evaluasi Capaian Siswa
              </DialogTitle>
              <DialogDescription className="text-xs">
                {evaluatingSubmission.studentName} (@{evaluatingSubmission.studentUsername})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-2">
              <div className="p-4 rounded-2xl bg-muted/40 border space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>Skor Perolehan:</span>
                  <strong className="text-base text-foreground font-bold">
                    {evaluatingSubmission.score ?? "-"} / 100
                  </strong>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Status:</span>
                  <Badge
                    className={`text-[10px] ${
                      evaluatingSubmission.status === "selesai"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {evaluatingSubmission.status}
                  </Badge>
                </div>
                {evaluatingSubmission.timeSpentMinutes && (
                  <div className="flex items-center justify-between text-xs">
                    <span>Durasi Pengerjaan:</span>
                    <span>{evaluatingSubmission.timeSpentMinutes} menit</span>
                  </div>
                )}
              </div>

              {/* Rekomendasi Preskriptif Intervensi */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  Rekomendasi Preskriptif Otomatis:
                </h4>
                {evaluatingSubmission.unmasteredSubtopics &&
                evaluatingSubmission.unmasteredSubtopics.length > 0 ? (
                  <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 text-xs text-orange-900 dark:text-orange-200 space-y-2">
                    <p className="leading-relaxed">
                      Siswa belum mencapai target kompetensi pada subtopik:{" "}
                      <strong>{evaluatingSubmission.unmasteredSubtopics.join(", ")}</strong>.
                    </p>
                    <Button
                      size="sm"
                      onClick={() =>
                        handleTriggerRemedial(
                          evaluatingSubmission.studentUsername,
                          evaluatingSubmission.unmasteredSubtopics[0]
                        )
                      }
                      className="w-full text-xs rounded-xl bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      Kirim Paket Remedial Preskriptif Sekarang
                    </Button>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-200">
                    Siswa telah menguasai seluruh indikator kompetensi pada materi ini dengan memuaskan!
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEvaluatingSubmission(null)}
                className="rounded-xl text-xs"
              >
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

