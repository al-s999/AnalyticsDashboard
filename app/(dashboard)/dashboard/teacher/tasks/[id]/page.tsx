"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Users,
  Award,
  TrendingUp,
  AlertTriangle,
  Search,
  Send,
  Sparkles,
  Loader2,
  BookOpen,
  Play,
  Copy,
  Check,
  ExternalLink,
  Radio,
  Power,
  MoreVertical,
  Edit,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
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
import { StudentTask } from "@/data/students-data";
import { getSubmissionStatusLabel, getTaskStatusCategory } from "@/lib/tasks/utils";
import { deleteTeacherTask, endTaskSession, startTaskSession, updateTeacherTask, createTeacherTasks } from "@/lib/tasks/client";
import { Combobox } from "@/components/ui/combobox";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import { CreateRoomDialog, type CreateRoomSelection } from "@/components/tasks/create-room-dialog";
import { useAnalyticsAuth } from "@/contexts/analytics-auth-context";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type SubmissionStatusFilter = "all" | "belum_mulai" | "sedang_mengerjakan" | "selesai";
type SubmissionScoreFilter = "all" | "baik" | "cukup" | "kurang";

export default function TaskDetailPage() {
  const { user } = useAnalyticsAuth();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const taskId = params?.id;

  const [task, setTask] = useState<StudentTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [isEndConfirmOpen, setIsEndConfirmOpen] = useState(false);
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [remindingStudentId, setRemindingStudentId] = useState<string | null>(null);
  const [copiedPin, setCopiedPin] = useState(false);
  const [hideFinishedBanner, setHideFinishedBanner] = useState(true);

  // State Edit & Delete Tugas
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editPassingScore, setEditPassingScore] = useState("75");
  const [editType, setEditType] = useState<"reguler" | "prescriptive_remedial">("reguler");
  const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeletingTask, setIsDeletingTask] = useState(false);

  // State Buat Remedial (inline modal di detail tugas)
  const [isRemedialOpen, setIsRemedialOpen] = useState(false);
  const [isCreatingRemedial, setIsCreatingRemedial] = useState(false);
  const [remedialTitle, setRemedialTitle] = useState("");
  const [remedialQuizId, setRemedialQuizId] = useState("");
  const [remedialQuizTitle, setRemedialQuizTitle] = useState("");
  const [remedialQuestionCount, setRemedialQuestionCount] = useState<number>(10);
  const [remedialDeadline, setRemedialDeadline] = useState("");
  const [remedialPassingScore, setRemedialPassingScore] = useState<string>("75");
  const [availableQuizzes, setAvailableQuizzes] = useState<
    { id: string; title: string; questionCount: number; isPublic?: boolean; creatorId?: string }[]
  >([]);
  const [statusFilter, setStatusFilter] = useState<SubmissionStatusFilter>("all");
  const [scoreFilter, setScoreFilter] = useState<SubmissionScoreFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const loadTaskDetail = useCallback(
    async (silent = false) => {
      if (!taskId) return;
      if (!silent) setIsLoading(true);
      try {
        const res = await fetch(`/api/tasks/${encodeURIComponent(taskId)}`, {
          cache: "no-store"
        });
        const data = await res.json();
        if (data.success && data.task) {
          setTask(data.task);
        }
      } catch (err) {
        console.error("Gagal memuat detail tugas:", err);
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [taskId]
  );

  useEffect(() => {
    void loadTaskDetail(false);
  }, [loadTaskDetail]);

  useEffect(() => {
    if (!task?.sessionId) return;
    if (task.sessionStatus && task.sessionStatus !== "finished") {
      setHideFinishedBanner(false);
      return;
    }

    const handleHideOnLeave = () => {
      if (document.visibilityState === "hidden") {
        setHideFinishedBanner(true);
      }
    };
    const handleBlur = () => setHideFinishedBanner(true);

    document.addEventListener("visibilitychange", handleHideOnLeave);
    window.addEventListener("blur", handleBlur);
    return () => {
      document.removeEventListener("visibilitychange", handleHideOnLeave);
      window.removeEventListener("blur", handleBlur);
    };
  }, [task?.sessionId, task?.sessionStatus]);

  // Realtime subscription: langsung perbarui data saat ada perubahan di game_sessions, task_submissions, atau teacher_tasks
  useEffect(() => {
    if (!taskId || !supabase) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const triggerRefresh = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        void loadTaskDetail(true);
      }, 250);
    };

    const channel = supabase.channel(`task-detail-rt:${taskId}`);

    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "task_submissions",
          filter: `task_id=eq.${taskId}`
        },
        triggerRefresh
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "teacher_tasks",
          filter: `id=eq.${taskId}`
        },
        triggerRefresh
      );

    if (task?.sessionId) {
      channel.on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_sessions",
          filter: `id=eq.${task.sessionId}`
        },
        triggerRefresh
      );
    }

    channel.subscribe();

    const handleVisibilityRefresh = () => {
      if (document.visibilityState === "visible") {
        triggerRefresh();
      }
    };

    window.addEventListener("focus", handleVisibilityRefresh);
    document.addEventListener("visibilitychange", handleVisibilityRefresh);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener("focus", handleVisibilityRefresh);
      document.removeEventListener("visibilitychange", handleVisibilityRefresh);
      void supabase?.removeChannel(channel);
    };
  }, [taskId, task?.sessionId, loadTaskDetail]);

  const stats = useMemo(() => {
    if (!task) {
      return {
        avgScore: 0,
        highestScore: 0,
        lowestScore: 0,
        passedCount: 0,
        belowKkmIds: [] as string[],
        notStartedCount: 0,
        inProgressCount: 0,
        completedCount: 0
      };
    }

    const subs = task.submissions || [];
    const completedWithScore = subs.filter(
      (s) => s.status === "selesai" && typeof s.score === "number"
    );
    const scores = completedWithScore.map((s) => s.score as number);
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
    const avgScore =
      scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    const passedCount = completedWithScore.filter((s) => (s.score as number) >= task.passingScore).length;
    const belowKkmIds = completedWithScore
      .filter((s) => (s.score as number) < task.passingScore)
      .map((s) => s.studentId);

    const notStartedCount = subs.filter((s) => s.status === "belum_mulai").length;
    const inProgressCount = subs.filter((s) => s.status === "sedang_mengerjakan").length;
    const completedCount = subs.filter((s) => s.status === "selesai").length;

    return {
      avgScore,
      highestScore,
      lowestScore,
      passedCount,
      belowKkmIds,
      notStartedCount,
      inProgressCount,
      completedCount
    };
  }, [task]);

  const filteredSubmissions = useMemo(() => {
    if (!task) return [];
    const q = searchQuery.trim().toLowerCase();
    return (task.submissions || [])
      .filter((sub) => {
        if (statusFilter !== "all" && sub.status !== statusFilter) return false;

        if (scoreFilter !== "all") {
          if (sub.status !== "selesai" || typeof sub.score !== "number") return false;
          const goodThreshold = Math.max(85, task.passingScore);
          if (scoreFilter === "baik" && sub.score < goodThreshold) return false;
          if (
            scoreFilter === "cukup" &&
            (sub.score < task.passingScore || sub.score >= goodThreshold)
          ) {
            return false;
          }
          if (scoreFilter === "kurang" && sub.score >= task.passingScore) return false;
        }

        return true;
      })
      .filter(
        (sub) =>
          !q ||
          sub.studentName.toLowerCase().includes(q) ||
          sub.studentUsername.toLowerCase().includes(q)
      );
  }, [task, statusFilter, scoreFilter, searchQuery]);

  const handleOpenStudentDetail = (studentId: string) => {
    router.push(`/dashboard/teacher/students/${encodeURIComponent(studentId)}`);
  };

  const handleStartSession = async (selection?: CreateRoomSelection) => {
    if (!task) return;
    setIsStartingSession(true);
    const hostWindow = typeof window !== "undefined" ? window.open("about:blank", "_blank") : null;

    try {
      const result = await startTaskSession(task.id, {
        hostId: user?.id,
        gameId: selection?.gameId,
        gameName: selection?.gameName,
        durationMinutes: selection?.durationMinutes,
        questionLimit: selection?.questionLimit,
        difficulty: selection?.difficulty,
        gameEndMode: selection?.gameEndMode,
        allowJoinAfterStart: selection?.allowJoinAfterStart
      });

      if (result.task) {
        setTask(result.task);
      } else {
        setTask((prev) =>
          prev
            ? {
              ...prev,
              executionMode: "live_room",
              sessionId: result.sessionId,
              gamePin: result.gamePin,
              sessionStatus: "waiting"
            }
            : prev
        );
      }

      setIsCreateRoomOpen(false);

      if (hostWindow) {
        hostWindow.location.href = result.redirectUrl;
      } else if (typeof window !== "undefined") {
        window.open(result.redirectUrl, "_blank");
      }

      toast.success(
        result.reused
          ? `Room dibuka kembali (PIN: ${result.gamePin})`
          : `Sesi room berhasil dibuat! PIN: ${result.gamePin}`
      );
    } catch (err: any) {
      if (hostWindow) hostWindow.close();
      toast.error(err?.message || "Gagal membuat sesi room.");
    } finally {
      setIsStartingSession(false);
    }
  };

  const buildJoinRoomUrl = (pin: string) => {
    const envDomain = (process.env.NEXT_PUBLIC_COOKIE_DOMAIN || "")
      .trim()
      .replace(/^\.+/, "");
    const domain = envDomain || "gameforsmart.com";
    const appBaseUrl = (
      process.env.NEXT_PUBLIC_AUTH_BASE_URL || `https://app.${domain}`
    ).replace(/\/+$/, "");

    const rawGame = (task?.gameId || task?.gameName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const miniGames = ["nitroquiz", "crazyrace", "spacequiz", "memoryquiz", "quizrush", "axiom", "zigma"];
    const matchedMiniGame = miniGames.find((g) => rawGame.includes(g));

    if (matchedMiniGame) {
      return `https://${matchedMiniGame}.${domain}/join/${pin}`;
    }
    return `${appBaseUrl}/join/${pin}`;
  };

  const handleCopyPin = async (pin: string) => {
    try {
      const joinUrl = buildJoinRoomUrl(pin);
      await navigator.clipboard.writeText(joinUrl);
      setCopiedPin(true);
      toast.success(`Link room disalin: ${joinUrl}`);
      setTimeout(() => setCopiedPin(false), 2000);
    } catch {
      toast.error("Gagal menyalin link room");
    }
  };

  const handleSendReminder = async (
    targetStudentIds: string[],
    targetLabel?: string,
    singleStudentId?: string
  ) => {
    if (!task || targetStudentIds.length === 0) return;

    if (singleStudentId) {
      setRemindingStudentId(singleStudentId);
    } else {
      setIsSendingReminder(true);
    }

    try {
      const res = await fetch("/api/notifications/remind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorId: user?.id,
          studentIds: targetStudentIds,
          taskId: task.id,
          groupId: task.groupId
        })
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        toast.error(data?.error || "Gagal mengirim pengingat tugas.");
        return;
      }

      if (targetLabel) {
        toast.success(`Pengingat dikirim ke ${targetLabel}`);
      } else {
        toast.success(
          `Pengingat dikirim ke ${data.sentCount ?? targetStudentIds.length} siswa yang belum mengerjakan.`
        );
      }
    } catch {
      toast.error("Terjadi kesalahan saat mengirim pengingat.");
    } finally {
      setIsSendingReminder(false);
      setRemindingStudentId(null);
    }
  };

  const handleEndSession = async () => {
    if (!task) return;
    setIsEndingSession(true);
    try {
      const updatedTask = await endTaskSession(task.id);
      if (updatedTask) {
        setTask(updatedTask);
      } else {
        setTask((prev) =>
          prev
            ? {
              ...prev,
              sessionId: undefined,
              gamePin: undefined,
              sessionStatus: undefined
            }
            : prev
        );
      }
      setIsEndConfirmOpen(false);
      toast.info("Room sesi telah ditutup.");
    } catch (err: any) {
      toast.error(err?.message || "Gagal menutup room sesi.");
    } finally {
      setIsEndingSession(false);
    }
  };

  const handleOpenEdit = () => {
    if (!task) return;
    setEditTitle(task.title);
    setEditDeadline(task.deadline);
    setEditPassingScore(String(task.passingScore));
    setEditType(task.type);
    setIsEditOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      toast.error("Judul tugas wajib diisi.");
      return;
    }
    const parsedKkm = Number(editPassingScore);
    if (editPassingScore.trim() === "" || Number.isNaN(parsedKkm) || parsedKkm < 0 || parsedKkm > 100) {
      toast.error("Nilai KKM wajib diisi (0 - 100).");
      return;
    }
    setIsEditConfirmOpen(true);
  };

  const handleConfirmSaveEdit = async () => {
    if (!task) return;
    setIsSavingEdit(true);
    try {
      const updatedTask = await updateTeacherTask(task.id, {
        title: editTitle.trim(),
        deadline: editDeadline,
        passingScore: Number(editPassingScore),
        type: editType
      });
      setTask(updatedTask);
      setIsEditConfirmOpen(false);
      setIsEditOpen(false);
      toast.success("Tugas berhasil diperbarui.");
    } catch (err: any) {
      toast.error(err?.message || "Gagal memperbarui tugas.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDeleteTask = async () => {
    if (!task) return;
    setIsDeletingTask(true);
    try {
      await deleteTeacherTask(task.id);
      toast.success("Tugas berhasil dihapus.");
      setIsDeleteConfirmOpen(false);
      router.push("/dashboard/teacher/tasks");
    } catch (err: any) {
      toast.error(err?.message || "Gagal menghapus tugas.");
    } finally {
      setIsDeletingTask(false);
    }
  };

  const handleOpenRemedial = async () => {
    if (!task) return;
    setRemedialTitle(`Remedial: ${task.title}`);
    setRemedialQuizId(task.quizId || "");
    setRemedialQuizTitle(task.quizTitle || "");
    setRemedialQuestionCount(task.questionCount || 10);
    setRemedialDeadline(task.deadline || "");
    setRemedialPassingScore(String(task.passingScore || 75));
    setIsRemedialOpen(true);

    if (availableQuizzes.length === 0) {
      try {
        const res = await fetch(
          `/api/quizzes-and-games${user?.id ? `?creator_id=${encodeURIComponent(user.id)}` : ""}`
        );
        const data = await res.json();
        if (data?.success && Array.isArray(data.quizzes)) {
          setAvailableQuizzes(data.quizzes);
        }
      } catch {
        // ignore quiz fetch failure; fallback to current task quiz
      }
    }
  };

  const handleCreateRemedial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    if (!remedialTitle.trim()) {
      toast.error("Judul tugas remedial wajib diisi.");
      return;
    }
    if (!user?.id) {
      toast.error("Sesi guru tidak ditemukan. Silakan login ulang.");
      return;
    }
    const parsedKkm = Number(remedialPassingScore);
    if (
      remedialPassingScore.trim() === "" ||
      Number.isNaN(parsedKkm) ||
      parsedKkm < 0 ||
      parsedKkm > 100
    ) {
      toast.error("Nilai KKM wajib diisi (0 - 100).");
      return;
    }

    setIsCreatingRemedial(true);
    try {
      const selectedQuiz = availableQuizzes.find((q) => q.id === remedialQuizId);
      const createdTasks = await createTeacherTasks([
        {
          teacherId: user.id,
          groupId: task.groupId,
          groupName: task.groupName,
          title: remedialTitle.trim(),
          quizId: remedialQuizId || undefined,
          quizTitle: selectedQuiz?.title || remedialQuizTitle || task.quizTitle || "Kuis Pilihan",
          questionCount: remedialQuestionCount,
          subject: task.subject,
          type: "prescriptive_remedial",
          targetScope: "remedial_only",
          targetCompetency: task.targetCompetency || "",
          deadline: remedialDeadline || task.deadline,
          passingScore: parsedKkm,
          studentIds: stats.belowKkmIds
        }
      ]);

      setIsRemedialOpen(false);
      toast.success(`Tugas remedial "${remedialTitle.trim()}" berhasil dibuat!`);
      if (createdTasks[0]?.id) {
        router.push(`/dashboard/teacher/tasks/${encodeURIComponent(createdTasks[0].id)}`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Gagal membuat tugas remedial.");
    } finally {
      setIsCreatingRemedial(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="rounded-2xl border p-4 space-y-2.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-7 w-16" />
            </Card>
          ))}
        </div>
        <Card className="rounded-2xl border p-5 space-y-3">
          <Skeleton className="h-5 w-48" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-xl" />
          ))}
        </Card>
      </div>
    );
  }

  if (!task) {
    return (
      <Card className="rounded-2xl border p-12 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
        <h2 className="text-base font-bold">Tugas Tidak Ditemukan</h2>
        <p className="text-xs text-muted-foreground">
          Tugas mungkin telah dihapus atau ID tugas tidak valid.
        </p>
        <Link href="/dashboard/teacher/tasks">
          <Button size="sm" variant="outline" className="rounded-xl text-xs">
            Kembali
          </Button>
        </Link>
      </Card>
    );
  }

  const total = Math.max(1, task.submissions?.length || task.totalAssigned || 1);
  const pctDone = Math.round((stats.completedCount / total) * 100);
  const pctProgress = Math.round((stats.inProgressCount / total) * 100);
  const pctNotStarted = Math.max(0, 100 - pctDone - pctProgress);
  const statusCategory = getTaskStatusCategory(task);
  const showSessionBanner = Boolean(
    task.sessionId &&
      task.gamePin &&
      (task.sessionStatus !== "finished" || !hideFinishedBanner)
  );

  const remedialUrl = `/dashboard/teacher/tasks?remedial=1&groupId=${encodeURIComponent(
    task.groupId
  )}&studentIds=${encodeURIComponent(stats.belowKkmIds.join(","))}&title=${encodeURIComponent(
    `Remedial: ${task.title}`
  )}`;

  return (
    <div className="space-y-6">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="space-y-1.5">
          <Link
            href="/dashboard/teacher/tasks"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali</span>
          </Link>

          <h1 className="text-2xl font-bold tracking-tight">{task.title}</h1>

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={`text-[10px] font-semibold px-2 py-0.5 border-transparent ${task.type === "prescriptive_remedial"
                ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
                : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                }`}
            >
              {task.type === "prescriptive_remedial" ? "Remedial" : "Tugas"}
            </Badge>
            <Badge
              variant="outline"
              className={`text-[10px] px-2 py-0.5 ${statusCategory === "selesai"
                ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-700 border-amber-500/20"
                }`}
            >
              {statusCategory === "selesai" ? "Selesai" : "Aktif"}
            </Badge>
            <Badge variant="outline" className="text-[10px] font-semibold">
              KKM: {task.passingScore}
            </Badge>
            {showSessionBanner && (
              <Badge
                variant="outline"
                className="text-[10px] font-mono font-bold px-2 py-0.5 bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20"
              >
                PIN: {task.gamePin}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-orange-500" />
              {task.groupName}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-blue-500" />
              {task.quizTitle || task.subject}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-orange-500" />
              Batas: {task.deadline}
            </span>
          </div>
        </div>

        {/* Tombol Aksi Tindak Lanjut */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            size="sm"
            disabled={isStartingSession || Boolean(task.sessionId && task.sessionStatus !== "finished")}
            onClick={() => setIsCreateRoomOpen(true)}
            className="h-9 rounded-xl text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs disabled:opacity-50"
          >
            {isStartingSession ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>
              {isStartingSession
                ? "Menyiapkan Room..."
                : "Buat Room"}
            </span>
          </Button>

          {stats.notStartedCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              disabled={isSendingReminder}
              className="h-9 rounded-xl text-xs gap-1.5"
              onClick={() => {
                const targetIds = (task.submissions || [])
                  .filter((s) => s.status === "belum_mulai")
                  .map((s) => s.studentId);
                void handleSendReminder(targetIds);
              }}
            >
              {isSendingReminder ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-600" />
              ) : (
                <Send className="w-3.5 h-3.5 text-orange-600" />
              )}
              <span>{isSendingReminder ? "Mengirim..." : "Ingatkan Belum Mulai"}</span>
            </Button>
          )}

          {stats.belowKkmIds.length > 0 && (
            <Button
              size="sm"
              onClick={handleOpenRemedial}
              className="h-9 rounded-xl text-xs gap-1.5 bg-orange-600 hover:bg-orange-700 text-white"
            >
              <span>Buat Remedial</span>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                className="h-9 w-9 rounded-xl"
                aria-label="Opsi Tugas"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 rounded-xl">
              <DropdownMenuItem
                onClick={handleOpenEdit}
                className="cursor-pointer flex items-center gap-2 text-xs"
              >
                <Edit className="w-3.5 h-3.5 text-amber-600" />
                <span>Edit Tugas</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="cursor-pointer flex items-center gap-2 text-xs text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Tugas</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Banner Room Sesi Guru (Ringkas) */}
      {showSessionBanner && (
        <Card className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 shadow-xs">
          <CardContent className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">
                  {task.gameName || "App GameForSmart"}
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] px-2 py-0 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                >
                  {task.sessionStatus === "active"
                    ? "Berlangsung"
                    : task.sessionStatus === "finished"
                      ? "Selesai"
                      : "Menunggu Siswa"}
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border bg-background">
                <span className="text-[11px] text-muted-foreground">PIN:</span>
                <span className="text-xs font-mono font-black tracking-wider text-foreground">
                  {task.gamePin}
                </span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => handleCopyPin(task.gamePin!)}
                  className="h-5 w-5 rounded-md text-muted-foreground hover:text-foreground"
                  title="Salin Link Room"
                >
                  {copiedPin ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isStartingSession || isEndingSession}
                onClick={() => handleStartSession()}
                className="h-8 px-3 rounded-xl text-xs gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                <span>Masuk Room</span>
              </Button>

              <Button
                type="button"
                size="sm"
                disabled={isEndingSession}
                onClick={() => setIsEndConfirmOpen(true)}
                className="h-8 px-3 rounded-xl text-xs gap-1.5 bg-red-600 hover:bg-red-700 text-white"
              >
                <Power className="w-3.5 h-3.5" />
                <span>Tutup Room</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Bar 3 Segmen */}
      <Card className="rounded-2xl border shadow-xs">
        <CardContent className="p-4 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-foreground">Distribusi Pengerjaan Siswa</span>
            <div className="flex flex-wrap items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Selesai: <strong>{stats.completedCount}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                Sedang Mengerjakan: <strong>{stats.inProgressCount}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-zinc-700 inline-block" />
                Belum: <strong>{stats.notStartedCount}</strong>
              </span>
            </div>
          </div>

          <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden flex">
            {pctDone > 0 && (
              <div className="bg-emerald-500 h-full transition-all" style={{ width: `${pctDone}%` }} />
            )}
            {pctProgress > 0 && (
              <div className="bg-blue-500 h-full transition-all" style={{ width: `${pctProgress}%` }} />
            )}
            {pctNotStarted > 0 && (
              <div className="bg-transparent h-full" style={{ width: `${pctNotStarted}%` }} />
            )}
          </div>
        </CardContent>
      </Card>

      {/* 4 Kartu Statistik Nilai */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Rata-rata Nilai</span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-foreground">
              {stats.avgScore > 0 ? stats.avgScore : "-"}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Nilai Tertinggi</span>
              <Award className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-600">
              {stats.highestScore > 0 ? stats.highestScore : "-"}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Nilai Terendah</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-rose-600">
              {stats.lowestScore > 0 ? stats.lowestScore : "-"}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Lulus</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-foreground">
              {stats.passedCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabel Daftar Siswa (Submissions) */}
      <Card className="rounded-2xl border shadow-sm overflow-hidden gap-0 py-0">
        <CardHeader className="px-4 py-3 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-600" />
            <CardTitle className="text-base font-bold">Daftar Pengerjaan Siswa</CardTitle>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as SubmissionStatusFilter)}
            >
              <SelectTrigger className="w-40 h-9 text-xs rounded-xl">
                <SelectValue placeholder="Status Siswa" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="text-xs">
                  Semua Status
                </SelectItem>
                <SelectItem value="belum_mulai" className="text-xs">
                  Belum Mulai
                </SelectItem>
                <SelectItem value="sedang_mengerjakan" className="text-xs">
                  Sedang Mengerjakan
                </SelectItem>
                <SelectItem value="selesai" className="text-xs">
                  Selesai
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={scoreFilter}
              onValueChange={(v) => setScoreFilter(v as SubmissionScoreFilter)}
            >
              <SelectTrigger className="w-40 h-9 text-xs rounded-xl">
                <SelectValue placeholder="Kategori Nilai" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="text-xs">
                  Semua Nilai
                </SelectItem>
                <SelectItem value="baik" className="text-xs text-emerald-600">
                  Baik
                </SelectItem>
                <SelectItem value="cukup" className="text-xs text-blue-600">
                  Cukup
                </SelectItem>
                <SelectItem value="kurang" className="text-xs text-rose-600">
                  Kurang
                </SelectItem>
              </SelectContent>
            </Select>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Cari nama siswa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs rounded-xl"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredSubmissions.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              Tidak ada siswa pada kategori ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-xs font-semibold py-2 pl-5">Siswa</TableHead>
                    <TableHead className="text-xs font-semibold py-2">Status</TableHead>
                    <TableHead className="text-xs font-semibold py-2">Nilai</TableHead>
                    <TableHead className="text-xs font-semibold py-2">Durasi</TableHead>
                    <TableHead className="text-xs font-semibold py-2">Waktu Kumpul</TableHead>
                    <TableHead className="text-xs font-semibold py-2 text-right pr-5">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((sub) => {
                    const hasScore = sub.status === "selesai" && typeof sub.score === "number";
                    const isPassed = hasScore && (sub.score as number) >= task.passingScore;

                    return (
                      <TableRow
                        key={sub.studentId}
                        className="hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => handleOpenStudentDetail(sub.studentId)}
                      >
                        <TableCell className="pl-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="size-8 border">
                              <AvatarImage src={sub.avatarUrl} alt={sub.studentName} />
                              <AvatarFallback className="text-[10px] bg-orange-100 text-orange-700">
                                {sub.studentName.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-xs font-semibold text-foreground">
                                {sub.studentName}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                @{sub.studentUsername}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="py-3">
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-2 py-0 ${sub.status === "selesai"
                              ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                              : sub.status === "sedang_mengerjakan"
                                ? "bg-blue-500/10 text-blue-700 border-blue-500/20"
                                : "bg-muted text-muted-foreground"
                              }`}
                          >
                            {getSubmissionStatusLabel(sub.status)}
                          </Badge>
                        </TableCell>

                        <TableCell className="py-3 text-xs font-bold">
                          {hasScore ? (
                            <span className={isPassed ? "text-emerald-600" : "text-rose-600"}>
                              {sub.score}
                            </span>
                          ) : (
                            <span className="text-muted-foreground font-normal">-</span>
                          )}
                        </TableCell>

                        <TableCell className="py-3 text-xs text-muted-foreground">
                          {sub.timeSpentMinutes ? `${sub.timeSpentMinutes} menit` : "-"}
                        </TableCell>

                        <TableCell className="py-3 text-xs text-muted-foreground">
                          {sub.submittedAt || "-"}
                        </TableCell>

                        <TableCell className="py-3 pr-5 text-right" onClick={(e) => e.stopPropagation()}>
                          {sub.status === "belum_mulai" ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={remindingStudentId === sub.studentId}
                              className="h-7 px-2 text-[11px] text-orange-600 hover:text-orange-700"
                              onClick={() =>
                                void handleSendReminder([sub.studentId], sub.studentName, sub.studentId)
                              }
                            >
                              {remindingStudentId === sub.studentId ? "Mengirim..." : "Ingatkan"}
                            </Button>
                          ) : (
                            <Link href={`/dashboard/teacher/students/${encodeURIComponent(sub.studentId)}`}>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-[11px]"
                              >
                                Detail Siswa
                              </Button>
                            </Link>
                          )}
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

      <CreateRoomDialog
        open={isCreateRoomOpen}
        onOpenChange={setIsCreateRoomOpen}
        defaultGameId={task.gameId}
        isSubmitting={isStartingSession}
        onConfirm={handleStartSession}
      />

      {/* Dialog Edit Tugas */}
      <Dialog open={isEditOpen} onOpenChange={(open) => !isSavingEdit && setIsEditOpen(open)}>
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
                  value={task.groupName}
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
                onClick={() => setIsEditOpen(false)}
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
      </Dialog>

      {/* Konfirmasi Simpan Perubahan Edit Tugas */}
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

      {/* Konfirmasi Hapus Tugas */}
      <ConfirmActionDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        variant="destructive"
        isLoading={isDeletingTask}
        title="Hapus Tugas?"
        description={`Hapus tugas "${task.title}" secara permanen?`}
        confirmLabel="Iya"
        cancelLabel="Batal"
        onConfirm={handleConfirmDeleteTask}
      />

      {/* Dialog Buat Remedial (tetap di halaman detail, lalu redirect ke detail remedial setelah simpan) */}
      <Dialog open={isRemedialOpen} onOpenChange={(open) => !isCreatingRemedial && setIsRemedialOpen(open)}>
        <DialogContent className="sm:max-w-[480px] p-5 rounded-2xl">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-600" />
              Buat Tugas Remedial
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateRemedial} className="space-y-3.5 pt-2">
            <div className="space-y-2">
              <Label className="text-xs">Judul Tugas Remedial</Label>
              <Input
                value={remedialTitle}
                onChange={(e) => setRemedialTitle(e.target.value)}
                required
                className="h-8 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-2">
                <Label className="text-xs">Kelas Sasaran</Label>
                <Input
                  value={task.groupName}
                  disabled
                  className="h-8 text-xs rounded-xl bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Siswa Remedial</Label>
                <Input
                  value={String(stats.belowKkmIds.length)}
                  readOnly
                  disabled
                  className="h-8 text-xs rounded-xl bg-muted cursor-not-allowed"
                />
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
                  { id: "my", label: "My Quiz", icon: <Edit className="h-3 w-3" /> }
                ]}
                options={availableQuizzes
                  .filter((q) => q.isPublic || (user?.id && q.creatorId === user?.id))
                  .map((q) => ({
                    value: q.id,
                    label: q.title,
                    group: user?.id && q.creatorId === user?.id ? "my" : "public"
                  }))}
                value={remedialQuizId}
                onValueChange={(val) => {
                  setRemedialQuizId(val);
                  const selected = availableQuizzes.find((q) => q.id === val);
                  if (selected) {
                    setRemedialQuizTitle(selected.title);
                    if (selected.questionCount) {
                      setRemedialQuestionCount(selected.questionCount);
                    }
                  }
                }}
                placeholder={remedialQuizTitle || "Pilih kuis soal..."}
                searchPlaceholder="Cari kuis soal..."
                emptyText="Tidak ada kuis ditemukan."
                className="w-full h-8 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="space-y-2">
                <Label className="text-xs">Jumlah Soal</Label>
                {(() => {
                  const maxQ = availableQuizzes.find((q) => q.id === remedialQuizId)?.questionCount || 0;
                  const options: number[] = [];
                  if (maxQ >= 5) options.push(5);
                  for (let i = 10; i < maxQ; i += 10) options.push(i);
                  if (maxQ > 0 && !options.includes(maxQ)) options.push(maxQ);
                  return (
                    <Select
                      value={String(remedialQuestionCount)}
                      onValueChange={(v) => setRemedialQuestionCount(parseInt(v, 10) || 1)}
                    >
                      <SelectTrigger className="h-8 text-xs rounded-xl w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {options.length > 0 ? (
                          options.map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {n} Soal
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value={String(remedialQuestionCount)}>
                            {remedialQuestionCount} Soal
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  );
                })()}
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Batas Waktu</Label>
                <Input
                  value={remedialDeadline}
                  onChange={(e) => setRemedialDeadline(e.target.value)}
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
                  value={remedialPassingScore}
                  onChange={(e) => setRemedialPassingScore(e.target.value)}
                  className="h-8 text-xs rounded-xl [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isCreatingRemedial}
                onClick={() => setIsRemedialOpen(false)}
                className="rounded-xl text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isCreatingRemedial}
                className="rounded-xl text-xs bg-orange-600 hover:bg-orange-700 text-white gap-1.5"
              >
                {isCreatingRemedial && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isCreatingRemedial ? "Menyimpan..." : "Simpan Remedial"}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={isEndConfirmOpen}
        onOpenChange={setIsEndConfirmOpen}
        variant="destructive"
        isLoading={isEndingSession}
        title="Tutup Room Sesi?"
        description="Room sesi akan diakhiri dan PIN ini tidak lagi dapat digunakan."
        confirmLabel="Iya"
        cancelLabel="Batal"
        onConfirm={handleEndSession}
      />
    </div>
  );
}

