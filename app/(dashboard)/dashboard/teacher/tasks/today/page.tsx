"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  ArrowLeft,
  Clock,
  Search,
  CheckCircle2,
  Eye,
  Loader2,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { AcademicGroup, StudentTask } from "@/data/students-data";
import { useAnalyticsAuth } from "@/contexts/analytics-auth-context";
import { fetchTeacherTasks } from "@/lib/tasks/client";
import { isTaskDueToday, getTaskStatusCategory } from "@/lib/tasks/utils";

export default function TodayTasksPage() {
  const { user } = useAnalyticsAuth();
  const [tasks, setTasks] = useState<StudentTask[]>([]);
  const [groups, setGroups] = useState<AcademicGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [selectedType, setSelectedType] = useState<"all" | "reguler" | "prescriptive_remedial">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [loadedTasks, groupsRes] = await Promise.all([
          fetchTeacherTasks(user?.id),
          fetch(`/api/groups?lite=1${user?.id ? `&creator_id=${encodeURIComponent(user.id)}` : ""}`).then(
            (r) => r.json()
          )
        ]);
        setTasks(loadedTasks);
        if (groupsRes?.success && Array.isArray(groupsRes.groups)) {
          setGroups(groupsRes.groups);
        }
      } catch (err) {
        console.warn("Gagal memuat tugas hari ini:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user?.id]);

  const todayTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tasks
      .filter((t) => isTaskDueToday(t.deadline))
      .filter((t) => selectedGroup === "all" || t.groupId === selectedGroup)
      .filter((t) => selectedType === "all" || t.type === selectedType)
      .filter(
        (t) =>
          !q ||
          t.title.toLowerCase().includes(q) ||
          t.groupName.toLowerCase().includes(q) ||
          (t.quizTitle || "").toLowerCase().includes(q)
      );
  }, [tasks, selectedGroup, selectedType, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/dashboard/teacher/tasks"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Tugas Hari Ini</h1>
              <p className="text-xs text-muted-foreground">
                Semua penugasan dan remedial yang jatuh tempo hari ini ({todayTasks.length} tugas)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="rounded-2xl border shadow-xs">
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari judul tugas, kuis, atau kelas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-xs rounded-xl"
            />
          </div>

          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger className="w-44 h-9 text-xs rounded-xl">
              <SelectValue placeholder="Semua Kelas" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="text-xs">
                Semua Kelas
              </SelectItem>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id} className="text-xs">
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedType}
            onValueChange={(v) => setSelectedType(v as "all" | "reguler" | "prescriptive_remedial")}
          >
            <SelectTrigger className="w-40 h-9 text-xs rounded-xl">
              <SelectValue placeholder="Semua Tipe" />
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
        </CardContent>
      </Card>

      {/* Daftar Tugas Hari Ini */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="rounded-2xl border p-5 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24 rounded-full" />
                <Skeleton className="h-4 w-12 rounded-full" />
              </div>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-2 w-full rounded-full" />
            </Card>
          ))}
        </div>
      ) : todayTasks.length === 0 ? (
        <Card className="rounded-2xl border shadow-xs">
          <CardContent className="p-12 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-foreground">Tidak Ada Tugas Jatuh Tempo Hari Ini</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Belum ada tugas yang memiliki batas waktu hari ini atau sesuai dengan filter yang dipilih.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {todayTasks.map((task) => {
            const percent =
              task.totalAssigned > 0
                ? Math.round((task.completedCount / task.totalAssigned) * 100)
                : 0;
            const statusCat = getTaskStatusCategory(task);

            return (
              <Card
                key={task.id}
                className="rounded-2xl border shadow-2xs hover:border-orange-300 dark:hover:border-orange-800 transition-all flex flex-col justify-between"
              >
                <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold px-2 py-0 border-transparent ${task.type === "prescriptive_remedial"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                            }`}
                        >
                          {task.type === "prescriptive_remedial" ? "Remedial" : "Tugas"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-2 py-0 ${statusCat === "selesai"
                              ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-700 border-amber-500/20"
                            }`}
                        >
                          {statusCat === "selesai" ? "Selesai" : "Aktif"}
                        </Badge>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-semibold shrink-0">
                        KKM: {task.passingScore}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-foreground line-clamp-2">
                        {task.title}
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <BookOpen className="w-3 h-3 shrink-0" />
                        <span className="truncate">
                          {task.groupName} • {task.subject}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">Progres Pengerjaan</span>
                        <span className="font-bold text-foreground">
                          {task.completedCount}/{task.totalAssigned} Siswa ({percent}%)
                        </span>
                      </div>
                      <Progress value={percent} className="h-1.5 rounded-full" />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t text-xs">
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="w-3.5 h-3.5 text-orange-500" />
                        {task.deadline}
                      </span>
                      <Link href={`/dashboard/teacher/tasks/${task.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-[11px] rounded-lg gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Detail</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

