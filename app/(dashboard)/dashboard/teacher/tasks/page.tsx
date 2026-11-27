"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
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
  Calendar as CalendarIcon,
  Layers,
  Loader2,
  MoreHorizontal,
  Edit,
  Trash2,
  BookOpen,
  Gamepad2,
  ArrowRight,
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Combobox } from "@/components/ui/combobox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClockFacePicker } from "@/components/ui/clock-face-picker";
import { TablePagination } from "@/components/ui/table-pagination";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
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
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import { CreateRoomDialog, type CreateRoomSelection } from "@/components/tasks/create-room-dialog";
import { Skeleton } from "@/components/ui/skeleton";
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
  StudentTask,
  AcademicGroup
} from "@/data/students-data";
import { useAnalyticsAuth } from "@/contexts/analytics-auth-context";
import {
  fetchTeacherTasks,
  fetchTeacherTasksPage,
  createTeacherTasks,
  updateTeacherTask,
  deleteTeacherTask,
  startTaskSession
} from "@/lib/tasks/client";
import { isTaskDueToday, getTaskStatusCategory, parseTaskDeadline } from "@/lib/tasks/utils";
import { toast } from "sonner";

const PAGE_SIZE = 20;
const TODAY_PAGE_SIZE = 12; // 3 kolom x 4 baris

