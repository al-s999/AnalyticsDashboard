"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  QrCode,
  UserPlus,
  BookOpen,
  GraduationCap,
  Calendar,
  Search,
  Trash2,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  School,
  ArrowRight,
  Gamepad2,
  Send,
  Bell,
  Eye,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { StatCard } from "@/components/dashboard/stat-card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  INITIAL_TEACHER_GROUPS,
  AcademicGroup,
  StudentProfile,
  GAMEFORSMART_STUDENTS
} from "@/data/students-data";
import { AddStudentDialog } from "@/components/groups/add-student-dialog";
import { toast } from "sonner";
import Link from "next/link";

function getScoreGrade(score: number): string {
  if (score >= 85) return "A";
  if (score >= 75) return "B";
  if (score >= 65) return "C";
  if (score >= 55) return "D";
  return "E";
}

const AVAILABLE_SUBJECTS = [
  "Matematika Wajib",
  "Matematika Peminatan",
  "Fisika",
  "Kimia",
  "Biologi",
  "Informatika",
  "Bahasa Indonesia",
  "Bahasa Inggris",
  "IPAS"
];

export default function TeacherGroupsPage() {
  const [groups, setGroups] = useState<AcademicGroup[]>(INITIAL_TEACHER_GROUPS);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    INITIAL_TEACHER_GROUPS[0].id
  );
  const [searchStudentTerm, setSearchStudentTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [progressFilter, setProgressFilter] = useState<string>("all");
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  // New Group Form State
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupLevel, setNewGroupLevel] = useState<"SD" | "SMP" | "SMA" | "SMK">("SMA");
  const [newGroupGrade, setNewGroupGrade] = useState("Kelas 10");
  const [newGroupSubjects, setNewGroupSubjects] = useState<string[]>(["Matematika Wajib"]);
  const [newGroupYear, setNewGroupYear] = useState("2025/2026 Ganjil");

  // Load from localStorage if present
  useEffect(() => {
    try {
      const saved = localStorage.getItem("gameforsmart_teacher_groups");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = parsed.map((g: any) => ({
            ...g,
            subjects:
              Array.isArray(g.subjects) && g.subjects.length > 0
                ? g.subjects
                : g.subject
                  ? [g.subject]
                  : ["Matematika Wajib"]
          }));
          setGroups(normalized);
          setSelectedGroupId(normalized[0].id);
        }
      }
    } catch { }
  }, []);

  const saveGroups = (updated: AcademicGroup[]) => {
    setGroups(updated);
    try {
      localStorage.setItem("gameforsmart_teacher_groups", JSON.stringify(updated));
    } catch { }
  };

  const currentGroup =
    groups.find((g) => g.id === selectedGroupId) || groups[0] || null;

  // Handler: Tambah Siswa baru ke grup aktif
  const handleStudentAdded = (student: StudentProfile) => {
    if (!currentGroup) return;

    const updated = groups.map((g) => {
      if (g.id === currentGroup.id) {
        return {
          ...g,
          students: [...g.students, student]
        };
      }
      return g;
    });

    saveGroups(updated);
  };

  // Handler: Keluarkan Siswa dari grup
  const handleRemoveStudent = (studentId: string, studentName: string) => {
    if (!currentGroup) return;
    const confirm = window.confirm(
      `Keluarkan ${studentName} dari grup ${currentGroup.name}?`
    );
    if (!confirm) return;

    const updated = groups.map((g) => {
      if (g.id === currentGroup.id) {
        return {
          ...g,
          students: g.students.filter((s) => s.id !== studentId)
        };
      }
      return g;
    });

    saveGroups(updated);
    toast.info(`${studentName} telah dikeluarkan dari grup.`);
  };

  // Handler: Kirim pengingat tugas
  const handleSendReminder = (studentName: string, pendingCount: number) => {
    toast.success(`Pengingat ${pendingCount} tugas berhasil dikirimkan ke ${studentName}`);
  };

  // Handler: Buat Grup Baru
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      toast.error("Nama grup wajib diisi");
      return;
    }

    const newGroup: AcademicGroup = {
      id: `grp-${Date.now().toString(36)}`,
      name: newGroupName.trim(),
      level: newGroupLevel,
      grade: newGroupGrade,
      subjects: newGroupSubjects.length > 0 ? newGroupSubjects : ["Matematika Wajib"],
      subject: newGroupSubjects[0] || "Matematika Wajib",
      academicYear: newGroupYear,
      teacherId: "demo-teacher-01",
      schoolNpsn: "20532247",
      students: [],
      createdAt: new Date().toISOString().split("T")[0]
    };

    const updated = [...groups, newGroup];
    saveGroups(updated);
    setSelectedGroupId(newGroup.id);
    setIsCreateGroupOpen(false);
    setNewGroupName("");
    setNewGroupSubjects(["Matematika Wajib"]);
    toast.success(`Rombel "${newGroup.name}" berhasil dibuat! Silakan tambahkan siswa.`);
  };

  // Filter siswa di grup aktif
  const filteredStudents = (currentGroup?.students || []).filter((s) => {
    const term = searchStudentTerm.toLowerCase();
    const matchSearch =
      !term ||
      s.fullname.toLowerCase().includes(term) ||
      s.username.toLowerCase().includes(term);

    if (!matchSearch) return false;

    // Filter Status (Selesai vs Remedial berdasarkan rata-rata >= 75)
    const score = s.predictedExamScore ?? s.accuracyRate;
    const isStatusSelesai = score >= 75;

    if (statusFilter === "selesai" && !isStatusSelesai) return false;
    if (statusFilter === "remedial" && isStatusSelesai) return false;

    // Filter Progres Tugas (Selesai jika tugas tertunda = 0, Belum Selesai jika > 0)
    const pendingTasks = Math.max(0, s.totalAssignedTasks - s.completedTasksCount);
    const isProgresSelesai = pendingTasks === 0 && s.totalAssignedTasks > 0;

    if (progressFilter === "selesai" && !isProgresSelesai) return false;
    if (progressFilter === "belum" && isProgresSelesai) return false;

    return true;
  });

  // Statistik & Diagnostik Detail Siswa di Rombel Aktif
  const totalStudents = currentGroup?.students.length || 0;

  // 1. Total Mapel
  const activeSubjects =
    currentGroup?.subjects || (currentGroup?.subject ? [currentGroup.subject] : ["Matematika Wajib"]);
  const totalSubjects = activeSubjects.length;

  // 2. Belum Menyelesaikan Tugas
  const studentsWithPendingTasks = (currentGroup?.students || []).filter(
    (s) => s.totalAssignedTasks - s.completedTasksCount > 0
  );
  const totalPendingTasksCount = (currentGroup?.students || []).reduce(
    (acc, s) => acc + Math.max(0, s.totalAssignedTasks - s.completedTasksCount),
    0
  );

  // 3. Yang Sudah Siap
  const readyStudents = (currentGroup?.students || []).filter(
    (s) => s.readinessStatus === "Sangat Siap" || s.readinessStatus === "Siap"
  );
  const percentSiap =
    totalStudents > 0 ? Math.round((readyStudents.length / totalStudents) * 100) : 0;

  // 4. Butuh Remedial
  const studentsNeedingRemedial = (currentGroup?.students || []).filter(
    (s) =>
      s.readinessStatus === "Perlu Pendampingan" ||
      s.readinessStatus === "Kritis" ||
      s.unmasteredTopics.length > 0
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Kelola Siswa</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Dropdown Pemilih Grup / Kelas */}
          <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
            <SelectTrigger className="h-9 w-fit min-w-[140px] max-w-[240px] text-xs font-semibold rounded-xl bg-background border-orange-200 dark:border-zinc-800 shadow-2xs gap-2.5">
              <div className="flex items-center gap-2 truncate min-w-0">
                <Users className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                <SelectValue placeholder="Pilih Kelas yang Diampu" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id} className="text-xs">
                  <span className="font-semibold">{group.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={() => setIsCreateGroupOpen(true)}
            variant="outline"
            size="sm"
            className="h-9 rounded-xl gap-1.5 text-xs shadow-sm"
          >
            <Plus className="w-4 h-4 text-orange-600" />
            <span>Buat Grup</span>
          </Button>
          <Button
            onClick={() => setIsAddStudentOpen(true)}
            disabled={!currentGroup}
            size="sm"
            className="h-9 rounded-xl gap-2 bg-orange-600 hover:bg-orange-700 text-white text-xs shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </Button>
        </div>
      </div>

      {currentGroup && (
        <>
          {/* KPI Cards: Total Mapel, Belum Menyelesaikan Tugas, Yang Sudah Siap, Butuh Remedial */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Mapel"
              value={`${totalSubjects}`}
              icon="school"
            />
            <StatCard
              title="Tugas Belum Selesai"
              value={`${studentsWithPendingTasks.length} Siswa`}
              icon="puzzle"
            />
            <StatCard
              title="Siswa Siap"
              value={`${readyStudents.length} Siswa`}
              icon="accuracy"
            />
            <StatCard
              title="Remedial"
              value={`${studentsNeedingRemedial.length} Siswa`}
              icon="alert"
            />
          </div>

          {/* Student Roster Section (Seperti di Dashboard Guru) */}
          <Card className="rounded-2xl border shadow-sm overflow-hidden">
            <CardHeader className="px-4 py-2 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Users className="w-4 h-4 text-orange-600" />
                  Daftar Siswa ({filteredStudents.length}
                  {filteredStudents.length !== (currentGroup.students.length || 0) && (
                    <span className="text-xs text-muted-foreground font-normal">
                      dari {currentGroup.students.length}
                    </span>
                  )}
                  )
                </CardTitle>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-48 lg:w-56">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama atau @username..."
                    value={searchStudentTerm}
                    onChange={(e) => setSearchStudentTerm(e.target.value)}
                    className="pl-8 h-8 text-xs rounded-xl"
                  />
                </div>

                {/* Filter Status */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 w-32 text-xs rounded-xl bg-background border-muted-foreground/20">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all" className="text-xs">Semua Status</SelectItem>
                    <SelectItem value="selesai" className="text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                        Selesai
                      </span>
                    </SelectItem>
                    <SelectItem value="remedial" className="text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                        Remedial
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Filter Progres */}
                <Select value={progressFilter} onValueChange={setProgressFilter}>
                  <SelectTrigger className="h-8 w-36 text-xs rounded-xl bg-background border-muted-foreground/20">
                    <SelectValue placeholder="Progres" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all" className="text-xs">Semua Progres</SelectItem>
                    <SelectItem value="selesai" className="text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                        Tugas Selesai
                      </span>
                    </SelectItem>
                    <SelectItem value="belum" className="text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                        Belum Selesai
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {(statusFilter !== "all" || progressFilter !== "all" || searchStudentTerm) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setStatusFilter("all");
                      setProgressFilter("all");
                      setSearchStudentTerm("");
                    }}
                    className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground rounded-xl"
                    title="Reset Filter"
                  >
                    Reset
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAddStudentOpen(true)}
                  className="h-8 text-xs rounded-xl gap-1 shrink-0"
                >
                  <QrCode className="w-3.5 h-3.5 text-orange-600" />
                  <span>Scan QR</span>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {filteredStudents.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 mx-auto flex items-center justify-center">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Belum Ada Siswa</h4>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                      {searchStudentTerm || statusFilter !== "all" || progressFilter !== "all"
                        ? `Tidak ada siswa yang sesuai dengan filter yang dipilih.`
                        : "Klik tombol di bawah untuk memasukkan siswa dengan mengetik username atau memindai QR code profil murid."}
                    </p>
                  </div>
                  {!searchStudentTerm && statusFilter === "all" && progressFilter === "all" && (
                    <Button
                      onClick={() => setIsAddStudentOpen(true)}
                      className="rounded-xl text-xs bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Tambah Siswa
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent bg-muted/40">
                        <TableHead className="font-semibold text-xs py-3 pl-5">Nama Siswa</TableHead>
                        <TableHead className="font-semibold text-xs py-3">Progres</TableHead>
                        <TableHead className="font-semibold text-xs py-3">Rata-rata</TableHead>
                        <TableHead className="font-semibold text-xs py-3">Status</TableHead>
                        <TableHead className="font-semibold text-xs py-3 pr-5 w-16 text-center">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => {
                        const score = student.predictedExamScore ?? student.accuracyRate;
                        const pendingTasks = Math.max(0, student.totalAssignedTasks - student.completedTasksCount);
                        const isSelesai = score >= 75;
                        const isProgresSelesai = pendingTasks === 0 && student.totalAssignedTasks > 0;
                        const progressPercent =
                          student.totalAssignedTasks > 0
                            ? Math.min(
                              100,
                              Math.round(
                                (student.completedTasksCount / student.totalAssignedTasks) * 100
                              )
                            )
                            : 0;

                        return (
                          <TableRow key={student.id} className="hover:bg-muted/30 transition-colors">
                            {/* Nama Siswa */}
                            <TableCell className="pl-5 py-3">
                              <div className="flex items-center gap-3">
                                <Avatar className="size-8 border">
                                  <AvatarImage src={student.avatarUrl} alt={student.fullname} />
                                  <AvatarFallback className="text-xs bg-orange-100 text-orange-700">
                                    {student.fullname.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <div className="font-semibold text-xs text-foreground truncate">
                                    {student.fullname}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground truncate">
                                    @{student.username}
                                  </div>
                                </div>
                              </div>
                            </TableCell>

                            {/* Progres Tugas (Selesai atau Belum Selesai) */}
                            <TableCell className="py-3 text-xs">
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-foreground">
                                    {student.completedTasksCount}/{student.totalAssignedTasks}
                                  </span>
                                  {isProgresSelesai ? (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] font-medium py-0 px-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                                    >
                                      Selesai
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] font-medium py-0 px-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                                    >
                                      Belum Selesai
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </TableCell>

                            {/* Rata-rata */}
                            <TableCell className="py-3 text-xs">
                              <span className="font-semibold text-foreground">
                                {score}{" "}
                                <span className={isSelesai ? "text-muted-foreground font-normal" : "text-rose-600 dark:text-rose-400 font-normal"}>
                                </span>
                              </span>
                            </TableCell>

                            {/* Status */}
                            <TableCell className="py-3">
                              {isSelesai ? (
                                <Badge
                                  className="text-[10px] font-medium py-0 px-2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                                >
                                  Selesai
                                </Badge>
                              ) : (
                                <Badge
                                  className="text-[10px] font-medium py-0 px-2 bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
                                >
                                  Remedial
                                </Badge>
                              )}
                            </TableCell>

                            {/* Aksi (Hanya Titik Tiga, Opsi Kondisional di Dalam Dropdown) */}
                            <TableCell className="py-3 pr-5 text-center">
                              <div className="flex justify-center">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-7 text-muted-foreground hover:text-foreground rounded-lg"
                                    >
                                      <MoreHorizontal className="size-4" />
                                      <span className="sr-only">Menu aksi</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-44 rounded-xl">
                                    <DropdownMenuItem asChild>
                                      <Link
                                        href="/dashboard/teacher/analytics"
                                        className="cursor-pointer flex items-center gap-2 text-xs"
                                      >
                                        <Eye className="size-3.5 text-muted-foreground" />
                                        <span>Lihat Detail</span>
                                      </Link>
                                    </DropdownMenuItem>

                                    {/* Opsi Remedial jika status remedial */}
                                    {!isSelesai && (
                                      <DropdownMenuItem asChild>
                                        <Link
                                          href="/dashboard/teacher/tasks"
                                          className="cursor-pointer flex items-center gap-2 text-xs text-orange-600 focus:text-orange-600 focus:bg-orange-50 dark:focus:bg-orange-950/40"
                                        >
                                          <Send className="size-3.5 text-orange-600" />
                                          <span>Beri Remedial</span>
                                        </Link>
                                      </DropdownMenuItem>
                                    )}

                                    {/* Opsi Ingatkan jika ada tugas belum selesai */}
                                    {pendingTasks > 0 && (
                                      <DropdownMenuItem
                                        onClick={() => handleSendReminder(student.fullname, pendingTasks)}
                                        className="cursor-pointer flex items-center gap-2 text-xs text-amber-600 focus:text-amber-600 focus:bg-amber-50 dark:focus:bg-amber-950/40"
                                      >
                                        <Bell className="size-3.5 text-amber-600" />
                                        <span>Ingatkan Tugas ({pendingTasks})</span>
                                      </DropdownMenuItem>
                                    )}

                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleRemoveStudent(student.id, student.fullname)}
                                      className="cursor-pointer flex items-center gap-2 text-xs text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40"
                                    >
                                      <Trash2 className="size-3.5" />
                                      <span>Delete</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
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
        </>
      )}

      {/* DIALOG 1: TAMBAH SISWA (KETIK USERNAME / SCAN QR) */}
      {currentGroup && (
        <AddStudentDialog
          open={isAddStudentOpen}
          onOpenChange={setIsAddStudentOpen}
          groupName={currentGroup.name}
          groupId={currentGroup.id}
          existingStudentIds={currentGroup.students.map((s) => s.id)}
          onStudentAdded={handleStudentAdded}
        />
      )}

      {/* DIALOG 2: BUAT GRUP BARU */}
      <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
        <DialogContent className="sm:max-w-[460px] p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-600" />
              Buat Group
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateGroup} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Nama Rombel / Kelas</Label>
              <Input
                placeholder="Contoh: Kelas 10-A, Kelas 11-IPA 1"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                required
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Jenjang</Label>
                <Select
                  value={newGroupLevel}
                  onValueChange={(v: any) => setNewGroupLevel(v)}
                >
                  <SelectTrigger className="rounded-xl text-xs">
                    <SelectValue placeholder="Pilih Jenjang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SD">SD</SelectItem>
                    <SelectItem value="SMP">SMP</SelectItem>
                    <SelectItem value="SMA">SMA</SelectItem>
                    <SelectItem value="SMK">SMK</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Tingkat Kelas</Label>
                <Select
                  value={newGroupGrade}
                  onValueChange={(v: any) => setNewGroupGrade(v)}
                >
                  <SelectTrigger className="rounded-xl text-xs">
                    <SelectValue placeholder="Pilih Kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kelas 10">Kelas 10</SelectItem>
                    <SelectItem value="Kelas 11">Kelas 11</SelectItem>
                    <SelectItem value="Kelas 12">Kelas 12</SelectItem>
                    <SelectItem value="Kelas 7">Kelas 7</SelectItem>
                    <SelectItem value="Kelas 8">Kelas 8</SelectItem>
                    <SelectItem value="Kelas 9">Kelas 9</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Mata Pelajaran yang Diampu</Label>
                <span className="text-[10px] text-muted-foreground">Pilih 1 atau lebih</span>
              </div>
              <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl border bg-muted/20">
                {AVAILABLE_SUBJECTS.map((subj) => {
                  const isSelected = newGroupSubjects.includes(subj);
                  return (
                    <button
                      type="button"
                      key={subj}
                      onClick={() => {
                        if (isSelected) {
                          if (newGroupSubjects.length > 1) {
                            setNewGroupSubjects(newGroupSubjects.filter((s) => s !== subj));
                          } else {
                            toast.error("Minimal pilih 1 mata pelajaran");
                          }
                        } else {
                          setNewGroupSubjects([...newGroupSubjects, subj]);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 border ${isSelected
                        ? "bg-orange-600 text-white border-orange-600 shadow-2xs"
                        : "bg-background text-muted-foreground hover:text-foreground hover:bg-muted border-border"
                        }`}
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>{subj}</span>
                      {isSelected && <span className="ml-0.5 text-[10px]">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Tahun Ajaran</Label>
              <Input
                value={newGroupYear}
                onChange={(e) => setNewGroupYear(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateGroupOpen(false)}
                className="rounded-xl text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="rounded-xl text-xs bg-orange-600 hover:bg-orange-700 text-white"
              >
                Simpan & Lanjutkan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

