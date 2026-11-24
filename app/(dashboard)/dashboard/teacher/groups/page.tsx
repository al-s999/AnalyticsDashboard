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
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
  INITIAL_TEACHER_GROUPS,
  AcademicGroup,
  StudentProfile,
  GAMEFORSMART_STUDENTS
} from "@/data/students-data";
import { AddStudentDialog } from "@/components/groups/add-student-dialog";
import { toast } from "sonner";
import Link from "next/link";

export default function TeacherGroupsPage() {
  const [groups, setGroups] = useState<AcademicGroup[]>(INITIAL_TEACHER_GROUPS);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    INITIAL_TEACHER_GROUPS[0].id
  );
  const [searchStudentTerm, setSearchStudentTerm] = useState("");
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  // New Group Form State
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupLevel, setNewGroupLevel] = useState<"SD" | "SMP" | "SMA" | "SMK">("SMA");
  const [newGroupGrade, setNewGroupGrade] = useState("Kelas 10");
  const [newGroupSubject, setNewGroupSubject] = useState("Matematika");
  const [newGroupYear, setNewGroupYear] = useState("2025/2026 Ganjil");

  // Load from localStorage if present
  useEffect(() => {
    try {
      const saved = localStorage.getItem("gameforsmart_teacher_groups");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setGroups(parsed);
          setSelectedGroupId(parsed[0].id);
        }
      }
    } catch {}
  }, []);

  const saveGroups = (updated: AcademicGroup[]) => {
    setGroups(updated);
    try {
      localStorage.setItem("gameforsmart_teacher_groups", JSON.stringify(updated));
    } catch {}
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
      subject: newGroupSubject,
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
    toast.success(`Grup "${newGroup.name}" berhasil dibuat! Silakan tambahkan siswa.`);
  };

  // Filter siswa di grup aktif
  const filteredStudents = (currentGroup?.students || []).filter((s) => {
    const term = searchStudentTerm.toLowerCase();
    return (
      s.fullname.toLowerCase().includes(term) ||
      s.username.toLowerCase().includes(term)
    );
  });

  // Statistik Kesiapan Grup
  const totalStudents = currentGroup?.students.length || 0;
  const avgReadinessScore =
    totalStudents > 0
      ? Math.round(
          currentGroup!.students.reduce((acc, s) => acc + s.predictedExamScore, 0) /
            totalStudents
        )
      : 0;

  const countSangatSiap = (currentGroup?.students || []).filter(
    (s) => s.readinessStatus === "Sangat Siap"
  ).length;
  const countPerluPendampingan = (currentGroup?.students || []).filter(
    (s) => s.readinessStatus === "Perlu Pendampingan" || s.readinessStatus === "Kritis"
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Manajemen Grup & Murid</h1>
            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 dark:bg-orange-950/40">
              Pengawasan Guru
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kelola grup kelas binaan, daftarkan siswa via ketik username / scan QR profil, dan monitor kesiapan mereka.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setIsCreateGroupOpen(true)}
            variant="outline"
            className="rounded-xl gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4 text-orange-600" />
            <span>Buat Grup Baru</span>
          </Button>
          <Button
            onClick={() => setIsAddStudentOpen(true)}
            disabled={!currentGroup}
            className="rounded-xl gap-2 bg-orange-600 hover:bg-orange-700 text-white shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </Button>
        </div>
      </div>

      {/* Group Navigation Chips / Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b">
        {groups.map((group) => {
          const isSelected = group.id === selectedGroupId;
          return (
            <button
              key={group.id}
              onClick={() => setSelectedGroupId(group.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${
                isSelected
                  ? "bg-orange-600 text-white border-orange-600 shadow-sm"
                  : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted/60 border-transparent"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{group.name}</span>
              <Badge
                variant={isSelected ? "secondary" : "outline"}
                className={`text-[10px] px-1.5 py-0 ${
                  isSelected ? "bg-white/20 text-white" : ""
                }`}
              >
                {group.students.length} Siswa
              </Badge>
            </button>
          );
        })}
      </div>

      {currentGroup && (
        <>
          {/* Group Overview Banner & Analytics Teaser */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="rounded-2xl border bg-card/60">
              <CardHeader className="p-4 pb-2">
                <CardDescription className="text-xs">Informasi Grup</CardDescription>
                <CardTitle className="text-base font-bold text-foreground">
                  {currentGroup.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Mata Pelajaran:</span>
                  <span className="font-semibold text-foreground">{currentGroup.subject}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Jenjang / Tingkat:</span>
                  <span className="font-semibold text-foreground">
                    {currentGroup.level} • {currentGroup.grade}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tahun Ajaran:</span>
                  <span className="font-semibold text-foreground">{currentGroup.academicYear}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border bg-card/60">
              <CardHeader className="p-4 pb-2">
                <CardDescription className="text-xs">Rerata Skor Prediksi</CardDescription>
                <CardTitle className="text-2xl font-black text-foreground flex items-center gap-2">
                  <span>{avgReadinessScore}</span>
                  <span className="text-xs font-normal text-muted-foreground">/ 100</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 text-xs text-muted-foreground">
                Berdasarkan performa akurasi kuis dan sesi belajar mandiri di GameForSmart.
              </CardContent>
            </Card>

            <Card className="rounded-2xl border bg-card/60">
              <CardHeader className="p-4 pb-2">
                <CardDescription className="text-xs">Siswa Sangat Siap</CardDescription>
                <CardTitle className="text-2xl font-black text-emerald-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span>{countSangatSiap} Siswa</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 text-xs text-muted-foreground">
                Siap mengikuti ujian materi tanpa hambatan indikator kompetensi.
              </CardContent>
            </Card>

            <Card className="rounded-2xl border bg-card/60">
              <CardHeader className="p-4 pb-2">
                <CardDescription className="text-xs">Butuh Pendampingan</CardDescription>
                <CardTitle className="text-2xl font-black text-amber-600 flex items-center gap-1.5">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span>{countPerluPendampingan} Siswa</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 text-xs text-muted-foreground">
                Memerlukan tugas remedial preskriptif untuk materi yang belum tuntas.
              </CardContent>
            </Card>
          </div>

          {/* Student Roster Section */}
          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="p-5 pb-3 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Users className="w-4 h-4 text-orange-600" />
                  Daftar Siswa Terdaftar ({currentGroup.students.length})
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Dua metode registrasi: ketik username siswa atau scan QR code langsung dari profil GameForSmart murid.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama atau @username..."
                    value={searchStudentTerm}
                    onChange={(e) => setSearchStudentTerm(e.target.value)}
                    className="pl-8 h-8 text-xs rounded-xl"
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAddStudentOpen(true)}
                  className="h-8 text-xs rounded-xl gap-1 shrink-0"
                >
                  <QrCode className="w-3.5 h-3.5 text-orange-600" />
                  <span>Scan QR / Tambah</span>
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
                    <h4 className="font-semibold text-sm">Belum Ada Siswa di Grup Ini</h4>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                      Klik tombol di bawah untuk memasukkan siswa dengan mengetik username atau memindai QR code profil murid.
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsAddStudentOpen(true)}
                    className="rounded-xl text-xs bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Tambah Siswa Sekarang
                  </Button>
                </div>
              ) : (
                <div className="divide-y overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/40 text-muted-foreground text-left font-medium border-b">
                        <th className="p-3 pl-5">Siswa</th>
                        <th className="p-3">Level & XP</th>
                        <th className="p-3">Akurasi Kuis</th>
                        <th className="p-3">Prediksi Skor Ujian</th>
                        <th className="p-3">Kesiapan Ujian</th>
                        <th className="p-3">Materi Belum Dikuasai (Preskriptif)</th>
                        <th className="p-3 pr-5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredStudents.map((student) => (
                        <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 pl-5">
                            <div className="flex items-center gap-2.5">
                              <Avatar className="w-8 h-8 border">
                                <AvatarImage src={student.avatarUrl} alt={student.fullname} />
                                <AvatarFallback>{student.fullname.slice(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <span className="font-semibold text-foreground block">{student.fullname}</span>
                                <span className="text-[11px] text-muted-foreground">@{student.username}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-bold">
                                Lvl {student.level}
                              </Badge>
                              <span className="text-[11px] text-muted-foreground">{student.xp} XP</span>
                            </div>
                          </td>
                          <td className="p-3 font-semibold">{student.accuracyRate}%</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground text-sm">
                                {student.predictedExamScore}
                              </span>
                              <span className="text-[10px] text-muted-foreground">/ 100</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge
                              className={`text-[10px] px-2 py-0.5 ${
                                student.readinessStatus === "Sangat Siap"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                  : student.readinessStatus === "Siap"
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                                  : student.readinessStatus === "Perlu Pendampingan"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                                  : "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                              }`}
                            >
                              {student.readinessStatus}
                            </Badge>
                          </td>
                          <td className="p-3 max-w-xs">
                            {student.unmasteredTopics.length === 0 ? (
                              <span className="text-emerald-600 font-medium text-[11px] flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Semua Kompetensi Tuntas
                              </span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {student.unmasteredTopics.map((topic, i) => (
                                  <Badge
                                    key={i}
                                    variant="outline"
                                    className="text-[10px] bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900"
                                  >
                                    {topic}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="p-3 pr-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link href="/dashboard/teacher/tasks">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-[11px] text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/30 px-2"
                                >
                                  Beri Task
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveStudent(student.id, student.fullname)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
              Buat Grup Kelas Pengawasan Baru
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateGroup} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Nama Grup / Kelas</Label>
              <Input
                placeholder="Contoh: Kelas 10-C Matematika Wajib"
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

            <div className="space-y-1.5">
              <Label className="text-xs">Mata Pelajaran</Label>
              <Select
                value={newGroupSubject}
                onValueChange={(v: any) => setNewGroupSubject(v)}
              >
                <SelectTrigger className="rounded-xl text-xs">
                  <SelectValue placeholder="Pilih Mapel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Matematika">Matematika</SelectItem>
                  <SelectItem value="Fisika">Fisika</SelectItem>
                  <SelectItem value="Kimia">Kimia</SelectItem>
                  <SelectItem value="Biologi">Biologi</SelectItem>
                  <SelectItem value="Bahasa Indonesia">Bahasa Indonesia</SelectItem>
                  <SelectItem value="Bahasa Inggris">Bahasa Inggris</SelectItem>
                  <SelectItem value="Informatika">Informatika</SelectItem>
                </SelectContent>
              </Select>
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

