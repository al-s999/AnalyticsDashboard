"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  MoreHorizontal,
  Loader2,
  X
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import { TablePagination } from "@/components/ui/table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { StatCard } from "@/components/dashboard/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
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
  AcademicGroup,
  StudentProfile
} from "@/data/students-data";
import { AddStudentDialog } from "@/components/groups/add-student-dialog";
import { useAnalyticsAuth } from "@/contexts/analytics-auth-context";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

const PAGE_SIZE = 20;

export default function TeacherGroupsPage() {
  const { user } = useAnalyticsAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<AcademicGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [searchStudentTerm, setSearchStudentTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [progressFilter, setProgressFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [paginatedStudents, setPaginatedStudents] = useState<StudentProfile[]>([]);
  const [totalFilteredStudents, setTotalFilteredStudents] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoadingMembers, setIsLoadingMembers] = useState<boolean>(false);
  const [membersRefreshKey, setMembersRefreshKey] = useState<number>(0);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<
    | { mode: "single"; studentId: string; studentName: string }
    | { mode: "bulk"; studentIds: string[] }
    | null
  >(null);

  const nextPageCacheRef = useRef<{
    key: string;
    students: StudentProfile[];
    total: number;
    totalPages: number;
  } | null>(null);
  const prefetchAbortRef = useRef<AbortController | null>(null);

  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [addStudentInitialTab, setAddStudentInitialTab] = useState<"search" | "qr" | "invite">("search");
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);

  // New Group Form State
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupLevel, setNewGroupLevel] = useState<"SD" | "SMP" | "SMA" | "SMK">("SMA");
  const [newGroupGrade, setNewGroupGrade] = useState("Kelas 10");
  const [newGroupSubjects, setNewGroupSubjects] = useState<string[]>(["Matematika Wajib"]);
  const [newGroupYear, setNewGroupYear] = useState("2025/2026 Ganjil");

  // Muat grup milik guru yang sedang login dari Supabase /api/groups
  const fetchGroups = async () => {
    try {
      setIsLoadingGroups(true);
      const queryParam = user?.id ? `?creator_id=${encodeURIComponent(user.id)}` : "";
      const res = await fetch(`/api/groups${queryParam}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.groups)) {
        setGroups(data.groups);
        if (data.groups.length > 0) {
          setSelectedGroupId((prev) => {
            const exists = data.groups.some((g: any) => g.id === prev);
            return exists ? prev : data.groups[0].id;
          });
        }
        localStorage.setItem("gameforsmart_teacher_groups", JSON.stringify(data.groups));
      }
    } catch (err) {
      console.warn("Gagal fetch dari database, fallback ke storage lokal:", err);
    } finally {
      setIsLoadingGroups(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [user?.id]);

  const saveGroups = (updated: AcademicGroup[]) => {
    setGroups(updated);
    try {
      localStorage.setItem("gameforsmart_teacher_groups", JSON.stringify(updated));
    } catch { }
  };

  const currentGroup =
    groups.find((g) => g.id === selectedGroupId) || groups[0] || null;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchStudentTerm.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [searchStudentTerm]);

  // Reset ke halaman 1 dan hapus cache saat ganti grup atau filter
  useEffect(() => {
    nextPageCacheRef.current = null;
    setCurrentPage(1);
    setSelectedStudentIds([]);
  }, [currentGroup?.id, debouncedSearchTerm, statusFilter, progressFilter]);

  // Bersihkan pilihan saat berpindah halaman atau saat daftar siswa yang ditampilkan berubah
  useEffect(() => {
    setSelectedStudentIds([]);
  }, [currentPage]);

  useEffect(() => {
    const visibleIds = new Set(paginatedStudents.map((s) => s.id));
    setSelectedStudentIds((prev) => {
      const filtered = prev.filter((id) => visibleIds.has(id));
      return filtered.length === prev.length ? prev : filtered;
    });
  }, [paginatedStudents]);

  const buildPageCacheKey = useCallback(
    (groupId: string, page: number, search: string, status: string, progress: string) =>
      `${groupId}:${page}:${search}:${status}:${progress}`,
    []
  );

  const fetchMembersFromApi = useCallback(
    async (
      groupId: string,
      page: number,
      search: string,
      status: string,
      progress: string,
      signal?: AbortSignal
    ) => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        search,
        status,
        progress
      });
      const res = await fetch(`/api/groups/${groupId}/members?${params.toString()}`, { signal });
      return res.json();
    },
    []
  );

  useEffect(() => {
    const groupId = currentGroup?.id;
    if (!groupId) {
      setPaginatedStudents([]);
      setTotalFilteredStudents(0);
      setTotalPages(1);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    // Batalkan prefetch sebelumnya saat berpindah halaman/filter
    prefetchAbortRef.current?.abort();

    const prefetchNextPage = async (nextPage: number) => {
      const nextController = new AbortController();
      prefetchAbortRef.current = nextController;
      try {
        const nextData = await fetchMembersFromApi(
          groupId,
          nextPage,
          debouncedSearchTerm,
          statusFilter,
          progressFilter,
          nextController.signal
        );
        if (!cancelled && !nextController.signal.aborted && nextData?.success) {
          nextPageCacheRef.current = {
            key: buildPageCacheKey(groupId, nextPage, debouncedSearchTerm, statusFilter, progressFilter),
            students: nextData.students || [],
            total: nextData.pagination?.total ?? 0,
            totalPages: nextData.pagination?.totalPages ?? 1
          };
        }
      } catch {
        // Abaikan error prefetch / abort
      }
    };

    const loadCurrentPage = async () => {
      const targetKey = buildPageCacheKey(
        groupId,
        currentPage,
        debouncedSearchTerm,
        statusFilter,
        progressFilter
      );
      const cached = nextPageCacheRef.current;

      // Hapus cache lama saat pindah halaman agar tidak membebani memori
      nextPageCacheRef.current = null;

      if (cached && cached.key === targetKey) {
        setPaginatedStudents(cached.students);
        setTotalFilteredStudents(cached.total);
        setTotalPages(cached.totalPages);
        if (currentPage < cached.totalPages) {
          void prefetchNextPage(currentPage + 1);
        }
        return;
      }

      setIsLoadingMembers(true);
      try {
        const data = await fetchMembersFromApi(
          groupId,
          currentPage,
          debouncedSearchTerm,
          statusFilter,
          progressFilter,
          controller.signal
        );
        if (!cancelled && data?.success) {
          const resolvedTotalPages = data.pagination?.totalPages ?? 1;
          setPaginatedStudents(data.students || []);
          setTotalFilteredStudents(data.pagination?.total ?? 0);
          setTotalPages(resolvedTotalPages);

          if (currentPage < resolvedTotalPages) {
            void prefetchNextPage(currentPage + 1);
          }
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.warn("Gagal memuat anggota grup:", err);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMembers(false);
        }
      }
    };

    void loadCurrentPage();

    return () => {
      cancelled = true;
      controller.abort();
      prefetchAbortRef.current?.abort();
    };
  }, [
    currentGroup?.id,
    currentPage,
    debouncedSearchTerm,
    statusFilter,
    progressFilter,
    membersRefreshKey,
    buildPageCacheKey,
    fetchMembersFromApi
  ]);

  // Handler: Kirim undangan bergabung ke grup via notifikasi (opsi Ya/Tidak di gameforsmartNewUI)
  const handleStudentInvited = async (student: StudentProfile): Promise<boolean> => {
    if (!currentGroup) return false;
    try {
      const res = await fetch(`/api/groups/${encodeURIComponent(currentGroup.id)}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          actorId: user?.id
        })
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        toast.error(data?.error || `Gagal mengirim undangan ke @${student.username}`);
        return false;
      }

      if (data.alreadyInvited) {
        toast.info(`Undangan untuk @${student.username} sudah dikirim dan menunggu konfirmasi.`);
      } else {
        toast.success(`Undangan bergabung ke ${currentGroup.name} dikirim ke @${student.username}!`);
      }
      return true;
    } catch (err) {
      console.error("Gagal mengirim undangan grup:", err);
      toast.error("Terjadi kesalahan saat mengirim undangan.");
      return false;
    }
  };

  // Handler: Tambah Siswa baru ke grup aktif di database & state (untuk Scan QR)
  const handleStudentAdded = async (student: StudentProfile) => {
    if (!currentGroup) return;

    // Simpan ke database Supabase
    try {
      await fetch(`/api/groups/${currentGroup.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student.id })
      });
    } catch (err) {
      console.error("Gagal sinkronisasi siswa ke database:", err);
    }

    const updated = groups.map((g) => {
      if (g.id === currentGroup.id) {
        const isExists = g.students.some((s) => s.id === student.id);
        if (isExists) return g;
        return {
          ...g,
          students: [...g.students, student]
        };
      }
      return g;
    });

    saveGroups(updated);
    nextPageCacheRef.current = null;
    setMembersRefreshKey((k) => k + 1);
  };

  // Handler: Buka modal konfirmasi keluarkan satu siswa
  const handleRemoveStudent = (studentId: string, studentName: string) => {
    if (!currentGroup) return;
    setDeleteConfirmTarget({ mode: "single", studentId, studentName });
  };

  // Helper & Handler: Seleksi massal siswa
  const isStudentRemedial = (student: StudentProfile) =>
    (student.predictedExamScore ?? student.accuracyRate) < 75;

  const selectedStudents = paginatedStudents.filter((s) =>
    selectedStudentIds.includes(s.id)
  );
  const visibleSelectedIds = selectedStudents.map((s) => s.id);
  const remedialSelectedStudents = selectedStudents.filter(isStudentRemedial);
  const areAllSelectedRemedial =
    selectedStudents.length > 0 && selectedStudents.every(isStudentRemedial);
  const isAllCurrentPageSelected =
    paginatedStudents.length > 0 &&
    paginatedStudents.every((s) => selectedStudentIds.includes(s.id));
  const isSomeCurrentPageSelected =
    selectedStudents.length > 0 && !isAllCurrentPageSelected;

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudentIds(paginatedStudents.map((s) => s.id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleToggleSelectStudent = (studentId: string, checked: boolean) => {
    setSelectedStudentIds((prev) =>
      checked ? (prev.includes(studentId) ? prev : [...prev, studentId]) : prev.filter((id) => id !== studentId)
    );
  };

  // Handler: Buka modal konfirmasi keluarkan siswa terpilih
  const handleBulkRemoveStudents = () => {
    if (!currentGroup || visibleSelectedIds.length === 0) return;
    setDeleteConfirmTarget({ mode: "bulk", studentIds: visibleSelectedIds });
  };

  // Handler: Eksekusi penghapusan siswa (tunggal atau massal) setelah konfirmasi modal
  const handleConfirmDeleteStudents = async () => {
    if (!currentGroup || !deleteConfirmTarget) return;

    const targetIds =
      deleteConfirmTarget.mode === "single"
        ? [deleteConfirmTarget.studentId]
        : deleteConfirmTarget.studentIds;

    setIsBulkDeleting(true);
    try {
      const res = await fetch(`/api/groups/${currentGroup.id}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          deleteConfirmTarget.mode === "single"
            ? { studentId: deleteConfirmTarget.studentId }
            : { studentIds: targetIds }
        )
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        toast.error(data?.error || "Gagal mengeluarkan siswa dari kelas.");
        return;
      }

      const removedSet = new Set(targetIds);
      const updated = groups.map((g) => {
        if (g.id === currentGroup.id) {
          return {
            ...g,
            students: g.students.filter((s) => !removedSet.has(s.id))
          };
        }
        return g;
      });

      saveGroups(updated);
      setSelectedStudentIds((prev) => prev.filter((id) => !removedSet.has(id)));
      nextPageCacheRef.current = null;
      if (targetIds.length >= paginatedStudents.length && currentPage > 1) {
        setCurrentPage((p) => Math.max(1, p - 1));
      } else {
        setMembersRefreshKey((k) => k + 1);
      }

      if (deleteConfirmTarget.mode === "single") {
        toast.info(`${deleteConfirmTarget.studentName} telah dikeluarkan dari kelas.`);
      } else {
        toast.info(`${targetIds.length} siswa telah dikeluarkan dari grup.`);
      }
      setDeleteConfirmTarget(null);
    } catch (err) {
      console.error("Gagal mengeluarkan siswa:", err);
      toast.error("Terjadi kesalahan saat mengeluarkan siswa.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Handler: Kirim pengingat tugas ke notifikasi app siswa (gameforsmartNewUI)
  const handleSendReminder = async (
    studentId: string,
    studentName: string,
    pendingCount: number
  ) => {
    try {
      const res = await fetch("/api/notifications/remind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorId: user?.id,
          studentIds: [studentId],
          groupId: currentGroup?.id,
          pendingCount
        })
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        toast.error(data?.error || `Gagal mengirim pengingat ke ${studentName}`);
        return;
      }
      toast.success(`Pengingat ${pendingCount} tugas berhasil dikirimkan ke ${studentName}`);
    } catch {
      toast.error(`Terjadi kesalahan saat mengirim pengingat ke ${studentName}`);
    }
  };

  // Handler: Buat Grup Baru ke Supabase
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      toast.error("Nama kelas wajib diisi");
      return;
    }

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroupName.trim(),
          level: newGroupLevel,
          grade: newGroupGrade,
          subjects: newGroupSubjects.length > 0 ? newGroupSubjects : ["Matematika Wajib"],
          creatorId: user?.id
        })
      });
      const data = await res.json();
      if (data.success && data.group) {
        const updated = [data.group, ...groups];
        saveGroups(updated);
        setSelectedGroupId(data.group.id);
        setIsCreateGroupOpen(false);
        setNewGroupName("");
        setNewGroupSubjects(["Matematika Wajib"]);
        toast.success(`Kelas "${data.group.name}" berhasil dibuat di database!`);
        return;
      }
    } catch (err) {
      console.error("Gagal create group ke database:", err);
    }

    // Fallback lokal jika ada gangguan koneksi
    const newGroup: AcademicGroup = {
      id: `grp-${Date.now().toString(36)}`,
      name: newGroupName.trim(),
      level: newGroupLevel,
      grade: newGroupGrade,
      subjects: newGroupSubjects.length > 0 ? newGroupSubjects : ["Matematika Wajib"],
      subject: newGroupSubjects[0] || "Matematika Wajib",
      academicYear: newGroupYear,
      teacherId: user?.id || "teacher",
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
    toast.success(`Kelas "${newGroup.name}" berhasil dibuat! Silakan tambahkan siswa.`);
  };

  // Filter siswa di grup aktif
  const filteredStudents = (currentGroup?.students || []).filter((s) => {
    const term = searchStudentTerm.toLowerCase();
    const matchSearch =
      !term ||
      s.fullname.toLowerCase().includes(term) ||
      s.username.toLowerCase().includes(term);

    if (!matchSearch) return false;

    // Filter Status Nilai (Baik >= 75, Cukup 65-74, Kurang < 65)
    const score = s.predictedExamScore ?? s.accuracyRate;
    if (statusFilter === "baik" && score < 75) return false;
    if (statusFilter === "cukup" && (score < 65 || score >= 75)) return false;
    if (statusFilter === "kurang" && score >= 65) return false;

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
  const activeSubjects = currentGroup
    ? currentGroup.subjects || (currentGroup.subject ? [currentGroup.subject] : ["Matematika Wajib"])
    : [];
  const totalSubjects = activeSubjects.length;

  // 2. Belum Menyelesaikan Tugas
  const studentsWithPendingTasks = (currentGroup?.students || []).filter(
    (s) => s.totalAssignedTasks - s.completedTasksCount > 0
  );
  const totalPendingTasksCount = (currentGroup?.students || []).reduce(
    (acc, s) => acc + Math.max(0, s.totalAssignedTasks - s.completedTasksCount),
    0
  );

  // 3. Yang Sudah Siap (Baik)
  const readyStudents = (currentGroup?.students || []).filter(
    (s) => s.readinessStatus === "Baik"
  );
  const percentSiap =
    totalStudents > 0 ? Math.round((readyStudents.length / totalStudents) * 100) : 0;

  // 4. Butuh Remedial (Cukup & Kurang)
  const studentsNeedingRemedial = (currentGroup?.students || []).filter(
    (s) =>
      s.readinessStatus === "Cukup" ||
      s.readinessStatus === "Kurang" ||
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
            <SelectTrigger className="h-9 w-fit min-w-[140px] max-w-full text-xs font-semibold rounded-xl bg-background border-orange-200 dark:border-zinc-800 shadow-2xs gap-2.5">
              <div className="flex items-center gap-2">
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
            <span>Buat Kelas</span>
          </Button>
          <Button
            onClick={() => {
              setAddStudentInitialTab("search");
              setIsAddStudentOpen(true);
            }}
            disabled={!currentGroup}
            size="sm"
            className="h-9 rounded-xl gap-2 bg-orange-600 hover:bg-orange-700 text-white text-xs shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards: Total Mapel, Belum Menyelesaikan Tugas, Yang Sudah Siap, Butuh Remedial */}
      {isLoadingGroups ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="rounded-2xl border p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-8 w-8 rounded-xl" />
              </div>
              <Skeleton className="h-7 w-16" />
            </Card>
          ))}
        </div>
      ) : (
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
      )}

          {/* Student Roster Section (Seperti di Dashboard Guru) */}
          <Card className="rounded-2xl border shadow-sm overflow-hidden gap-0 py-0">
            <CardHeader className="px-4 py-3 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Users className="w-4 h-4 text-orange-600" />
                  Daftar Siswa
                </CardTitle>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-48 lg:w-56">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Cari..."
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
                    <SelectItem value="baik" className="text-xs text-emerald-600">Baik</SelectItem>
                    <SelectItem value="cukup" className="text-xs text-blue-600">Cukup</SelectItem>
                    <SelectItem value="kurang" className="text-xs text-rose-600">Kurang</SelectItem>
                  </SelectContent>
                </Select>

                {/* Filter Progres */}
                <Select value={progressFilter} onValueChange={setProgressFilter}>
                  <SelectTrigger className="h-8 w-36 text-xs rounded-xl bg-background border-muted-foreground/20">
                    <SelectValue placeholder="Progres" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all" className="text-xs">Semua Progres</SelectItem>
                    <SelectItem value="selesai" className="text-xs">Selesai</SelectItem>
                    <SelectItem value="belum" className="text-xs">Belum Selesai</SelectItem>
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
                  onClick={() => {
                    setAddStudentInitialTab("qr");
                    setIsAddStudentOpen(true);
                  }}
                  className="h-8 text-xs rounded-xl gap-1 shrink-0"
                >
                  <QrCode className="w-3.5 h-3.5 text-orange-600" />
                  <span>Scan QR</span>
                </Button>
              </div>
            </CardHeader>

            {selectedStudents.length > 0 && (
              <div className="px-4 py-2.5 border-b bg-orange-50/70 dark:bg-orange-950/20 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200"
                  >
                    {selectedStudents.length} siswa dipilih
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedStudentIds([])}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground rounded-lg gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Batal</span>
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {areAllSelectedRemedial && (
                    <Button
                      size="sm"
                      asChild
                      className="h-8 px-3 text-xs rounded-xl gap-1.5 bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <Link
                        href={`/dashboard/teacher/tasks?remedial=1&groupId=${encodeURIComponent(
                          currentGroup?.id || ""
                        )}&studentIds=${encodeURIComponent(
                          remedialSelectedStudents.map((s) => s.id).join(",")
                        )}`}
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Beri Remedial</span>
                      </Link>
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={isBulkDeleting}
                    onClick={handleBulkRemoveStudents}
                    className="h-8 px-3 text-xs rounded-xl gap-1.5"
                  >
                    {isBulkDeleting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    <span>Hapus</span>
                  </Button>
                </div>
              </div>
            )}

            <CardContent className="p-0">
              {isLoadingGroups || (isLoadingMembers && paginatedStudents.length === 0) ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between gap-4 py-2 border-b last:border-b-0">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-3.5 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-14" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-7 w-7 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : !currentGroup ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 mx-auto flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Belum Ada Kelas</h4>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                      Anda belum memiliki kelas. Buat kelas terlebih dahulu untuk mulai menambahkan dan memantau siswa.
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsCreateGroupOpen(true)}
                    className="rounded-xl text-xs bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Buat Kelas
                  </Button>
                </div>
              ) : paginatedStudents.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 mx-auto flex items-center justify-center">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Belum Ada Siswa</h4>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                      {searchStudentTerm || statusFilter !== "all" || progressFilter !== "all"
                        ? `Tidak ada siswa yang sesuai dengan filter yang dipilih.`
                        : "Klik tombol di bawah untuk memasukkan siswa dengan mengetik username atau memindai QR code profil siswa."}
                    </p>
                  </div>
                  {!searchStudentTerm && statusFilter === "all" && progressFilter === "all" && (
                    <Button
                      onClick={() => {
                        setAddStudentInitialTab("search");
                        setIsAddStudentOpen(true);
                      }}
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
                        <TableHead className="w-10 py-2 pl-4 pr-1">
                          <Checkbox
                            aria-label="Pilih semua siswa di halaman ini"
                            checked={
                              isAllCurrentPageSelected
                                ? true
                                : isSomeCurrentPageSelected
                                  ? "indeterminate"
                                  : false
                            }
                            onCheckedChange={(checked) => handleToggleSelectAll(checked === true)}
                          />
                        </TableHead>
                        <TableHead className="font-semibold text-xs py-2 pl-2">Nama Siswa</TableHead>
                        <TableHead className="font-semibold text-xs py-2">Progres</TableHead>
                        <TableHead className="font-semibold text-xs py-2">Rata-rata</TableHead>
                        <TableHead className="font-semibold text-xs py-2">Status</TableHead>
                        <TableHead className="font-semibold text-xs py-2 pr-5 w-16 text-center">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedStudents.map((student) => {
                        const score = student.predictedExamScore ?? student.accuracyRate;
                        const pendingTasks = Math.max(0, student.totalAssignedTasks - student.completedTasksCount);
                        const isSelesai = score >= 75;
                        const isSelected = selectedStudentIds.includes(student.id);
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
                          <TableRow
                            key={student.id}
                            data-state={isSelected ? "selected" : undefined}
                            className={`hover:bg-muted/30 transition-colors cursor-pointer ${isSelected ? "bg-orange-50/40 dark:bg-orange-950/15" : ""
                              }`}
                            onClick={() =>
                              router.push(`/dashboard/teacher/students/${encodeURIComponent(student.id)}`)
                            }
                          >
                            {/* Checkbox Pilihan */}
                            <TableCell
                              className="py-3 pl-4 pr-1 w-10"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Checkbox
                                aria-label={`Pilih ${student.fullname}`}
                                checked={isSelected}
                                onCheckedChange={(checked) =>
                                  handleToggleSelectStudent(student.id, checked === true)
                                }
                              />
                            </TableCell>

                            {/* Nama Siswa */}
                            <TableCell className="pl-2 py-3">
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

                            {/* Status Nilai (Baik / Cukup / Kurang) */}
                            <TableCell className="py-3">
                              {score >= 75 ? (
                                <Badge
                                  className="text-[10px] font-medium py-0 px-2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                                >
                                  Baik
                                </Badge>
                              ) : score >= 65 ? (
                                <Badge
                                  className="text-[10px] font-medium py-0 px-2 bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
                                >
                                  Cukup
                                </Badge>
                              ) : (
                                <Badge
                                  className="text-[10px] font-medium py-0 px-2 bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
                                >
                                  Kurang
                                </Badge>
                              )}
                            </TableCell>

                            {/* Aksi (Hanya Titik Tiga, Opsi Kondisional di Dalam Dropdown) */}
                            <TableCell className="py-3 pr-5 text-center" onClick={(e) => e.stopPropagation()}>
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
                                        href={`/dashboard/teacher/students/${encodeURIComponent(
                                          student.id
                                        )}`}
                                        className="cursor-pointer flex items-center gap-2 text-xs"
                                      >
                                        <Eye className="size-3.5 text-muted-foreground" />
                                        <span>Detail Siswa</span>
                                      </Link>
                                    </DropdownMenuItem>

                                    {/* Opsi Remedial jika status remedial */}
                                    {!isSelesai && (
                                      <DropdownMenuItem asChild>
                                        <Link
                                          href={`/dashboard/teacher/tasks?remedial=1&groupId=${encodeURIComponent(
                                            currentGroup?.id || ""
                                          )}&studentIds=${encodeURIComponent(student.id)}`}
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
                                        onClick={() =>
                                          handleSendReminder(student.id, student.fullname, pendingTasks)
                                        }
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
                                      <span>Hapus</span>
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

              {totalFilteredStudents > 0 && (
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  isLoading={isLoadingMembers}
                  onPageChange={setCurrentPage}
                />
              )}
            </CardContent>
          </Card>

      {/* DIALOG 1: TAMBAH SISWA (KETIK USERNAME / SCAN QR) */}
      {currentGroup && (
        <AddStudentDialog
          open={isAddStudentOpen}
          onOpenChange={setIsAddStudentOpen}
          groupName={currentGroup.name}
          groupId={currentGroup.id}
          existingStudentIds={currentGroup.students.map((s) => s.id)}
          onStudentAdded={handleStudentAdded}
          onStudentInvited={handleStudentInvited}
          initialTab={addStudentInitialTab}
        />
      )}

      {/* DIALOG 2: BUAT GRUP BARU */}
      <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
        <DialogContent className="sm:max-w-[460px] p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-600" />
              Buat Kelas
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateGroup} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Nama Kelas</Label>
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

      {/* DIALOG 3: KONFIRMASI HAPUS SISWA */}
      <ConfirmActionDialog
        open={!!deleteConfirmTarget}
        onOpenChange={(open) => !open && setDeleteConfirmTarget(null)}
        variant="destructive"
        isLoading={isBulkDeleting}
        title={
          deleteConfirmTarget?.mode === "single"
            ? "Keluarkan Siswa?"
            : `Keluarkan ${deleteConfirmTarget?.studentIds.length ?? 0} Siswa?`
        }
        description={
          deleteConfirmTarget?.mode === "single"
            ? `Keluarkan ${deleteConfirmTarget.studentName} dari kelas ${currentGroup?.name ?? ""}?`
            : `Keluarkan ${deleteConfirmTarget?.studentIds.length ?? 0} siswa terpilih dari kelas ${currentGroup?.name ?? ""}?`
        }
        confirmLabel="Iya"
        cancelLabel="Batal"
        onConfirm={handleConfirmDeleteStudents}
      />
    </div>
  );
}

