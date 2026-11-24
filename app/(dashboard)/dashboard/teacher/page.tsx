"use client";

import React, { useState, useEffect } from "react";
import { useAnalyticsAuth } from "@/contexts/analytics-auth-context";
import {
  StatCard,
  QuickActionsGrid,
  type QuickActionItem
} from "@/components/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Users,
  QrCode,
  CheckSquare,
  BarChart3,
  RefreshCw,
  ArrowRight,
  BookOpen,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  INITIAL_TEACHER_GROUPS,
  INITIAL_TASKS,
  AcademicGroup,
  StudentTask,
  StudentProfile
} from "@/data/students-data";
import { AddStudentDialog } from "@/components/groups/add-student-dialog";

export default function TeacherDashboardPage() {
  const { user } = useAnalyticsAuth();

  // State Groups & Tasks (dengan sinkronisasi localStorage)
  const [groups, setGroups] = useState<AcademicGroup[]>(INITIAL_TEACHER_GROUPS);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    INITIAL_TEACHER_GROUPS[0]?.id || "grp-10a-mat"
  );
  const [tasks, setTasks] = useState<StudentTask[]>(INITIAL_TASKS);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState("Hari ini, 07:30 WIB");

  // Modal State untuk Pop-up Scan QR & Pop-up Tambah Tugas
  const [isScanQrOpen, setIsScanQrOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  // Form State: Tambah Tugas Baru
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskGroupId, setNewTaskGroupId] = useState(selectedGroupId);
  const [newTaskQuizTitle, setNewTaskQuizTitle] = useState("Kuis Eksponen & Logaritma Tingkat Lanjut");
  const [newTaskType, setNewTaskType] = useState<"reguler" | "prescriptive_remedial">("reguler");
  const [newTaskDeadline, setNewTaskDeadline] = useState("Hari ini, 23:59 WIB");
  const [newTaskPassingScore, setNewPassingScore] = useState(75);

  // Load persistent groups & tasks if present
  useEffect(() => {
    try {
      const savedGroups = localStorage.getItem("gameforsmart_teacher_groups");
      if (savedGroups) {
        const parsed = JSON.parse(savedGroups);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setGroups(parsed);
          setSelectedGroupId(parsed[0].id);
          setNewTaskGroupId(parsed[0].id);
        }
      }
      const savedTasks = localStorage.getItem("gameforsmart_teacher_tasks");
      if (savedTasks) {
        const parsed = JSON.parse(savedTasks);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTasks(parsed);
        }
      }
    } catch (e) {
      console.warn("Error loading persisted teacher data", e);
    }
  }, []);

  const saveGroups = (updated: AcademicGroup[]) => {
    setGroups(updated);
    try {
      localStorage.setItem("gameforsmart_teacher_groups", JSON.stringify(updated));
    } catch { }
  };

  const saveTasks = (updated: StudentTask[]) => {
    setTasks(updated);
    try {
      localStorage.setItem("gameforsmart_teacher_tasks", JSON.stringify(updated));
    } catch { }
  };

  // Rombel aktif yang sedang dipilih oleh guru
  const activeGroup = groups.find((g) => g.id === selectedGroupId) || groups[0] || null;
  const groupStudents = activeGroup?.students || [];

  // Filter tugas khusus rombel aktif
  const groupTasks = tasks.filter(
    (t) => t.groupId === selectedGroupId || t.groupName === activeGroup?.name
  );

  // Metrik Diagnostik Ringkas
  const totalStudents = groupStudents.length;
  const activeStudentsCount = groupStudents.filter(
    (s) => s.lastActive.includes("menit") || s.lastActive.includes("jam")
  ).length;

  const averageClassScore =
    totalStudents > 0
      ? Math.round(groupStudents.reduce((acc, s) => acc + s.predictedExamScore, 0) / totalStudents)
      : 0;

  // Siswa yang perlu intervensi / remedial
  const atRiskStudents = groupStudents.filter(
    (s) =>
      s.readinessStatus === "Perlu Pendampingan" ||
      s.readinessStatus === "Kritis" ||
      s.unmasteredTopics.length > 0
  );

  // Topik penguasaan materi kuis
  const quizTopics = [
    {
      title: "Aljabar Linier & Matriks",
      playsCount: 68,
      mastery: 88,
      status: "Tuntas",
      color: "bg-emerald-500",
      textColor: "text-emerald-700 dark:text-emerald-400"
    },
    {
      title: "Fungsi Eksponen & Bentuk Akar",
      playsCount: 54,
      mastery: 81,
      status: "Tuntas",
      color: "bg-emerald-500",
      textColor: "text-emerald-700 dark:text-emerald-400"
    },
    {
      title: "Geometri Ruang Tiga Dimensi",
      playsCount: 46,
      mastery: 74,
      status: "Cukup",
      color: "bg-blue-500",
      textColor: "text-blue-700 dark:text-blue-400"
    },
    {
      title: "Trigonometri Sudut Istimewa",
      playsCount: 42,
      mastery: 58,
      status: "Perlu Latihan",
      color: "bg-amber-500",
      textColor: "text-amber-700 dark:text-amber-400"
    },
    {
      title: "Pertidaksamaan Rasional & Irasional",
      playsCount: 36,
      mastery: 54,
      status: "Perlu Remedial",
      color: "bg-rose-500",
      textColor: "text-rose-700 dark:text-rose-400"
    }
  ];

  // Handler: Tambah Siswa via QR Scanner
  const handleStudentAdded = (student: StudentProfile) => {
    if (!activeGroup) return;

    const updated = groups.map((g) => {
      if (g.id === activeGroup.id) {
        if (g.students.some((s) => s.id === student.id)) return g;
        return {
          ...g,
          students: [...g.students, student]
        };
      }
      return g;
    });

    saveGroups(updated);
  };

  // Handler: Buat Tugas Baru Langsung dari Pop-up Dashboard
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      toast.error("Judul tugas wajib diisi.");
      return;
    }

    const group = groups.find((g) => g.id === newTaskGroupId) || activeGroup || groups[0];
    const targetStudents = group.students;

    const newTask: StudentTask = {
      id: `task-${Date.now().toString(36)}`,
      title: newTaskTitle.trim(),
      quizId: `quiz-${Date.now().toString(36)}`,
      subject: group.subjects?.[0] || group.subject || "Matematika",
      groupId: group.id,
      groupName: group.name,
      type: newTaskType,
      targetCompetency: "",
      deadline: newTaskDeadline,
      passingScore: newTaskPassingScore,
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

    const updated = [newTask, ...tasks];
    saveTasks(updated);
    setIsCreateTaskOpen(false);
    setNewTaskTitle("");
    toast.success(`Tugas "${newTask.title}" berhasil dibuat untuk ${group.name}!`);
  };

  // Akses Cepat Menu Guru (Scan QR & Tambah Tugas langsung memicu pop-up)
  const quickActions: QuickActionItem[] = [
    {
      title: "Scan QR",
      description: "Pindai QR profil untuk tambah murid ke kelas",
      onClick: () => setIsScanQrOpen(true),
      icon: QrCode,
      color: "orange"
    },
    {
      title: "Tambah Tugas",
      description: "Tugaskan kuis GameForSmart & atur batas waktu",
      onClick: () => {
        setNewTaskGroupId(selectedGroupId);
        setIsCreateTaskOpen(true);
      },
      icon: CheckSquare,
      color: "blue"
    },
    {
      title: "Analisa",
      description: "Analisis penguasaan materi, prediksi skor & remedial",
      href: "/dashboard/teacher/analytics",
      icon: BarChart3,
      color: "yellow"
    },
    {
      title: "Kelola Siswa",
      description: "Atur daftar siswa, tahun ajaran & mapel",
      href: "/dashboard/teacher/groups",
      icon: Users,
      color: "emerald"
    }
  ];

  const handleUpdateSnapshot = () => {
    setIsUpdating(true);
    setTimeout(() => {
      setIsUpdating(false);
      const now = new Date();
      const timeStr = `Hari ini, ${now.getHours().toString().padStart(2, "0")}:${now
        .getMinutes()
        .toString()
        .padStart(2, "0")} WIB`;
      setLastUpdatedTime(timeStr);
      toast.success(`Data evaluasi ${activeGroup?.name || "kelas"} berhasil diperbarui!`);
    }, 900);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Classroom Context Switcher */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
              Dashboard
            </h1>
          </div>
        </div>

        {/* Dropdown Pemilih Kelas & Tombol Aksi */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger className="h-9 w-fit min-w-[150px] max-w-[260px] text-xs font-semibold rounded-xl bg-background border-orange-200 dark:border-zinc-800 shadow-2xs gap-2.5">
                <div className="flex items-center gap-2 truncate min-w-0">
                  <Users className="size-3.5 text-orange-600 shrink-0" />
                  <SelectValue placeholder="Pilih Kelas yang Diampu" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {groups.map((grp) => (
                  <SelectItem key={grp.id} value={grp.id} className="text-xs">
                    <span className="font-semibold">{grp.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleUpdateSnapshot}
            disabled={isUpdating}
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs rounded-xl"
            title="Perbarui data aktivitas kuis terbaru"
          >
            <RefreshCw className={`size-3.5 ${isUpdating ? "animate-spin text-orange-600" : ""}`} />
            <span>{isUpdating ? "Memproses..." : "Perbarui Data"}</span>
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setNewTaskGroupId(selectedGroupId);
              setIsCreateTaskOpen(true);
            }}
            className="h-9 gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded-xl shadow-xs cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Tambah Tugas</span>
          </Button>
        </div>
      </div>

      {/* Status Pembaruan Data */}
      <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-muted/50 border text-xs">
        <div className="flex items-center gap-2" />
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5 text-orange-600" />
          <span>
            Pembaruan terakhir: <strong className="text-foreground font-semibold">{lastUpdatedTime}</strong>
          </span>
        </div>
      </div>

      {/* 2. Row 1: KPI Metric Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Murid"
          value={totalStudents}
          icon="users"
        />

        <StatCard
          title="Rata-rata Nilai"
          value={averageClassScore}
          icon="accuracy"
        />

        <StatCard
          title="Perlu Bimbingan"
          value={`${atRiskStudents.length} Siswa`}
          icon="alert"
        />

        <StatCard
          title="Tugas Aktif"
          value={groupTasks.length}
          icon="trend"
        />
      </div>

      {/* Siswa yang Membutuhkan Bimbingan */}
      <Card className="rounded-2xl border-amber-200/90 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/15 shadow-sm overflow-hidden">
        <CardHeader className="pb-1 pt-1 px-3 border-b border-amber-200/60 dark:border-amber-900/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                <AlertTriangle className="size-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-amber-950 dark:text-amber-200">
                  Butuh Bimbingan
                </CardTitle>
              </div>
            </div>
            <Link href="/dashboard/teacher/groups">
              <Button size="sm" className="h-7 text-[11px] rounded-lg gap-1 border-amber-300 bg-background/80 hover:bg-amber-100/60 text-amber-900 dark:text-amber-200">
                <span>Lihat Semua</span>
                <ArrowRight className="size-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {atRiskStudents.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600" />
              <span>Semua siswa telah mencapai batas KKM dan menyelesaikan materi kuis.</span>
            </div>
          ) : (
            <div className="divide-y divide-amber-200/50 dark:divide-amber-900/30">
              {atRiskStudents.map((std) => {
                const pendingTasks = std.totalAssignedTasks - std.completedTasksCount;
                return (
                  <div
                    key={std.id}
                    className="p-3.5 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-background/60 hover:bg-background/90 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="size-9 border">
                        <AvatarImage src={std.avatarUrl} alt={std.fullname} />
                        <AvatarFallback className="text-xs bg-orange-100 text-orange-700">
                          {std.fullname.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-foreground truncate">
                            {std.fullname}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          Kendala:{" "}
                          <strong className="text-rose-600 font-medium">
                            {std.unmasteredTopics.length > 0
                              ? std.unmasteredTopics.join(", ")
                              : "Perlu Latihan Tambahan"}
                          </strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                      <div className="text-right">
                        <div className="text-xs font-bold text-rose-600 dark:text-rose-400">
                          Nilai: {std.accuracyRate} <span className="text-[10px] text-muted-foreground font-normal"></span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {pendingTasks > 0 ? (
                            <span className="text-amber-600 font-medium">{pendingTasks} tugas belum</span>
                          ) : (
                            <span className="text-emerald-600">Tugas lengkap</span>
                          )}
                        </div>
                      </div>

                      <Link href="/dashboard/teacher/tasks">
                        <Button
                          size="sm"
                          className="h-8 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1 shadow-2xs"
                        >
                          <span>Remedial</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Akses Cepat Menu Guru (Interaktif) */}
      <div className="space-y-2.5">
        <QuickActionsGrid actions={quickActions} />
      </div>

      {/* 4. Row 3: Penguasaan Materi & Live Tracker Tugas */}
      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-7 rounded-2xl border shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <BookOpen className="size-4 text-orange-600" />
                    Penguasaan Materi
                  </CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px] bg-muted/30">
                  Target KKM: 75%
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="space-y-3.5">
                {quizTopics.map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          ({item.playsCount} kuis)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-semibold ${item.textColor}`}>
                          {item.status}
                        </span>
                        <span className="font-bold text-foreground">{item.mastery}%</span>
                      </div>
                    </div>
                    <Progress value={item.mastery} className="h-1.5 rounded-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </div>
        </Card>

        {/* Kolom Kanan (5 Cols): Tracker Tugas Berjalan */}
        <Card className="lg:col-span-5 rounded-2xl border shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare className="size-4 text-orange-600" />
                  <CardTitle className="text-base font-bold">Tugas Berjalan</CardTitle>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {groupTasks.length} Tugas
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              {groupTasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Belum ada penugasan kuis aktif untuk rombel ini.
                </div>
              ) : (
                groupTasks.map((t) => {
                  const percentComplete =
                    t.totalAssigned > 0 ? Math.round((t.completedCount / t.totalAssigned) * 100) : 0;
                  return (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Badge
                            className={`text-[9px] px-1.5 py-0 ${t.type === "prescriptive_remedial"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                              }`}
                          >
                            {t.type === "prescriptive_remedial" ? "Remedial" : "Tugas"}
                          </Badge>
                          <h4 className="text-xs font-semibold text-foreground line-clamp-1">{t.title}</h4>
                          <span className="text-[11px] text-muted-foreground block mt-0.5">
                            Batas: {t.deadline.replace("WIB", "")}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-foreground">{percentComplete}%</span>
                          <span className="text-[10px] text-muted-foreground block">
                            {t.completedCount}/{t.totalAssigned} Siswa
                          </span>
                        </div>
                      </div>

                      <Progress value={percentComplete} className="h-1.5 rounded-full" />

                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-muted-foreground">
                          Rata-rata:{" "}
                          <strong className="text-foreground">{t.averageScore ? `${t.averageScore}` : "-"}</strong>
                        </span>
                        <Link
                          href="/dashboard/teacher/tasks"
                          className="text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-0.5"
                        >
                          <span>Detail</span>
                          <ArrowRight className="size-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </div>

          <div className="p-4 border-t bg-muted/20 rounded-b-2xl">
            <Link href="/dashboard/teacher/tasks" className="block w-full">
              <Button variant="outline" size="sm" className="w-full h-8 text-xs rounded-xl">
                <span>Kelola Semua Tugas</span>
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* POP UP 1: SCAN QR (AddStudentDialog langsung membuka tab QR) */}
      {activeGroup && (
        <AddStudentDialog
          open={isScanQrOpen}
          onOpenChange={setIsScanQrOpen}
          groupName={activeGroup.name}
          groupId={activeGroup.id}
          existingStudentIds={activeGroup.students.map((s) => s.id)}
          onStudentAdded={handleStudentAdded}
          initialTab="qr"
        />
      )}

      {/* POP UP 2: TAMBAH TUGAS (Dialog Form Tugas Baru) */}
      <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
        <DialogContent className="sm:max-w-[480px] p-5 rounded-2xl">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-orange-600" />
              Buat Tugas Baru
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateTask} className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <Label className="text-xs">Judul Tugas</Label>
              <Input
                placeholder="Contoh: Latihan Mandiri Eksponen"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                required
                className="h-8 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label className="text-xs">Kelas Sasaran</Label>
                <Select value={newTaskGroupId} onValueChange={setNewTaskGroupId}>
                  <SelectTrigger className="h-8 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Tipe</Label>
                <Select value={newTaskType} onValueChange={(v: any) => setNewTaskType(v)}>
                  <SelectTrigger className="h-8 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reguler">Tugas</SelectItem>
                    <SelectItem value="prescriptive_remedial">Remedial Terarah</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Pilih Kuis Soal</Label>
              <Select value={newTaskQuizTitle} onValueChange={setNewTaskQuizTitle}>
                <SelectTrigger className="h-8 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Kuis Eksponen & Logaritma Tingkat Lanjut">
                    Kuis Eksponen & Logaritma (15 Soal)
                  </SelectItem>
                  <SelectItem value="Latihan Aljabar & Persamaan Linear">
                    Latihan Aljabar & Linear (10 Soal)
                  </SelectItem>
                  <SelectItem value="Kuis Trigonometri Dasar Segitiga Siku-Siku">
                    Kuis Trigonometri (12 Soal)
                  </SelectItem>
                  <SelectItem value="Remedial Terarah: Operasi Bentuk Akar">
                    Remedial Operasi Bentuk Akar (8 Soal)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label className="text-xs">Batas Waktu</Label>
                <Input
                  value={newTaskDeadline}
                  onChange={(e) => setNewTaskDeadline(e.target.value)}
                  className="h-8 text-xs rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Nilai KKM</Label>
                <Input
                  type="number"
                  value={newTaskPassingScore}
                  onChange={(e) => setNewPassingScore(parseInt(e.target.value) || 75)}
                  className="h-8 text-xs rounded-xl"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateTaskOpen(false)}
                className="rounded-xl text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-xl text-xs bg-orange-600 hover:bg-orange-700 text-white"
              >
                Simpan & Tugaskan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
