"use client";

import React, { useState, useEffect } from "react";
import {
  CheckSquare,
  Plus,
  Clock,
  CheckCircle2,
  Eye,
  FileCheck2,
  Users,
  Search,
  Target,
  PlayCircle,
  HelpCircle,
  TrendingUp,
  Calendar,
  Layers,
  ChevronRight,
  MoreHorizontal,
  Edit,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  AcademicGroup
} from "@/data/students-data";
import { toast } from "sonner";

export default function TeacherTasksPage() {
  const [groups, setGroups] = useState<AcademicGroup[]>(INITIAL_TEACHER_GROUPS);
  const [tasks, setTasks] = useState<StudentTask[]>(INITIAL_TASKS);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>("all");
  const [searchTableQuery, setSearchTableQuery] = useState("");
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  // Modal State: Detail & Edit
  const [viewingDetailTask, setViewingDetailTask] = useState<StudentTask | null>(null);
  const [editingTask, setEditingTask] = useState<StudentTask | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editPassingScore, setEditPassingScore] = useState(75);
  const [editType, setEditType] = useState<"reguler" | "prescriptive_remedial">("reguler");

  // Load persistent groups & tasks from localStorage
  useEffect(() => {
    try {
      const savedGroups = localStorage.getItem("gameforsmart_teacher_groups");
      if (savedGroups) {
        const parsed = JSON.parse(savedGroups);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setGroups(parsed);
        }
      }
      const savedTasks = localStorage.getItem("gameforsmart_teacher_tasks");
      if (savedTasks) {
        const parsed = JSON.parse(savedTasks);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTasks(parsed);
        }
      }
    } catch { }
  }, []);

  const saveTasks = (updated: StudentTask[]) => {
    setTasks(updated);
    try {
      localStorage.setItem("gameforsmart_teacher_tasks", JSON.stringify(updated));
    } catch { }
  };

  // Form State: Buat Baru
  const [newTitle, setNewTitle] = useState("");
  const [newGroupId, setNewGroupId] = useState(groups[0]?.id || INITIAL_TEACHER_GROUPS[0].id);
  const [newQuizTitle, setNewQuizTitle] = useState("Kuis Eksponen & Logaritma Tingkat Lanjut");
  const [newType, setNewType] = useState<"reguler" | "prescriptive_remedial">("reguler");
  const [newTargetScope, setNewTargetScope] = useState<"all" | "remedial_only">("all");
  const [newDeadline, setNewDeadline] = useState("Hari ini, 23:59 WIB");
  const [newPassingScore, setNewPassingScore] = useState(75);

  // Filter tasks by group
  const filteredTasks = tasks.filter(
    (t) => selectedGroupFilter === "all" || t.groupId === selectedGroupFilter
  );

  // Tugas Hari Ini
  const todayTasks = filteredTasks.slice(0, 2);

  // KPI Calculations
  const totalTasksCount = filteredTasks.length;
  const totalAssignedStudents = filteredTasks.reduce((acc, t) => acc + t.totalAssigned, 0);
  const totalCompletedSubmissions = filteredTasks.reduce((acc, t) => acc + t.completedCount, 0);
  const overallCompletionRate =
    totalAssignedStudents > 0
      ? Math.round((totalCompletedSubmissions / totalAssignedStudents) * 100)
      : 0;

  const validScores = filteredTasks.filter((t) => t.averageScore > 0);
  const avgTaskScore =
    validScores.length > 0
      ? Math.round(
        validScores.reduce((acc, t) => acc + t.averageScore, 0) / validScores.length
      )
      : 82;

  const totalNeedsRemedial = filteredTasks.reduce((acc, t) => {
    return (
      acc +
      t.submissions.filter(
        (s) =>
          (s.score !== undefined && s.score < t.passingScore) ||
          (s.unmasteredSubtopics && s.unmasteredSubtopics.length > 0)
      ).length
    );
  }, 0);

  // Handler: Buat Penugasan Baru
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error("Judul tugas wajib diisi.");
      return;
    }

    const group = groups.find((g) => g.id === newGroupId) || groups[0] || INITIAL_TEACHER_GROUPS[0];

    let targetStudents = group.students;
    if (newTargetScope === "remedial_only") {
      targetStudents = group.students.filter(
        (s) =>
          s.readinessStatus === "Perlu Pendampingan" ||
          s.readinessStatus === "Kritis" ||
          s.unmasteredTopics.length > 0
      );
      if (targetStudents.length === 0) targetStudents = group.students.slice(0, 2);
    }

    const newTask: StudentTask = {
      id: `task-${Date.now().toString(36)}`,
      title: newTitle.trim(),
      quizId: `quiz-${Date.now().toString(36)}`,
      subject: group.subjects?.[0] || group.subject || "Matematika",
      groupId: group.id,
      groupName: group.name,
      type: newType,
      targetCompetency: "",
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

    const updated = [newTask, ...tasks];
    saveTasks(updated);
    setIsCreateTaskOpen(false);
    setNewTitle("");
    toast.success(`Tugas "${newTask.title}" berhasil dibuat!`);
  };

  // Handler: Buka Modal Edit
  const handleOpenEdit = (task: StudentTask) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDeadline(task.deadline);
    setEditPassingScore(task.passingScore);
    setEditType(task.type);
  };

  // Handler: Simpan Hasil Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    if (!editTitle.trim()) {
      toast.error("Judul tugas wajib diisi.");
      return;
    }

    const updated = tasks.map((t) => {
      if (t.id === editingTask.id) {
        return {
          ...t,
          title: editTitle.trim(),
          deadline: editDeadline,
          passingScore: editPassingScore,
          type: editType
        };
      }
      return t;
    });

    saveTasks(updated);
    setEditingTask(null);
    toast.success("Tugas berhasil diperbarui.");
  };

  // Handler: Hapus Tugas
  const handleDeleteTask = (taskId: string, taskTitle: string) => {
    const confirmed = window.confirm(`Apakah Anda yakin ingin menghapus tugas "${taskTitle}"?`);
    if (!confirmed) return;

    const updated = tasks.filter((t) => t.id !== taskId);
    saveTasks(updated);
    toast.info(`Tugas "${taskTitle}" telah dihapus.`);
  };

  // Filter Table All Tasks
  const displayedAllTasks = filteredTasks.filter((t) => {
    if (!searchTableQuery) return true;
    const q = searchTableQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.groupName.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* 1. Header (Tanpa Subtitle & Desc) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Tugas</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Select value={selectedGroupFilter} onValueChange={setSelectedGroupFilter}>
            <SelectTrigger className="h-9 w-fit min-w-[140px] max-w-[220px] text-xs font-semibold rounded-xl bg-background border-orange-200 dark:border-zinc-800 shadow-2xs gap-2">
              <Users className="w-3.5 h-3.5 text-orange-600 shrink-0" />
              <SelectValue placeholder="Semua Kelas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs font-medium">
                Semua Kelas
              </SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id} className="text-xs">
                  <span className="font-semibold">{group.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={() => setIsCreateTaskOpen(true)}
            className="h-9 px-4 rounded-xl gap-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Tugas"
          value={totalTasksCount}
          icon="play"
        />

        <StatCard
          title="Rata-Rata Nilai"
          value={avgTaskScore}
          icon="target"
        />

        <StatCard
          title="Tingkat Selesai"
          value={`${overallCompletionRate}%`}
          icon="help"
        />

        <StatCard
          title="Perlu Remedial"
          value={`${totalNeedsRemedial} Siswa`}
          icon="alert"
        />
      </div>

      {/* 3. Bagian: Tugas Hari Ini */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-orange-600" />
            <h2 className="text-base font-bold text-foreground">Tugas Hari Ini</h2>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {todayTasks.length} tugas aktif hari ini
          </span>
        </div>

        {todayTasks.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground border rounded-2xl bg-card">
            Tidak ada tugas yang dijadwalkan hari ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {todayTasks.map((task) => {
              const percent =
                task.totalAssigned > 0
                  ? Math.round((task.completedCount / task.totalAssigned) * 100)
                  : 0;

              return (
                <div
                  key={task.id}
                  className="p-4 rounded-2xl border transition-all text-left flex flex-col justify-between gap-3 shadow-2xs bg-card hover:border-slate-300 dark:hover:border-zinc-700"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold px-2 py-0 border-transparent ${task.type === "prescriptive_remedial"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                            }`}
                        >
                          {task.type === "prescriptive_remedial" ? "Remedial" : "Tugas"}
                        </Badge>
                        <span className="text-xs font-semibold text-muted-foreground">
                          {task.groupName}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[11px] font-semibold">
                        KKM: {task.passingScore}
                      </Badge>
                    </div>

                    <h3 className="text-sm font-bold text-foreground line-clamp-1">{task.title}</h3>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-orange-500" />
                      Batas: {task.deadline}
                    </span>
                    <span className="font-semibold text-foreground text-[11px]">
                      {task.completedCount}/{task.totalAssigned} Siswa
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Bagian: Tabel Semua Tugas */}
      <Card className="rounded-2xl shadow-sm border overflow-hidden">
        <CardHeader className="px-5 py-2 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-orange-600" />
            <CardTitle className="text-base font-bold text-foreground">Semua Tugas</CardTitle>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari nama tugas atau kelas..."
              value={searchTableQuery}
              onChange={(e) => setSearchTableQuery(e.target.value)}
              className="h-8 pl-8 text-xs rounded-xl"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40 border-b text-xs">
                  <TableHead className="w-[50px] pl-4 font-semibold">No</TableHead>
                  <TableHead className="font-semibold">Judul Tugas</TableHead>
                  <TableHead className="font-semibold">Kelas</TableHead>
                  <TableHead className="font-semibold">Tipe</TableHead>
                  <TableHead className="text-center font-semibold">Progres Pengerjaan</TableHead>
                  <TableHead className="text-center font-semibold">Rata-Rata Nilai</TableHead>
                  <TableHead className="font-semibold">Batas Waktu</TableHead>
                  <TableHead className="pr-4 text-right font-semibold">Aksi</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {displayedAllTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                      Tidak ada tugas yang cocok dengan pencarian.
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedAllTasks.map((task, index) => {
                    const percent =
                      task.totalAssigned > 0
                        ? Math.round((task.completedCount / task.totalAssigned) * 100)
                        : 0;

                    return (
                      <TableRow
                        key={task.id}
                        className="transition-colors text-xs hover:bg-muted/40"
                      >
                        <TableCell className="pl-4 font-semibold text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-foreground">{task.title}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-semibold">
                            {task.groupName}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`text-[10px] font-medium border-transparent ${task.type === "prescriptive_remedial"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                              }`}
                          >
                            {task.type === "prescriptive_remedial" ? "Remedial" : "Tugas"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-semibold text-foreground">
                            {task.completedCount}/{task.totalAssigned}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`font-bold ${task.averageScore >= task.passingScore
                              ? "text-emerald-600"
                              : task.averageScore > 0
                                ? "text-red-600"
                                : "text-muted-foreground"
                              }`}
                          >
                            {task.averageScore > 0 ? task.averageScore : "-"}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-[11px]">
                          {task.deadline}
                        </TableCell>
                        <TableCell className="pr-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36 rounded-xl text-xs">
                              <DropdownMenuItem
                                onClick={() => setViewingDetailTask(task)}
                                className="cursor-pointer gap-2 py-1.5"
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-600" />
                                <span>Detail</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleOpenEdit(task)}
                                className="cursor-pointer gap-2 py-1.5"
                              >
                                <Edit className="w-3.5 h-3.5 text-amber-600" />
                                <span>Edit</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteTask(task.id, task.title)}
                                className="cursor-pointer gap-2 py-1.5 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/40"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal 1: Buat Tugas Baru */}
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
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="h-8 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label className="text-xs">Kelas Sasaran</Label>
                <Select value={newGroupId} onValueChange={setNewGroupId}>
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
                <Select value={newType} onValueChange={(v: any) => setNewType(v)}>
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
              <Select value={newQuizTitle} onValueChange={setNewQuizTitle}>
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
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="h-8 text-xs rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Nilai KKM</Label>
                <Input
                  type="number"
                  value={newPassingScore}
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

      {/* Modal 2: Edit Tugas */}
      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        {editingTask && (
          <DialogContent className="sm:max-w-[460px] p-5 rounded-2xl">
            <DialogHeader className="pb-2 border-b">
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Edit className="w-4 h-4 text-amber-600" />
                Edit Tugas
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 pt-2">
              <div className="space-y-1">
                <Label className="text-xs">Judul Tugas</Label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="h-8 text-xs rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-xs">Kelas</Label>
                  <Input
                    value={editingTask.groupName}
                    disabled
                    className="h-8 text-xs rounded-xl bg-muted"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Tipe</Label>
                  <Select value={editType} onValueChange={(v: any) => setEditType(v)}>
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

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-xs">Batas Waktu</Label>
                  <Input
                    value={editDeadline}
                    onChange={(e) => setEditDeadline(e.target.value)}
                    className="h-8 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Nilai KKM</Label>
                  <Input
                    type="number"
                    value={editPassingScore}
                    onChange={(e) => setEditPassingScore(parseInt(e.target.value) || 75)}
                    className="h-8 text-xs rounded-xl"
                  />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingTask(null)}
                  className="rounded-xl text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-xl text-xs bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Simpan Perubahan
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        )}
      </Dialog>

      {/* Modal 3: Detail Tugas */}
      <Dialog
        open={!!viewingDetailTask}
        onOpenChange={(open) => !open && setViewingDetailTask(null)}
      >
        {viewingDetailTask && (
          <DialogContent className="sm:max-w-[480px] p-5 rounded-2xl">
            <DialogHeader className="pb-2 border-b">
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                Detail Tugas
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 rounded-xl bg-muted/40 border space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Judul:</span>
                  <span className="font-bold text-foreground">{viewingDetailTask.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kelas:</span>
                  <span className="font-semibold text-foreground">{viewingDetailTask.groupName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipe:</span>
                  <Badge variant="outline" className="text-[10px]">
                    {viewingDetailTask.type === "prescriptive_remedial" ? "Remedial" : "Tugas"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Batas Waktu:</span>
                  <span className="text-foreground">{viewingDetailTask.deadline}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">KKM:</span>
                  <span className="font-bold text-foreground">{viewingDetailTask.passingScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pengerjaan:</span>
                  <span className="font-bold text-foreground">
                    {viewingDetailTask.completedCount} dari {viewingDetailTask.totalAssigned} Siswa Selesai
                  </span>
                </div>
                {viewingDetailTask.averageScore > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rata-Rata Nilai:</span>
                    <span className="font-bold text-emerald-600">{viewingDetailTask.averageScore}</span>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setViewingDetailTask(null)}
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
