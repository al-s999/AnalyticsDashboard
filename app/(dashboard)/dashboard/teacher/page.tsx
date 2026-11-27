"use client";

import React, { useState, useEffect } from "react";
import { useAnalyticsAuth } from "@/contexts/analytics-auth-context";
import {
  StatCard,
  QuickActionsGrid,
  type QuickActionItem
} from "@/components/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Plus,
  PieChart as PieChartIcon,
  XCircle,
  Calendar as CalendarIcon,
  Gamepad2,
  Edit
} from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClockFacePicker } from "@/components/ui/clock-face-picker";
import { format, parse, isValid } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { PieChart, Pie, Cell } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";
import Link from "next/link";
import { toast } from "sonner";
import {
  INITIAL_TASKS,
  AcademicGroup,
  StudentTask,
  StudentProfile
} from "@/data/students-data";
import { fetchTeacherTasks, createTeacherTasks } from "@/lib/tasks/client";
import { AddStudentDialog } from "@/components/groups/add-student-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeacherDashboardPage() {
  const { user } = useAnalyticsAuth();

  // State Groups & Tasks (dengan sinkronisasi localStorage)
  const [groups, setGroups] = useState<AcademicGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [tasks, setTasks] = useState<StudentTask[]>(INITIAL_TASKS);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState("Hari ini, 07:30 WIB");

  // Modal State untuk Pop-up Scan QR & Pop-up Tambah Tugas
  const [isScanQrOpen, setIsScanQrOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  // Form State: Tambah Tugas Baru
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskGroupId, setNewTaskGroupId] = useState("all");
  const [newTaskQuizId, setNewTaskQuizId] = useState("");
  const [newTaskQuizTitle, setNewTaskQuizTitle] = useState("");
  const [newTaskQuestionCount, setNewTaskQuestionCount] = useState<number>(10);
  const [newTaskGameId, setNewTaskGameId] = useState("none");
  const [newTaskType, setNewTaskType] = useState<"reguler" | "prescriptive_remedial">("reguler");
  const [newTaskDeadline, setNewTaskDeadline] = useState<Date>(() => {
    const today = new Date();
    today.setHours(23, 59, 0, 0);
    return today;
  });
  const [newTaskDeadlineTime, setNewTaskDeadlineTime] = useState("23:59");
  const [newTaskPassingScore, setNewTaskPassingScore] = useState("75");

  // Available Quizzes & Games from API
  const [availableQuizzes, setAvailableQuizzes] = useState<any[]>([]);
  const [availableGames, setAvailableGames] = useState<any[]>([]);

  // Deduplicated game list for options
  const gameOptions = React.useMemo(() => {
    const seen = new Set<string>();
    const list: { value: string; label: string }[] = [{ value: "none", label: "Tanpa Game" }];

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

  const hasLoadedQuizzesRef = React.useRef(false);

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
            if (validQuizzes.length > 0 && !newTaskQuizId) {
              setNewTaskQuizId(validQuizzes[0].id);
              setNewTaskQuizTitle(validQuizzes[0].title);
              setNewTaskQuestionCount(validQuizzes[0].questionCount || 10);
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

  // Load persistent groups & tasks secara paralel dengan Promise.all
  useEffect(() => {
    let cancelled = false;
    const loadDashboardData = async () => {
      setIsLoadingDashboard(true);
      try {
        const queryParam = user?.id ? `?creator_id=${encodeURIComponent(user.id)}` : "";
        const [groupsData, loadedTasks] = await Promise.all([
          fetch(`/api/groups${queryParam}`)
            .then((r) => r.json())
            .catch(() => null),
          fetchTeacherTasks(user?.id).catch(() => [] as StudentTask[])
        ]);

        if (cancelled) return;

        if (groupsData?.success && Array.isArray(groupsData.groups)) {
          setGroups(groupsData.groups);
          if (groupsData.groups.length > 0) {
            setSelectedGroupId((prev) =>
              groupsData.groups.some((g: any) => g.id === prev) ? prev : groupsData.groups[0].id
            );
            setNewTaskGroupId((prev) =>
              prev && prev !== "all" && groupsData.groups.some((g: any) => g.id === prev)
                ? prev
                : groupsData.groups[0].id
            );
          }
        }
        setTasks(loadedTasks);
      } catch (err) {
        console.warn("Gagal memuat dashboard guru:", err);
      } finally {
        if (!cancelled) {
          setIsLoadingDashboard(false);
        }
      }
    };

    loadDashboardData();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Rombel aktif yang sedang dipilih oleh guru
  const activeGroup = groups.find((g) => g.id === selectedGroupId) ?? null;
  const groupStudents = activeGroup?.students ?? [];

  // Filter seluruh tugas rombel aktif untuk ringkasan penguasaan kuis
  const allGroupTasks = tasks
    .filter((t) => t.groupId === selectedGroupId || t.groupName === activeGroup?.name)
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const isTaskDeadlinePassed = (deadline: string): boolean => {
    const cleaned = deadline.replace(/\s*WIB$/i, "").trim();
    const parsed = parse(cleaned, "d MMM yyyy, HH:mm", new Date(), { locale: localeId });
    if (isValid(parsed)) {
      return parsed.getTime() < Date.now();
    }
    const fallback = new Date(cleaned);
    return !Number.isNaN(fallback.getTime()) && fallback.getTime() < Date.now();
  };

  const isTaskCompleted = (task: StudentTask): boolean => {
    const allStudentsDone = task.totalAssigned > 0 && task.completedCount >= task.totalAssigned;
    return allStudentsDone || isTaskDeadlinePassed(task.deadline);
  };

  const activeGroupTasks = allGroupTasks.filter((t) => !isTaskCompleted(t));
  const completedGroupTasks = allGroupTasks.filter((t) => isTaskCompleted(t));

  // Maks 5 tugas untuk masing-masing panel Tugas Aktif & Tugas Selesai
  const groupTasks = activeGroupTasks.slice(0, 5);
  const completedTasks = completedGroupTasks.slice(0, 5);

  // Metrik Diagnostik Ringkas
  const totalStudents = groupStudents.length;
  const activeStudentsCount = groupStudents.filter(
    (s) => s.lastActive.includes("menit") || s.lastActive.includes("jam")
  ).length;

  // Siswa yang sudah memiliki data performa (score > 0)
  const studentsWithData = groupStudents.filter(
    (s) => s.predictedExamScore > 0 || s.accuracyRate > 0
  );

  const averageClassScore =
    studentsWithData.length > 0
      ? Math.round(
        studentsWithData.reduce((acc, s) => acc + (s.predictedExamScore ?? s.accuracyRate), 0) /
        studentsWithData.length
      )
      : 0;

  // Siswa yang perlu intervensi / remedial (Cukup & Kurang, diurutkan dari nilai terendah, maks 5 siswa)
  const atRiskStudents = studentsWithData
    .filter(
      (s) =>
        s.readinessStatus === "Cukup" ||
        s.readinessStatus === "Kurang" ||
        s.unmasteredTopics.length > 0 ||
        (s.predictedExamScore ?? s.accuracyRate) < 75
    )
    .sort((a, b) => (a.predictedExamScore ?? a.accuracyRate) - (b.predictedExamScore ?? b.accuracyRate))
    .slice(0, 5);

  // Hitung distribusi status siswa berdasarkan yang sudah punya data
  const baikStudentsCount = studentsWithData.filter(
    (s) => (s.predictedExamScore ?? s.accuracyRate) >= 75
  ).length;

  const cukupStudentsCount = studentsWithData.filter((s) => {
    const score = s.predictedExamScore ?? s.accuracyRate;
    return score >= 65 && score < 75;
  }).length;

  const kurangStudentsCount = studentsWithData.filter(
    (s) => (s.predictedExamScore ?? s.accuracyRate) < 65
  ).length;

  // Siswa yang belum punya data performa sama sekali
  const noDataStudentsCount = groupStudents.length - studentsWithData.length;

  const statusDistributionData = [
    { key: "baik", name: "Baik", value: baikStudentsCount, color: "#10B981" },     // Hijau Emerald
    { key: "cukup", name: "Cukup", value: cukupStudentsCount, color: "#3B82F6" },   // Biru
    { key: "kurang", name: "Kurang", value: kurangStudentsCount, color: "#F43F5E" }, // Merah Rose
    ...(noDataStudentsCount > 0
      ? [{ key: "no_data", name: "Belum Ada Data", value: noDataStudentsCount, color: "#94A3B8" }] // Slate Abu-abu
      : [])
  ];

  const statusChartConfig = React.useMemo<ChartConfig>(() => {
    const config: ChartConfig = {};
    statusDistributionData.forEach((item) => {
      config[item.key] = {
        label: item.name,
        color: item.color
      };
    });
    return config;
  }, [baikStudentsCount, cukupStudentsCount, kurangStudentsCount, noDataStudentsCount]);

  const nonZeroStatusSlices = statusDistributionData.filter((item) => item.value > 0).length;

  // Penguasaan kuis dihitung dari hasil pengerjaan tugas pada rombel aktif
  const allTopics = allGroupTasks
    .filter((t) => t.averageScore > 0)
    .map((t) => {
      const mastery = t.averageScore;
      const status = mastery >= 75 ? "Baik" : mastery >= 65 ? "Cukup" : "Kurang";
      return {
        title: t.quizTitle || t.title,
        playsCount: t.completedCount,
        mastery,
        status,
        color: status === "Baik" ? "bg-emerald-500" : status === "Cukup" ? "bg-blue-500" : "bg-rose-500",
        textColor: status === "Baik" ? "text-emerald-700" : status === "Cukup" ? "text-blue-700" : "text-rose-700"
      };
    });

  // Pisahkan materi yang sudah dikuasai (Baik) dan belum dikuasai (Cukup / Kurang)
  // 1. Materi Sudah Dikuasai: Urutkan dari yang paling dikuasai (nilai tertinggi) maks 5
  const masteredTopics = allTopics
    .filter((t) => t.status === "Baik")
    .sort((a, b) => b.mastery - a.mastery)
    .slice(0, 5);

  // 2. Materi Belum Dikuasai: Urutkan dari yang paling belum dikuasai (nilai terendah) maks 5
  const unmasteredTopicsList = allTopics
    .filter((t) => t.status !== "Baik")
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 5);

  // Handler: Tambah Siswa via QR Scanner
  const handleStudentAdded = async (student: StudentProfile) => {
    if (!activeGroup) return;

    try {
      await fetch(`/api/groups/${activeGroup.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student.id })
      });
    } catch (err) {
      console.error("Gagal sinkronisasi siswa ke database:", err);
    }

    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === activeGroup.id) {
          if (g.students.some((s) => s.id === student.id)) return g;
          return {
            ...g,
            students: [...g.students, student]
          };
        }
        return g;
      })
    );
  };

  // Handler: Buat Tugas Baru Langsung dari Pop-up Dashboard
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
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

    const parsedTaskKkm = Number(newTaskPassingScore);
    if (
      newTaskPassingScore.trim() === "" ||
      Number.isNaN(parsedTaskKkm) ||
      parsedTaskKkm < 0 ||
      parsedTaskKkm > 100
    ) {
      toast.error("Nilai KKM wajib diisi (0 - 100).");
      return;
    }

    const targetGroups = newTaskGroupId === "all"
      ? groups
      : [groups.find((g) => g.id === newTaskGroupId) || activeGroup || groups[0]];

    const selectedQuiz = availableQuizzes.find((q) => q.id === newTaskQuizId);
    const quizTitle = selectedQuiz?.title || newTaskQuizTitle || "Kuis Pilihan";
    const gameName = newTaskGameId && newTaskGameId !== "none" ? newTaskGameId : undefined;
    const formattedDeadline = format(newTaskDeadline, "d MMM yyyy, HH:mm", { locale: localeId }) + " WIB";

    const payloads = targetGroups.map((group) => {
      const targetStudents = group.students || [];

      return {
        teacherId: user.id,
        groupId: group.id,
        groupName: group.name,
        title: newTaskTitle.trim(),
        quizId: newTaskQuizId || undefined,
        quizTitle,
        questionCount: newTaskQuestionCount,
        gameId: gameName,
        gameName,
        subject: group.subjects?.[0] || group.subject || "Matematika",
        type: newTaskType,
        targetCompetency: "",
        deadline: formattedDeadline,
        passingScore: parsedTaskKkm,
        studentIds: targetStudents.map((s) => s.id)
      };
    });

    try {
      const createdTasks = await createTeacherTasks(payloads);
      setTasks((prev) => [...createdTasks, ...prev]);
      setIsCreateTaskOpen(false);
      setNewTaskTitle("");
      if (newTaskGroupId === "all") {
        toast.success(`Tugas "${newTaskTitle}" berhasil dibuat untuk ${targetGroups.length} kelas!`);
      } else {
        toast.success(`Tugas "${newTaskTitle}" berhasil dibuat!`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Gagal menyimpan tugas ke database.");
    }
  };

  // Akses Cepat Menu Guru (Scan QR & Tambah Tugas langsung memicu pop-up)
  const quickActions: QuickActionItem[] = [
    {
      title: "Scan QR",
      description: "Pindai QR profil untuk tambah siswa ke kelas",
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
              <SelectTrigger className="h-9 w-fit min-w-[150px] max-w-full text-xs font-semibold rounded-xl bg-background border-orange-200 dark:border-zinc-800 shadow-2xs gap-2.5">
                <div className="flex items-center gap-2">
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
      {isLoadingDashboard ? (
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
            title="Total Siswa"
            value={totalStudents}
            icon="users"
          />

          <StatCard
            title="Rata-rata Nilai"
            value={totalStudents > 0 ? averageClassScore : "–"}
            icon="accuracy"
          />

          <StatCard
            title="Perlu Bimbingan"
            value={`${atRiskStudents.length} Siswa`}
            icon="alert"
          />

          <StatCard
            title="Tugas Aktif"
            value={activeGroupTasks.length}
            icon="trend"
          />
        </div>
      )}

      {/* 4. Row 2: Distribusi Status Siswa (Pie Chart) & Butuh Bimbingan */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Kolom Kiri: Pie Chart Distribusi Status Siswa */}
        <Card className="rounded-2xl border shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <PieChartIcon className="size-4 text-orange-600" />
                  Status Kemampuan Siswa
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              {totalStudents === 0 ? (
                <div className="py-10 text-center text-xs text-muted-foreground">
                  Belum ada data siswa.
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3">
                  {/* Donut Chart */}
                  <ChartContainer
                    config={statusChartConfig}
                    className="h-[190px] w-full max-w-[240px]"
                  >
                    <PieChart>
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            hideLabel
                            formatter={(value, name) => (
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-muted-foreground">{name}</span>
                                <span className="font-mono font-semibold tabular-nums">
                                  {value} Siswa
                                </span>
                              </div>
                            )}
                          />
                        }
                      />
                      <Pie
                        data={statusDistributionData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={78}
                        paddingAngle={nonZeroStatusSlices > 1 ? 1.5 : 0}
                        stroke={nonZeroStatusSlices > 1 ? "var(--card)" : "none"}
                        strokeWidth={2}
                      >
                        {statusDistributionData.map((entry) => (
                          <Cell key={entry.key} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>

                  {/* Legend Horizontal di Bawah Chart */}
                  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-1">
                    {statusDistributionData.map((entry) => (
                      <div key={entry.key} className="flex items-center gap-1.5 text-xs">
                        <span
                          className="size-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-muted-foreground font-medium">
                          {entry.name}{" "}
                          <span className="text-foreground/80">({entry.value})</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </div>

          <div className="px-4 pb-4 pt-1">
            <Link
              href="/dashboard/teacher/analytics"
              className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </Card>

        {/* Kolom Kanan: Siswa yang Membutuhkan Bimbingan (Selalu tampil, ringkas, maks 5) */}
        <Card className="rounded-2xl border-amber-200/90 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/15 shadow-sm flex flex-col justify-between overflow-hidden">
          <div>
            <CardHeader className="pb-3 border-b border-amber-200/60 dark:border-amber-900/40">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="size-4" />
                </div>
                <CardTitle className="text-base font-bold text-amber-950 dark:text-amber-200">
                  Butuh Bimbingan
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {atRiskStudents.length === 0 ? (
                <div className="py-12 px-4 text-center text-xs text-muted-foreground">
                  Belum ada siswa yang perlu bimbingan.
                </div>
              ) : (
                <div className="divide-y divide-amber-200/50 dark:divide-amber-900/30">
                  {atRiskStudents.map((std) => (
                    <div
                      key={std.id}
                      className="px-4 py-2.5 flex items-center justify-between gap-3 bg-background/60 hover:bg-background/90 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar className="size-8 border shrink-0">
                          <AvatarImage src={std.avatarUrl} alt={std.fullname} />
                          <AvatarFallback className="text-[11px] bg-orange-100 text-orange-700">
                            {std.fullname.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-xs text-foreground truncate">
                          {std.fullname}
                        </span>
                      </div>

                      <Link
                        href={`/dashboard/teacher/tasks?remedial=1&groupId=${encodeURIComponent(
                          selectedGroupId
                        )}&studentIds=${encodeURIComponent(std.id)}`}
                        className="shrink-0"
                      >
                        <Button
                          size="sm"
                          className="h-7 px-2.5 text-[11px] bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-2xs"
                        >
                          <span>Remedial</span>
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </div>

          <div className="px-4 pb-4 pt-2">
            <Link
              href="/dashboard/teacher/groups"
              className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </Card>
      </div>

      {/* 3. Akses Cepat Menu Guru (Interaktif) */}
      <div className="space-y-2.5">
        <QuickActionsGrid actions={quickActions} />
      </div>

      {/* 5. Row 3: Tugas Aktif & Tugas Selesai */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Kolom Kiri: Tugas Aktif */}
        <Card className="rounded-2xl border shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center gap-2">
                <CheckSquare className="size-4 text-orange-600" />
                <CardTitle className="text-base font-bold">Tugas Aktif</CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              {groupTasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Belum ada tugas aktif.
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
                          <Link
                            href={`/dashboard/teacher/tasks/${t.id}`}
                            className="text-xs font-semibold text-foreground hover:text-orange-600 line-clamp-1 block mt-0.5 transition-colors"
                          >
                            {t.title}
                          </Link>
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

          <div className="px-4 pb-4 pt-1">
            <Link
              href="/dashboard/teacher/tasks"
              className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </Card>

        {/* Kolom Kanan: Tugas Selesai */}
        <Card className="rounded-2xl border shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <CardTitle className="text-base font-bold">Tugas Selesai</CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              {completedTasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Belum ada tugas selesai.
                </div>
              ) : (
                completedTasks.map((t) => {
                  const allStudentsDone = t.totalAssigned > 0 && t.completedCount >= t.totalAssigned;
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
                          <Link
                            href={`/dashboard/teacher/tasks/${t.id}`}
                            className="text-xs font-semibold text-foreground hover:text-orange-600 line-clamp-1 block mt-0.5 transition-colors"
                          >
                            {t.title}
                          </Link>
                          <span className="text-[11px] text-muted-foreground block mt-0.5">
                            Batas: {t.deadline.replace("WIB", "")}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-2 py-0.5 shrink-0 font-semibold ${allStudentsDone
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                            : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                            }`}
                        >
                          {allStudentsDone
                            ? `Semua Siswa Selesai (${t.completedCount}/${t.totalAssigned})`
                            : `Belum Semua (${t.completedCount}/${t.totalAssigned} Siswa)`}
                        </Badge>
                      </div>

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

          <div className="px-4 pb-4 pt-1">
            <Link
              href="/dashboard/teacher/tasks"
              className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </Card>
      </div>

      {/* 6. Row 4: Penguasaan Kuis (Dipisah: Sudah Dikuasai vs Belum Dikuasai) */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Kolom Kiri: Kuis Sudah Dikuasai (Baik) */}
        <Card className="rounded-xl border shadow-xs border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10 min-h-[330px] h-full flex flex-col gap-0 py-0">
          <CardHeader className="py-2.5 px-3.5 border-b border-emerald-200/40 dark:border-emerald-900/30 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="size-3.5" />
                </div>
                <CardTitle className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                  Kuis Sudah Dikuasai
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2 px-3 pb-3 space-y-2 flex-1 flex flex-col justify-start">
            {masteredTopics.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-[11px] text-muted-foreground text-center">
                  Belum ada data
                </div>
              </div>
            ) : (
              masteredTopics.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-lg border bg-background/80 space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="font-semibold text-foreground text-xs truncate">{item.title}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200 font-bold shrink-0">
                      {item.mastery}% • Baik
                    </Badge>
                  </div>
                  <Progress value={item.mastery} className="h-1 rounded-full" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Kolom Kanan: Kuis Belum Dikuasai (Cukup & Kurang) */}
        <Card className="rounded-xl border shadow-xs border-amber-200/60 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10 min-h-[330px] h-full flex flex-col gap-0 py-0">
          <CardHeader className="py-2.5 px-3.5 border-b border-amber-200/40 dark:border-amber-900/30 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="size-3.5" />
                </div>
                <CardTitle className="text-xs font-bold text-amber-950 dark:text-amber-200">
                  Kuis Belum Dikuasai
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2 px-3 pb-3 space-y-2 flex-1 flex flex-col justify-start">
            {unmasteredTopicsList.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-[11px] text-muted-foreground text-center">
                  Belum ada data
                </div>
              </div>
            ) : (
              unmasteredTopicsList.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-lg border bg-background/80 space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="font-semibold text-foreground text-xs truncate">{item.title}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 font-bold shrink-0 ${item.status === "Cukup"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                    >
                      {item.mastery}% • {item.status}
                    </Badge>
                  </div>
                  <Progress value={item.mastery} className="h-1 rounded-full" />
                </div>
              ))
            )}
          </CardContent>
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
              Buat Tugas
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateTask} className="space-y-3.5 pt-2">
            <div className="space-y-2">
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
              <div className="space-y-2">
                <Label className="text-xs">Kelas Sasaran</Label>
                <Select value={newTaskGroupId} onValueChange={setNewTaskGroupId}>
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
                <Select value={newTaskType} onValueChange={(v: any) => setNewTaskType(v)}>
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
                value={newTaskQuizId}
                onValueChange={(val) => {
                  setNewTaskQuizId(val);
                  const selected = availableQuizzes.find((q) => q.id === val);
                  if (selected) {
                    setNewTaskQuizTitle(selected.title);
                    if (selected.questionCount) {
                      setNewTaskQuestionCount(selected.questionCount);
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
                Jumlah Soal{" "}
                {(() => {
                  const selected = availableQuizzes.find((q) => q.id === newTaskQuizId);
                  return selected?.questionCount ? (
                    <span className="text-muted-foreground font-normal">(Maks: {selected.questionCount})</span>
                  ) : null;
                })()}
              </Label>
              {(() => {
                const maxQ = availableQuizzes.find((q) => q.id === newTaskQuizId)?.questionCount || 0;
                const options: number[] = [];
                if (maxQ >= 5) options.push(5);
                for (let i = 10; i < maxQ; i += 10) {
                  options.push(i);
                }
                if (maxQ > 0 && !options.includes(maxQ)) options.push(maxQ);
                return (
                  <Select
                    value={String(newTaskQuestionCount)}
                    onValueChange={(v) => setNewTaskQuestionCount(parseInt(v) || 1)}
                  >
                    <SelectTrigger className="h-8 text-xs rounded-xl">
                      <SelectValue placeholder="Pilih jumlah soal" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.length > 0 ? options.map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} Soal
                        </SelectItem>
                      )) : (
                        <SelectItem value={String(newTaskQuestionCount)}>
                          {newTaskQuestionCount} Soal
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
                      {format(newTaskDeadline, "d MMM yyyy, HH:mm", { locale: localeId })} WIB
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start" side="top" sideOffset={6}>
                    <div className="flex sm:flex-row flex-col divide-y sm:divide-y-0 sm:divide-x">
                      {/* Kalender */}
                      <Calendar
                        mode="single"
                        selected={newTaskDeadline}
                        onSelect={(date) => {
                          if (date) {
                            const updated = new Date(date);
                            updated.setHours(newTaskDeadline.getHours(), newTaskDeadline.getMinutes(), 0, 0);
                            setNewTaskDeadline(updated);
                          }
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />

                      {/* 24-Hour Circular Clock Face Picker */}
                      <div className="flex flex-col p-2">
                        <ClockFacePicker
                          value={newTaskDeadline}
                          onChange={(date) => setNewTaskDeadline(date)}
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
                  value={newTaskPassingScore}
                  onChange={(e) => setNewTaskPassingScore(e.target.value)}
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
    </div>
  );
}
