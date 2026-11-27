import { parse, isValid } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { StudentTask } from "@/data/students-data";

/**
 * Mengurai string deadline ("26 Nov 2026, 23:59 WIB" atau ISO string) menjadi Date.
 */
export function parseTaskDeadline(deadline?: string | null): Date | null {
  if (!deadline || deadline === "-") return null;
  const cleaned = deadline.replace(/\s*WIB$/i, "").trim();

  const parsedId = parse(cleaned, "d MMM yyyy, HH:mm", new Date(), {
    locale: localeId
  });
  if (isValid(parsedId)) {
    return parsedId;
  }

  const parsedDateOnly = parse(cleaned, "d MMM yyyy", new Date(), {
    locale: localeId
  });
  if (isValid(parsedDateOnly)) {
    parsedDateOnly.setHours(23, 59, 0, 0);
    return parsedDateOnly;
  }

  const fallback = new Date(cleaned);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

/**
 * Mengecek apakah deadline tugas sudah lewat.
 */
export function isTaskDeadlinePassed(deadline?: string | null): boolean {
  const date = parseTaskDeadline(deadline);
  if (!date) return false;
  return date.getTime() < Date.now();
}

/**
 * Mengecek apakah deadline tugas jatuh pada hari ini.
 */
export function isTaskDueToday(deadline?: string | null): boolean {
  const date = parseTaskDeadline(deadline);
  if (!date) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export type TaskStatusCategory = "aktif" | "selesai";

/**
 * Menentukan status tugas:
 * - "selesai": seluruh siswa sudah selesai atau deadline telah berakhir
 * - "aktif": masih berjalan dan belum melewati deadline
 */
export function getTaskStatusCategory(task: StudentTask): TaskStatusCategory {
  const allDone = task.totalAssigned > 0 && task.completedCount >= task.totalAssigned;
  if (allDone || isTaskDeadlinePassed(task.deadline)) return "selesai";
  return "aktif";
}

/**
 * Label status pengerjaan siswa yang ringkas sesuai UX guru.
 */
export function getSubmissionStatusLabel(
  status: "selesai" | "sedang_mengerjakan" | "belum_mulai"
): string {
  switch (status) {
    case "selesai":
      return "Selesai";
    case "sedang_mengerjakan":
      return "Sedang Mengerjakan";
    case "belum_mulai":
    default:
      return "Belum Mulai";
  }
}