export default function TeacherTasksPage() {
  const { user } = useAnalyticsAuth();
  const [groups, setGroups] = useState<AcademicGroup[]>([]);
  const [tasks, setTasks] = useState<StudentTask[]>([]);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>("all");
  const [searchTableQuery, setSearchTableQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [todayPage, setTodayPage] = useState<number>(1);
  const [paginatedTasks, setPaginatedTasks] = useState<StudentTask[]>([]);
  const [totalPaginatedTasks, setTotalPaginatedTasks] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoadingTasksPage, setIsLoadingTasksPage] = useState<boolean>(false);
  const [tasksRefreshKey, setTasksRefreshKey] = useState<number>(0);

  const nextPageCacheRef = useRef<{
    key: string;
    tasks: StudentTask[];
    total: number;
    totalPages: number;
  } | null>(null);
  const prefetchAbortRef = useRef<AbortController | null>(null);

  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [startingSessionTaskId, setStartingSessionTaskId] = useState<string | null>(null);
  const [roomModalTask, setRoomModalTask] = useState<StudentTask | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "reguler" | "prescriptive_remedial">("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [preselectedStudentIds, setPreselectedStudentIds] = useState<string[]>([]);

  // Modal State: Detail & Edit
  const [viewingDetailTask, setViewingDetailTask] = useState<StudentTask | null>(null);
  const [editingTask, setEditingTask] = useState<StudentTask | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editPassingScore, setEditPassingScore] = useState("75");
  const [editType, setEditType] = useState<"reguler" | "prescriptive_remedial">("reguler");
  const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const hasLoadedQuizzesRef = useRef(false);

  // Load persistent groups (lite) & tasks secara paralel dengan Promise.all
  useEffect(() => {
    let cancelled = false;
    const loadInitialData = async () => {
      setIsInitialLoading(true);
      try {
        const queryParam = user?.id
          ? `?lite=1&creator_id=${encodeURIComponent(user.id)}`
          : "?lite=1";
        const [groupsData, loadedTasks] = await Promise.all([
          fetch(`/api/groups${queryParam}`)
            .then((r) => r.json())
            .catch(() => null),
          fetchTeacherTasks(user?.id).catch(() => [] as StudentTask[])
        ]);
        if (cancelled) return;
        if (groupsData?.success && Array.isArray(groupsData.groups)) {
          setGroups(groupsData.groups);
        }
        setTasks(loadedTasks);
      } catch (err) {
        console.warn("Gagal fetch data tugas:", err);
      } finally {
        if (!cancelled) {
          setIsInitialLoading(false);
        }
      }
    };

    loadInitialData();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchTableQuery.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTableQuery]);

  // Reset ke halaman 1 dan hapus cache saat filter kelas atau pencarian berubah
  useEffect(() => {
    nextPageCacheRef.current = null;
    setCurrentPage(1);
  }, [selectedGroupFilter, debouncedSearchQuery]);

  useEffect(() => {
    setTodayPage(1);
  }, [selectedGroupFilter]);

  const buildPageCacheKey = useCallback(
    (teacherId: string | undefined, groupId: string, page: number, search: string) =>
      `${teacherId || ""}:${groupId}:${page}:${search}`,
    []
  );

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    prefetchAbortRef.current?.abort();

    const prefetchNextPage = async (nextPage: number) => {
      const nextController = new AbortController();
      prefetchAbortRef.current = nextController;
      try {
        const res = await fetchTeacherTasksPage({
          teacherId: user?.id,
          groupId: selectedGroupFilter,
          page: nextPage,
          limit: PAGE_SIZE,
          search: debouncedSearchQuery,
          signal: nextController.signal
        });
        if (!cancelled && !nextController.signal.aborted) {
          nextPageCacheRef.current = {
            key: buildPageCacheKey(user?.id, selectedGroupFilter, nextPage, debouncedSearchQuery),
            tasks: res.tasks,
            total: res.pagination.total,
            totalPages: res.pagination.totalPages
          };
        }
      } catch {
        // Abaikan error prefetch / abort
      }
    };

    const loadCurrentPage = async () => {
      const targetKey = buildPageCacheKey(
        user?.id,
        selectedGroupFilter,
        currentPage,
        debouncedSearchQuery
      );
      const cached = nextPageCacheRef.current;

      // Hapus cache lama saat pindah halaman agar tidak membebani memori
      nextPageCacheRef.current = null;

      if (cached && cached.key === targetKey) {
        setPaginatedTasks(cached.tasks);
        setTotalPaginatedTasks(cached.total);
        setTotalPages(cached.totalPages);
        if (currentPage < cached.totalPages) {
          void prefetchNextPage(currentPage + 1);
        }
        return;
      }

      setIsLoadingTasksPage(true);
      try {
        const res = await fetchTeacherTasksPage({
          teacherId: user?.id,
          groupId: selectedGroupFilter,
          page: currentPage,
          limit: PAGE_SIZE,
          search: debouncedSearchQuery,
          signal: controller.signal
        });
        if (!cancelled) {
          setPaginatedTasks(res.tasks);
          setTotalPaginatedTasks(res.pagination.total);
          setTotalPages(res.pagination.totalPages);
          if (currentPage < res.pagination.totalPages) {
            void prefetchNextPage(currentPage + 1);
          }
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.warn("Gagal memuat halaman tugas:", err);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingTasksPage(false);
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
    user?.id,
    selectedGroupFilter,
    currentPage,
    debouncedSearchQuery,
    tasksRefreshKey,
    buildPageCacheKey
  ]);

  // Form State: Buat Baru
  const [newTitle, setNewTitle] = useState("");
  const [newGroupId, setNewGroupId] = useState("all");
  const [newQuizId, setNewQuizId] = useState("");
  const [newQuizTitle, setNewQuizTitle] = useState("");
  const [newQuestionCount, setNewQuestionCount] = useState<number>(10);
  const [newGameId, setNewGameId] = useState("none");
  const [newType, setNewType] = useState<"reguler" | "prescriptive_remedial">("reguler");
  const [newTargetScope, setNewTargetScope] = useState<"all" | "remedial_only">("all");
  const [newDeadline, setNewDeadline] = useState<Date>(() => {
    const today = new Date();
    today.setHours(23, 59, 0, 0);
    return today;
  });
  const [newDeadlineTime, setNewDeadlineTime] = useState("23:59");
  const [newPassingScore, setNewPassingScore] = useState("75");

  // Available Quizzes & Games from API
  const [availableQuizzes, setAvailableQuizzes] = useState<any[]>([]);
  const [availableGames, setAvailableGames] = useState<any[]>([]);

  // Deduplicated game list for options
  const gameOptions = React.useMemo(() => {
    const seen = new Set<string>();
    const list: { value: string; label: string }[] = [{ value: "none", label: "Bebas" }];

    availableGames.forEach((g) => {
      if (!g?.name) return;
      const clean = g.name.trim();
      const norm = clean.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!norm || norm === "gameforsmart" || norm === "gameforsmartcom") return;
      if (!seen.has(norm)) {
        seen.add(norm);
        list.push({
          value: clean,
          label: clean
        });
      }
    });

    return list;
  }, [availableGames]);

  // Lazy-load quizzes & games hanya saat modal Buat Tugas dibuka
  useEffect(() => {
    if (!isCreateTaskOpen || hasLoadedQuizzesRef.current) return;
    hasLoadedQuizzesRef.current = true;
    const fetchQuizzesAndGames = async () => {
      try {
        const res = await fetch(`/api/quizzes-and-games?userId=${encodeURIComponent(user?.id || "")}`);
        const data = await res.json();
        if (data.success) {
          if (Array.isArray(data.quizzes)) {
            setAvailableQuizzes(data.quizzes);
            const validQuizzes = data.quizzes.filter(
              (q: any) => q.isPublic || (user?.id && q.creatorId === user?.id)
            );
            if (validQuizzes.length > 0 && !newQuizId) {
              setNewQuizId(validQuizzes[0].id);
              setNewQuizTitle(validQuizzes[0].title);
              setNewQuestionCount(validQuizzes[0].questionCount || 10);
            }
          }
          if (Array.isArray(data.games)) {
            setAvailableGames(data.games);
          }
        }
      } catch (err) {
        hasLoadedQuizzesRef.current = false;
        console.warn("Failed fetching quizzes/games:", err);
      }
    };
    fetchQuizzesAndGames();
  }, [isCreateTaskOpen, user?.id]);

  // Tangkap konteks 1-Klik Remedial dari URL (?remedial=1&groupId=...&studentIds=...&title=...)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("remedial") === "1") {
      const qGroupId = params.get("groupId");
      const qStudentIds = params.get("studentIds");
      const qTitle = params.get("title");

      setNewType("prescriptive_remedial");
      setNewTargetScope("remedial_only");
      if (qGroupId) setNewGroupId(qGroupId);
      if (qStudentIds) {
        setPreselectedStudentIds(
          qStudentIds
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        );
      }
      if (qTitle) {
        setNewTitle(qTitle);
      } else {
        setNewTitle("Remedial Pemahaman Kuis");
      }
      setIsCreateTaskOpen(true);
    }
  }, []);

  // Filter tasks by group
  const filteredTasks = tasks.filter(
    (t) => selectedGroupFilter === "all" || t.groupId === selectedGroupFilter
  );

  // Tugas Hari Ini (filter tanggal jatuh tempo hari ini, 3 kolom x 4 baris = 12 per halaman)
  const allTodayTasks = filteredTasks.filter((t) => isTaskDueToday(t.deadline));
  const todayTotalPages = Math.max(1, Math.ceil(allTodayTasks.length / TODAY_PAGE_SIZE));
  const safeTodayPage = Math.min(todayPage, todayTotalPages);
  const todayTasks = allTodayTasks.slice(
    (safeTodayPage - 1) * TODAY_PAGE_SIZE,
    safeTodayPage * TODAY_PAGE_SIZE
  );

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
      : 0;

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
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error("Judul tugas wajib diisi.");
      return;
    }

    if (!user?.id) {
      toast.error("Sesi guru tidak ditemukan. Silakan login ulang.");
      return;
    }

    if (groups.length === 0) {
      toast.error("Harap buat kelas terlebih dahulu sebelum membuat tugas.");
      return;
    }

    const parsedNewKkm = Number(newPassingScore);
    if (
      newPassingScore.trim() === "" ||
      Number.isNaN(parsedNewKkm) ||
      parsedNewKkm < 0 ||
      parsedNewKkm > 100
    ) {
      toast.error("Nilai KKM wajib diisi (0 - 100).");
      return;
    }

    // Tentukan grup target: jika "all", buat untuk semua kelas
    const targetGroups = newGroupId === "all"
      ? groups
      : [groups.find((g) => g.id === newGroupId) || groups[0]];

    const selectedQuiz = availableQuizzes.find((q) => q.id === newQuizId);
    const quizTitle = selectedQuiz?.title || newQuizTitle || "Kuis Pilihan";
    const gameName = newGameId && newGameId !== "none" ? newGameId : undefined;
    const formattedDeadline = format(newDeadline, "d MMM yyyy, HH:mm", { locale: localeId }) + " WIB";

    const payloads = targetGroups.map((group) => {
      let targetStudents = group.students || [];
      if (newTargetScope === "remedial_only") {
        if (preselectedStudentIds.length > 0) {
          targetStudents = (group.students || []).filter((s) =>
            preselectedStudentIds.includes(s.id)
          );
        } else {
          targetStudents = (group.students || []).filter(
            (s) =>
              (s.predictedExamScore ?? s.accuracyRate) < parsedNewKkm ||
              s.readinessStatus === "Cukup" ||
              s.readinessStatus === "Kurang" ||
              s.unmasteredTopics.length > 0
          );
        }
        if (targetStudents.length === 0) targetStudents = (group.students || []).slice(0, 2);
      }

      return {
        teacherId: user.id,
        groupId: group.id,
        groupName: group.name,
        title: newTitle.trim(),
        quizId: newQuizId || undefined,
        quizTitle,
        questionCount: newQuestionCount,
        gameId: gameName,
        gameName,
        subject: group.subjects?.[0] || group.subject || "Matematika",
        type: newType,
        targetScope: newTargetScope,
        targetCompetency: "",
        deadline: formattedDeadline,
        passingScore: parsedNewKkm,
        studentIds: targetStudents.map((s) => s.id)
      };
    });

    try {
      const createdTasks = await createTeacherTasks(payloads);
      setTasks((prev) => [...createdTasks, ...prev]);
      nextPageCacheRef.current = null;
      if (currentPage === 1) {
        setTasksRefreshKey((k) => k + 1);
      } else {
        setCurrentPage(1);
      }
      setIsCreateTaskOpen(false);
      setNewTitle("");
      setPreselectedStudentIds([]);
      if (newGroupId === "all") {
        toast.success(`Tugas "${newTitle}" berhasil dibuat untuk ${targetGroups.length} kelas!`);
      } else {
        toast.success(`Tugas "${newTitle}" berhasil dibuat!`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Gagal menyimpan tugas ke database.");
    }
  };

  // Handler: Mulai atau Buka Sesi Room untuk tugas yang sudah ada
  const handleStartTaskSession = async (
    task: StudentTask,
    selection?: CreateRoomSelection
  ) => {
    setStartingSessionTaskId(task.id);
    const hostWindow = typeof window !== "undefined" ? window.open("about:blank", "_blank") : null;

    try {
      const res = await startTaskSession(task.id, {
        hostId: user?.id,
        gameId: selection?.gameId,
        gameName: selection?.gameName,
        durationMinutes: selection?.durationMinutes,
        questionLimit: selection?.questionLimit,
        difficulty: selection?.difficulty,
        gameEndMode: selection?.gameEndMode,
        allowJoinAfterStart: selection?.allowJoinAfterStart
      });
      if (res.task) {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? res.task! : t)));
        setPaginatedTasks((prev) => prev.map((t) => (t.id === task.id ? res.task! : t)));
      }
      setRoomModalTask(null);
      if (hostWindow) {
        hostWindow.location.href = res.redirectUrl;
      } else if (typeof window !== "undefined") {
        window.open(res.redirectUrl, "_blank");
      }
      toast.success(
        res.reused
          ? `Room dibuka kembali (PIN: ${res.gamePin})`
          : `Sesi room dibuat! PIN: ${res.gamePin}`
      );
    } catch (err: any) {
      if (hostWindow) hostWindow.close();
      toast.error(err?.message || "Gagal memulai sesi room.");
    } finally {
      setStartingSessionTaskId(null);
    }
  };

  // Handler: Buka Modal Edit
  const handleOpenEdit = (task: StudentTask) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDeadline(task.deadline);
    setEditPassingScore(String(task.passingScore));
    setEditType(task.type);
  };

  // Handler: Validasi Edit lalu buka modal konfirmasi
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    if (!editTitle.trim()) {
      toast.error("Judul tugas wajib diisi.");
      return;
    }
    const parsedEditKkm = Number(editPassingScore);
    if (
      editPassingScore.trim() === "" ||
      Number.isNaN(parsedEditKkm) ||
      parsedEditKkm < 0 ||
      parsedEditKkm > 100
    ) {
      toast.error("Nilai KKM wajib diisi (0 - 100).");
      return;
    }
    setIsEditConfirmOpen(true);
  };

  // Handler: Eksekusi Simpan Hasil Edit setelah konfirmasi
  const handleConfirmSaveEdit = async () => {
    if (!editingTask) return;
    setIsSavingEdit(true);
    try {
      const updatedTask = await updateTeacherTask(editingTask.id, {
        title: editTitle.trim(),
        deadline: editDeadline,
        passingScore: Number(editPassingScore),
        type: editType
      });

      setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? updatedTask : t)));
      nextPageCacheRef.current = null;
      setTasksRefreshKey((k) => k + 1);
      setIsEditConfirmOpen(false);
      setEditingTask(null);
      toast.success("Tugas berhasil diperbarui.");
    } catch (err: any) {
      toast.error(err?.message || "Gagal memperbarui tugas.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handler: Buka modal konfirmasi hapus tugas
  const handleDeleteTask = (taskId: string, taskTitle: string) => {
    setDeleteTarget({ id: taskId, title: taskTitle });
  };

  // Handler: Eksekusi hapus tugas setelah konfirmasi
  const handleConfirmDeleteTask = async () => {
    if (!deleteTarget) return;
    setIsDeletingTask(true);
    try {
      await deleteTeacherTask(deleteTarget.id);
      setTasks((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      nextPageCacheRef.current = null;
      if (paginatedTasks.length === 1 && currentPage > 1) {
        setCurrentPage((p) => Math.max(1, p - 1));
      } else {
        setTasksRefreshKey((k) => k + 1);
      }
      toast.info(`Tugas "${deleteTarget.title}" telah dihapus.`);
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err?.message || "Gagal menghapus tugas.");
    } finally {
      setIsDeletingTask(false);
    }
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
            <SelectTrigger className="h-9 w-fit min-w-[140px] max-w-full text-xs font-semibold rounded-xl bg-background border-orange-200 dark:border-zinc-800 shadow-2xs gap-2">
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
      {isInitialLoading ? (
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
            title="Total Tugas"
            value={totalTasksCount}
            icon="play"
          />

          <StatCard
            title="Rata-rata Nilai"
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
      )}

      {/* 3. Bagian: Tugas Hari Ini */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-orange-600" />
            <h2 className="text-base font-bold text-foreground">Tugas Hari Ini</h2>
            <Badge variant="outline" className="text-[10px] font-semibold">
              {allTodayTasks.length} tugas
            </Badge>
          </div>
          <Link
            href="/dashboard/teacher/tasks/today"
            className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700"
          >
            <span>Lihat Semua</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isInitialLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 rounded-2xl border bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24 rounded-full" />
                  <Skeleton className="h-4 w-12 rounded-full" />
                </div>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        ) : todayTasks.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground border rounded-2xl bg-card">
            Tidak ada tugas yang dijadwalkan hari ini.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {todayTasks.map((task) => {
                return (
                  <Link
                    key={task.id}
                    href={`/dashboard/teacher/tasks/${task.id}`}
                    className="p-4 rounded-2xl border transition-all text-left flex flex-col justify-between gap-3 shadow-2xs bg-card hover:border-orange-300 dark:hover:border-orange-800"
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
                          {task.gamePin && (
                            <Badge
                              variant="outline"
                              className="ml-1 text-[10px] font-mono font-bold px-1.5 py-0 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                            >
                              PIN: {task.gamePin}
                            </Badge>
                          )}
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
                  </Link>
                );
              })}
            </div>

            {todayTotalPages > 1 && (
              <TablePagination
                currentPage={safeTodayPage}
                totalPages={todayTotalPages}
                onPageChange={setTodayPage}
              />
            )}
          </div>
        )}
      </div>

      {/* 4. Bagian: Tabel Semua Tugas */}
      <Card className="rounded-2xl shadow-sm border overflow-hidden gap-0 py-0">
        <CardHeader className="px-5 py-3 border-b flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-orange-600" />
            <CardTitle className="text-base font-bold text-foreground">Semua Tugas</CardTitle>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(v) =>
                setStatusFilter(v as "all" | "active" | "completed")
              }
            >
              <SelectTrigger className="w-36 h-8 text-xs rounded-xl">
                <SelectValue placeholder="Status Tugas" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="text-xs">
                  Semua Status
                </SelectItem>
                <SelectItem value="active" className="text-xs">
                  Aktif
                </SelectItem>
                <SelectItem value="completed" className="text-xs">
                  Selesai
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={typeFilter}
              onValueChange={(v) =>
                setTypeFilter(v as "all" | "reguler" | "prescriptive_remedial")
              }
            >
              <SelectTrigger className="w-36 h-8 text-xs rounded-xl">
                <SelectValue placeholder="Tipe Tugas" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="text-xs">
                  Semua Tipe
                </SelectItem>
                <SelectItem value="reguler" className="text-xs">
                  Tugas
                </SelectItem>
                <SelectItem value="prescriptive_remedial" className="text-xs">
                  Remedial
                </SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1">
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-8 w-36 text-xs rounded-xl"
                aria-label="Filter tanggal tugas"
              />
              {dateFilter && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDateFilter("")}
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground rounded-xl"
                >
                  Reset
                </Button>
              )}
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari..."
                value={searchTableQuery}
                onChange={(e) => setSearchTableQuery(e.target.value)}
                className="h-8 pl-8 text-xs rounded-xl"
              />
            </div>
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
                  <TableHead className="text-center font-semibold">Rata-rata Nilai</TableHead>
                  <TableHead className="font-semibold">Batas Waktu</TableHead>
                  <TableHead className="pr-4 text-right font-semibold">Aksi</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoadingTasksPage && paginatedTasks.length === 0 ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="pl-4"><Skeleton className="h-4 w-5" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-44" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-4 w-10 mx-auto" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell className="pr-4 text-right"><Skeleton className="h-7 w-7 ml-auto rounded-lg" /></TableCell>
                    </TableRow>
                  ))
                ) : paginatedTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                      Tidak ada tugas yang cocok dengan pencarian.
                    </TableCell>
                  </TableRow>
                ) : (() => {
                  const tabFilteredTasks = paginatedTasks.filter((task) => {
                    const statusCat = getTaskStatusCategory(task);
                    if (statusFilter === "active" && statusCat !== "aktif") return false;
                    if (statusFilter === "completed" && statusCat !== "selesai") return false;

                    if (typeFilter !== "all" && task.type !== typeFilter) return false;

                    if (dateFilter) {
                      const d = parseTaskDeadline(task.deadline);
                      if (!d) return false;
                      const yyyy = d.getFullYear();
                      const mm = String(d.getMonth() + 1).padStart(2, "0");
                      const dd = String(d.getDate()).padStart(2, "0");
                      if (`${yyyy}-${mm}-${dd}` !== dateFilter) return false;
                    }

                    return true;
                  });

                  if (tabFilteredTasks.length === 0) {
                    return (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                          Tidak ada tugas yang cocok dengan filter tab ini.
                        </TableCell>
                      </TableRow>
                    );
                  }

                  return tabFilteredTasks.map((task, index) => {
                    return (
                      <TableRow
                        key={task.id}
                        className="transition-colors text-xs hover:bg-muted/40"
                      >
                        <TableCell className="pl-4 font-semibold text-muted-foreground">
                          {(currentPage - 1) * PAGE_SIZE + index + 1}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/dashboard/teacher/tasks/${task.id}`}
                            className="font-bold text-foreground hover:text-orange-600 transition-colors"
                          >
                            {task.title}
                          </Link>
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
                          {task.gamePin && (
                            <Badge
                              variant="outline"
                              className="ml-1 text-[10px] font-mono font-bold px-1.5 py-0 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                            >
                              PIN: {task.gamePin}
                            </Badge>
                          )}
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
                            <DropdownMenuContent align="end" className="w-44 rounded-xl text-xs">
                              <DropdownMenuItem asChild className="cursor-pointer gap-2 py-1.5">
                                <Link href={`/dashboard/teacher/tasks/${task.id}`}>
                                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Detail</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={startingSessionTaskId === task.id}
                                onClick={() =>
                                  task.sessionId
                                    ? handleStartTaskSession(task)
                                    : setRoomModalTask(task)
                                }
                                className="cursor-pointer gap-2 py-1.5 text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50 dark:focus:bg-emerald-950/40"
                              >
                                {startingSessionTaskId === task.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                )}
                                <span>{task.sessionId ? "Masuk Room" : "Buat Room"}</span>
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
                                <span>Hapus</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  });
                })()}
              </TableBody>
            </Table>
          </div>

          {totalPaginatedTasks > 0 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              isLoading={isLoadingTasksPage}
              onPageChange={setCurrentPage}
            />
          )}
        </CardContent>
      </Card>

      {/* Modal 1: Buat Tugas Baru */}
      <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
        <DialogContent className="sm:max-w-[480px] p-5 rounded-2xl">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-orange-600" />
              Buat Tugas
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateTask} className="space-y-3.5 pt-2">
            <div className="space-y-2">
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
              <div className="space-y-2">
                <Label className="text-xs">Kelas Sasaran</Label>
                <Select value={newGroupId} onValueChange={setNewGroupId}>
                  <SelectTrigger className="h-8 w-full text-xs rounded-xl">
                    <SelectValue placeholder="Pilih Kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kelas</SelectItem>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Tipe</Label>
                <Select value={newType} onValueChange={(v: any) => setNewType(v)}>
                  <SelectTrigger className="h-8 w-full text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reguler">Tugas</SelectItem>
                    <SelectItem value="prescriptive_remedial">Remedial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5 text-orange-600" />
                <span>Pilih Kuis Soal</span>
              </label>
              <Combobox
                tabs={[
                  { id: "public", label: "Public Quiz", icon: <BookOpen className="h-3 w-3" /> },
                  { id: "my", label: "My Quiz", icon: <Edit className="h-3 w-3" /> },
                ]}
                options={[
                  ...availableQuizzes
                    .filter((q) => q.isPublic || (user?.id && q.creatorId === user?.id))
                    .map((q) => ({
                      value: q.id,
                      label: q.title,
                      group: user?.id && q.creatorId === user?.id ? "my" : "public",
                    }))
                ]}
                value={newQuizId}
                onValueChange={(val) => {
                  setNewQuizId(val);
                  const selected = availableQuizzes.find((q) => q.id === val);
                  if (selected) {
                    setNewQuizTitle(selected.title);
                    if (selected.questionCount) {
                      setNewQuestionCount(selected.questionCount);
                    }
                  }
                }}
                placeholder="Pilih kuis soal..."
                searchPlaceholder="Cari kuis soal..."
                emptyText="Tidak ada kuis ditemukan."
                className="w-full h-8 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">
                Jumlah Soal
              </Label>
              {(() => {
                const maxQ = availableQuizzes.find((q) => q.id === newQuizId)?.questionCount || 0;
                const options: number[] = [];
                if (maxQ >= 5) options.push(5);
                for (let i = 10; i < maxQ; i += 10) {
                  options.push(i);
                }
                if (maxQ > 0 && !options.includes(maxQ)) options.push(maxQ);
                return (
                  <Select
                    value={String(newQuestionCount)}
                    onValueChange={(v) => setNewQuestionCount(parseInt(v) || 1)}
                  >
                    <SelectTrigger className="h-8 text-xs rounded-xl w-full">
                      <SelectValue placeholder="Pilih jumlah soal" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.length > 0 ? options.map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} Soal
                        </SelectItem>
                      )) : (
                        <SelectItem value={String(newQuestionCount)}>
                          {newQuestionCount}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                );
              })()}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-2">
                <Label className="text-xs">Batas Waktu</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-8 w-full justify-start text-xs rounded-xl font-normal"
                    >
                      <CalendarIcon className="mr-2 h-3.5 w-3.5 opacity-70" />
                      {format(newDeadline, "d MMM yyyy, HH:mm", { locale: localeId })} WIB
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start" side="top" sideOffset={6}>
                    <div className="flex sm:flex-row flex-col divide-y sm:divide-y-0 sm:divide-x">
                      {/* Kalender */}
                      <Calendar
                        mode="single"
                        selected={newDeadline}
                        onSelect={(date) => {
                          if (date) {
                            const updated = new Date(date);
                            updated.setHours(newDeadline.getHours(), newDeadline.getMinutes(), 0, 0);
                            setNewDeadline(updated);
                          }
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />

                      {/* 24-Hour Circular Clock Face Picker */}
                      <div className="flex flex-col p-2">
                        <ClockFacePicker
                          value={newDeadline}
                          onChange={(date) => setNewDeadline(date)}
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Nilai KKM</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  required
                  value={newPassingScore}
                  onChange={(e) => setNewPassingScore(e.target.value)}
                  className="h-8 text-xs rounded-xl [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
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
                Tambah
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
              <div className="space-y-2">
                <Label className="text-xs">Judul Tugas</Label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="h-8 text-xs rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-2">
                  <Label className="text-xs">Kelas</Label>
                  <Input
                    value={editingTask.groupName}
                    disabled
                    className="h-8 text-xs rounded-xl bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Tipe</Label>
                  <Select value={editType} onValueChange={(v: any) => setEditType(v)}>
                    <SelectTrigger className="h-8 text-xs rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reguler">Tugas</SelectItem>
                      <SelectItem value="prescriptive_remedial">Remedial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-2">
                  <Label className="text-xs">Batas Waktu</Label>
                  <Input
                    value={editDeadline}
                    onChange={(e) => setEditDeadline(e.target.value)}
                    className="h-8 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Nilai KKM</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={editPassingScore}
                    onChange={(e) => setEditPassingScore(e.target.value)}
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
                    <span className="text-muted-foreground">Rata-rata Nilai:</span>
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

      {/* Modal 4: Pilih Game / App untuk Buat Room */}
      <CreateRoomDialog
        open={!!roomModalTask}
        onOpenChange={(open) => !open && setRoomModalTask(null)}
        defaultGameId={roomModalTask?.gameId}
        isSubmitting={!!roomModalTask && startingSessionTaskId === roomModalTask.id}
        onConfirm={(selection) => {
          if (roomModalTask) {
            return handleStartTaskSession(roomModalTask, selection);
          }
        }}
      />

      {/* Modal 5: Konfirmasi Simpan Perubahan Edit Tugas */}
      <ConfirmActionDialog
        open={isEditConfirmOpen}
        onOpenChange={setIsEditConfirmOpen}
        variant="warning"
        isLoading={isSavingEdit}
        title="Simpan Perubahan Tugas?"
        description={`Simpan perubahan pada tugas "${editTitle.trim()}"?`}
        confirmLabel="Iya"
        cancelLabel="Batal"
        onConfirm={handleConfirmSaveEdit}
      />

      {/* Modal 5: Konfirmasi Hapus Tugas */}
      <ConfirmActionDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        variant="destructive"
        isLoading={isDeletingTask}
        title="Hapus Tugas?"
        description={`Hapus tugas "${deleteTarget?.title ?? ""}" secara permanen?`}
        confirmLabel="Iya"
        cancelLabel="Batal"
        onConfirm={handleConfirmDeleteTask}
      />
    </div>
  );
}
