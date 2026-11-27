import { StudentTask } from "@/data/students-data";

export interface CreateTaskInput {
  teacherId: string;
  groupId: string;
  groupName: string;
  title: string;
  quizId?: string;
  quizTitle?: string;
  questionCount?: number;
  gameId?: string;
  gameName?: string;
  subject?: string;
  type?: "reguler" | "prescriptive_remedial";
  executionMode?: "homework" | "live_room";
  targetScope?: "all" | "remedial_only";
  targetCompetency?: string;
  deadline?: string;
  passingScore?: number;
  studentIds?: string[];
}

export interface PaginatedTasksResult {
  tasks: StudentTask[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function fetchTeacherTasks(teacherId?: string): Promise<StudentTask[]> {
  const queryParam = teacherId ? `?teacher_id=${encodeURIComponent(teacherId)}` : "";
  const res = await fetch(`/api/tasks${queryParam}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Gagal memuat daftar tugas");
  }
  return Array.isArray(data.tasks) ? data.tasks : [];
}

export async function fetchTeacherTasksPage(options: {
  teacherId?: string;
  groupId?: string;
  page?: number;
  limit?: number;
  search?: string;
  signal?: AbortSignal;
}): Promise<PaginatedTasksResult> {
  const params = new URLSearchParams({
    page: String(options.page ?? 1),
    limit: String(options.limit ?? 20)
  });
  if (options.teacherId) params.set("teacher_id", options.teacherId);
  if (options.groupId && options.groupId !== "all") params.set("group_id", options.groupId);
  if (options.search) params.set("search", options.search);

  const res = await fetch(`/api/tasks?${params.toString()}`, { signal: options.signal });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Gagal memuat daftar tugas");
  }
  return {
    tasks: Array.isArray(data.tasks) ? data.tasks : [],
    pagination: data.pagination ?? {
      page: options.page ?? 1,
      limit: options.limit ?? 20,
      total: Array.isArray(data.tasks) ? data.tasks.length : 0,
      totalPages: 1
    }
  };
}

export async function createTeacherTasks(tasks: CreateTaskInput[]): Promise<StudentTask[]> {
  const res = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tasks })
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Gagal membuat tugas");
  }
  return Array.isArray(data.tasks) ? data.tasks : [];
}

export async function updateTeacherTask(
  taskId: string,
  updates: {
    title?: string;
    deadline?: string;
    passingScore?: number;
    type?: "reguler" | "prescriptive_remedial";
    targetCompetency?: string;
  }
): Promise<StudentTask> {
  const res = await fetch(`/api/tasks/${encodeURIComponent(taskId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates)
  });
  const data = await res.json();
  if (!res.ok || !data.success || !data.task) {
    throw new Error(data.error || "Gagal memperbarui tugas");
  }
  return data.task;
}

export async function deleteTeacherTask(taskId: string): Promise<void> {
  const res = await fetch(`/api/tasks/${encodeURIComponent(taskId)}`, {
    method: "DELETE"
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Gagal menghapus tugas");
  }
}

export interface StartTaskSessionResult {
  success: boolean;
  reused?: boolean;
  sessionId: string;
  gamePin: string;
  redirectUrl: string;
  task?: StudentTask;
}

export async function startTaskSession(
  taskId: string,
  options?: {
    hostId?: string;
    gameId?: string;
    gameName?: string;
    durationMinutes?: number;
    questionLimit?: number | "all";
    difficulty?: string;
    gameEndMode?: "first_finish" | "manual";
    allowJoinAfterStart?: boolean;
  }
): Promise<StartTaskSessionResult> {
  const res = await fetch(`/api/tasks/${encodeURIComponent(taskId)}/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options || {})
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Gagal memulai sesi room tugas");
  }
  return data;
}

export async function endTaskSession(taskId: string): Promise<StudentTask | undefined> {
  const res = await fetch(`/api/tasks/${encodeURIComponent(taskId)}/session`, {
    method: "DELETE"
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Gagal menutup sesi room");
  }
  return data.task;
}

