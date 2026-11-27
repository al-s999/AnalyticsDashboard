import { createClient } from "@supabase/supabase-js";
import { clientEnv, serverEnv } from "@/lib/env-config";
import { StudentTask } from "@/data/students-data";

export function getSupabaseAdminClient() {
  const url = clientEnv.supabase.url || "https://placeholder.supabase.co";
  const key = serverEnv.supabase.serviceRoleKey || clientEnv.supabase.anonKey || "placeholder-key";

  return createClient(url, key, {
    auth: { persistSession: false }
  });
}

const ID_MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  mei: 4,
  may: 4,
  jun: 5,
  jul: 6,
  agu: 7,
  aug: 7,
  sep: 8,
  okt: 9,
  oct: 9,
  nov: 10,
  des: 11,
  dec: 11
};

/**
 * Mengonversi input deadline (ISO string atau format "26 Nov 2026, 23:59 WIB")
 * menjadi ISO 8601 string untuk kolom TIMESTAMPTZ PostgreSQL.
 */
export function parseDeadlineToIso(input?: string | null): string {
  if (!input) {
    const fallback = new Date();
    fallback.setHours(23, 59, 0, 0);
    return fallback.toISOString();
  }

  const trimmed = input.trim();
  const direct = new Date(trimmed);
  if (!Number.isNaN(direct.getTime())) {
    return direct.toISOString();
  }

  // Tangani format lokal Indonesia: "26 Nov 2026, 23:59 WIB"
  const match = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})(?:,\s*(\d{1,2}):(\d{2}))?/);
  if (match) {
    const day = parseInt(match[1], 10);
    const monthKey = match[2].toLowerCase().slice(0, 3);
    const year = parseInt(match[3], 10);
    const hour = match[4] ? parseInt(match[4], 10) : 23;
    const minute = match[5] ? parseInt(match[5], 10) : 59;
    const monthIndex = ID_MONTHS[monthKey];

    if (monthIndex !== undefined) {
      // Asumsi WIB (UTC+7)
      const utcMs = Date.UTC(year, monthIndex, day, hour - 7, minute, 0, 0);
      return new Date(utcMs).toISOString();
    }
  }

  const fallback = new Date();
  fallback.setHours(23, 59, 0, 0);
  return fallback.toISOString();
}

/**
 * Memformat TIMESTAMPTZ dari database ke tampilan UI "d MMM yyyy, HH:mm WIB".
 */
export function formatDeadlineDisplay(isoString?: string | null): string {
  if (!isoString) return "-";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;

  const formattedDate = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta"
  }).format(date);

  return `${formattedDate.replace(".", ":")} WIB`;
}

/**
 * Menyinkronkan status sesi (`game_sessions.status`) dan hasil peserta
 * (`game_sessions.participants`) ke `teacher_tasks.session_status` dan `task_submissions`
 * agar data hasil game (seperti Axiom, CrazyRace, App GameForSmart, dll.) otomatis
 * tampil di halaman detail tugas saat sesi sudah selesai / di leaderboard.
 */
export async function syncTaskSessionsProgress(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  rawTasks: any[]
): Promise<void> {
  const tasksWithSession = rawTasks.filter((t) => Boolean(t?.session_id));
  if (tasksWithSession.length === 0) return;

  const sessionIds = Array.from(new Set(tasksWithSession.map((t) => t.session_id)));
  const taskIds = Array.from(new Set(tasksWithSession.map((t) => t.id)));

  const [{ data: sessionsData }, { data: existingSubs }] = await Promise.all([
    supabase
      .from("game_sessions")
      .select("id, status, participants, started_at, ended_at")
      .in("id", sessionIds),
    supabase
      .from("task_submissions")
      .select("id, task_id, student_id, status, score, time_spent_minutes, submitted_at")
      .in("task_id", taskIds)
  ]);

  if (!sessionsData || sessionsData.length === 0) return;

  const sessionsMap = new Map<string, any>();
  sessionsData.forEach((gs: any) => sessionsMap.set(gs.id, gs));

  const subsByKey = new Map<string, any>();
  (existingSubs || []).forEach((s: any) => {
    subsByKey.set(`${s.task_id}::${s.student_id}`, s);
  });

  // Resolve UUID auth_user_id -> profiles.id (mis. pada Zigma yang mengisi user_id dengan auth UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-/i;
  const candidateUuids = new Set<string>();
  for (const gs of sessionsData) {
    const parts = Array.isArray(gs.participants) ? gs.participants : [];
    for (const p of parts) {
      const candidate = p?.profile_id || p?.user_id;
      if (typeof candidate === "string" && uuidRegex.test(candidate)) {
        candidateUuids.add(candidate);
      }
    }
  }
  const authUuidToProfileId = new Map<string, string>();
  if (candidateUuids.size > 0) {
    const { data: resolvedProfiles } = await supabase
      .from("profiles")
      .select("id, auth_user_id")
      .in("auth_user_id", Array.from(candidateUuids));
    (resolvedProfiles || []).forEach((rp: any) => {
      if (rp.auth_user_id && rp.id) authUuidToProfileId.set(rp.auth_user_id, rp.id);
    });
  }

  const taskStatusUpdates: PromiseLike<any>[] = [];
  const subsToInsert: any[] = [];
  const subsToUpdate: { id: string; payload: Record<string, any> }[] = [];

  for (const t of tasksWithSession) {
    const gs = sessionsMap.get(t.session_id);
    if (!gs) continue;

    if (gs.status && gs.status !== t.session_status) {
      t.session_status = gs.status;
      taskStatusUpdates.push(
        supabase
          .from("teacher_tasks")
          .update({ session_status: gs.status })
          .eq("id", t.id)
      );
    }

    const participants = Array.isArray(gs.participants) ? gs.participants : [];
    for (const p of participants) {
      const rawId = p?.profile_id || p?.user_id;
      if (!rawId || typeof rawId !== "string") continue;
      const studentId = uuidRegex.test(rawId)
        ? authUuidToProfileId.get(rawId) || null
        : rawId;
      if (!studentId) continue;

      const isCompleted = Boolean(p.ended || p.finished_at || gs.status === "finished");
      const nextStatus: "selesai" | "sedang_mengerjakan" | "belum_mulai" = isCompleted
        ? "selesai"
        : p.started
          ? "sedang_mengerjakan"
          : "belum_mulai";

      if (nextStatus === "belum_mulai") continue;

      const nextScore =
        p.accuracy !== undefined && p.accuracy !== null && !Number.isNaN(Number(p.accuracy))
          ? Math.round(Number(p.accuracy))
          : p.score !== undefined && p.score !== null && !Number.isNaN(Number(p.score))
            ? Math.round(Number(p.score))
            : null;

      let timeSpentMinutes: number | null = null;
      if (p.started && (p.ended || p.finished_at || gs.ended_at)) {
        const startMs = new Date(p.started).getTime();
        const endMs = new Date(p.ended || p.finished_at || gs.ended_at).getTime();
        if (!Number.isNaN(startMs) && !Number.isNaN(endMs) && endMs >= startMs) {
          timeSpentMinutes = Math.max(1, Math.round((endMs - startMs) / 60000));
        }
      } else if (typeof p.duration === "number" && p.duration > 0) {
        const divisor = p.duration > 1000 ? 60000 : 60;
        timeSpentMinutes = Math.max(1, Math.round(p.duration / divisor));
      }

      const endIso = p.ended || p.finished_at || gs.ended_at || null;
      const submittedAt =
        nextStatus === "selesai" ? endIso || new Date().toISOString() : null;

      const key = `${t.id}::${studentId}`;
      const existing = subsByKey.get(key);

      if (!existing) {
        subsToInsert.push({
          task_id: t.id,
          student_id: studentId,
          status: nextStatus,
          score: nextScore,
          time_spent_minutes: timeSpentMinutes,
          submitted_at: submittedAt
        });
      } else if (
        existing.status !== nextStatus ||
        (nextScore !== null && existing.score !== nextScore) ||
        (submittedAt && !existing.submitted_at)
      ) {
        subsToUpdate.push({
          id: existing.id,
          payload: {
            status: nextStatus,
            ...(nextScore !== null ? { score: nextScore } : {}),
            ...(timeSpentMinutes !== null ? { time_spent_minutes: timeSpentMinutes } : {}),
            ...(submittedAt ? { submitted_at: submittedAt } : {})
          }
        });
      }
    }
  }

  await Promise.all([
    ...taskStatusUpdates,
    ...(subsToInsert.length > 0 ? [supabase.from("task_submissions").insert(subsToInsert)] : []),
    ...subsToUpdate.map((u) =>
      supabase.from("task_submissions").update(u.payload).eq("id", u.id)
    )
  ]);
}

/**
 * Memetakan baris `teacher_tasks` + `task_submissions` + `profiles`
 * menjadi format `StudentTask[]` yang digunakan di UI Dashboard Guru.
 */
export async function mapDbTasksToStudentTasks(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  rawTasks: any[]
): Promise<StudentTask[]> {
  if (!Array.isArray(rawTasks) || rawTasks.length === 0) {
    return [];
  }

  await syncTaskSessionsProgress(supabase, rawTasks).catch((err) => {
    console.warn("[tasks/server] syncTaskSessionsProgress warning:", err);
  });

  const taskIds = rawTasks.map((t) => t.id);

  // 1. Ambil semua submission untuk daftar task ini
  const { data: rawSubmissions, error: subErr } = await supabase
    .from("task_submissions")
    .select("task_id, student_id, status, score, time_spent_minutes, unmastered_subtopics, submitted_at")
    .in("task_id", taskIds);

  if (subErr) {
    console.error("[tasks/server] Fetch submissions error:", subErr);
  }

  const submissionsList = rawSubmissions || [];

  // 2. Ambil profil seluruh siswa yang terlibat dalam satu query
  const studentIds = Array.from(new Set(submissionsList.map((s: any) => s.student_id).filter(Boolean)));
  const profilesMap = new Map<string, any>();

  if (studentIds.length > 0) {
    const { data: profilesData, error: profErr } = await supabase
      .from("profiles")
      .select("id, username, fullname, avatar_url")
      .in("id", studentIds);

    if (profErr) {
      console.error("[tasks/server] Fetch student profiles error:", profErr);
    }

    (profilesData || []).forEach((p: any) => profilesMap.set(p.id, p));
  }

  // 3. Kelompokkan submission per task_id
  const submissionsByTask = new Map<string, any[]>();
  submissionsList.forEach((sub: any) => {
    const list = submissionsByTask.get(sub.task_id) || [];
    list.push(sub);
    submissionsByTask.set(sub.task_id, list);
  });

  // 4. Susun StudentTask[]
  return rawTasks.map((t: any) => {
    const taskSubs = submissionsByTask.get(t.id) || [];

    const mappedSubmissions = taskSubs.map((sub: any) => {
      const profile = profilesMap.get(sub.student_id);
      const username = profile?.username || "siswa";
      const fullname = profile?.fullname || profile?.username || "Siswa GameForSmart";
      const avatarUrl =
        profile?.avatar_url ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`;

      return {
        studentId: sub.student_id,
        studentName: fullname,
        studentUsername: username,
        avatarUrl,
        status: (sub.status || "belum_mulai") as "selesai" | "sedang_mengerjakan" | "belum_mulai",
        score: sub.score !== null && sub.score !== undefined ? Number(sub.score) : undefined,
        submittedAt: sub.submitted_at ? formatDeadlineDisplay(sub.submitted_at) : undefined,
        timeSpentMinutes:
          sub.time_spent_minutes !== null && sub.time_spent_minutes !== undefined
            ? Number(sub.time_spent_minutes)
            : undefined,
        unmasteredSubtopics: Array.isArray(sub.unmastered_subtopics) ? sub.unmastered_subtopics : []
      };
    });

    const totalAssigned = mappedSubmissions.length;
    const completedSubs = mappedSubmissions.filter((s) => s.status === "selesai");
    const inProgressCount = mappedSubmissions.filter((s) => s.status === "sedang_mengerjakan").length;
    const notStartedCount = mappedSubmissions.filter((s) => s.status === "belum_mulai").length;

    const scoredSubs = completedSubs.filter((s) => typeof s.score === "number");
    const averageScore =
      scoredSubs.length > 0
        ? Math.round(scoredSubs.reduce((acc, s) => acc + (s.score ?? 0), 0) / scoredSubs.length)
        : 0;

    return {
      id: t.id,
      title: t.title,
      quizId: t.quiz_id || "",
      quizTitle: t.quiz_title || "Kuis Pilihan",
      questionCount: t.question_count ?? 10,
      gameId: t.game_id || undefined,
      gameName: t.game_name || undefined,
      subject: t.subject || "Matematika",
      groupId: t.group_id,
      groupName: t.group_name,
      type: (t.task_type || "reguler") as "reguler" | "prescriptive_remedial",
      executionMode: (t.execution_mode || "homework") as "homework" | "live_room",
      sessionId: t.session_id || undefined,
      gamePin: t.game_pin || undefined,
      sessionStatus: (t.session_status || undefined) as "waiting" | "active" | "finished" | undefined,
      targetCompetency: t.target_competency || "",
      deadline: formatDeadlineDisplay(t.deadline),
      passingScore: t.passing_score ?? 75,
      totalAssigned,
      completedCount: completedSubs.length,
      inProgressCount,
      notStartedCount,
      averageScore,
      createdAt: t.created_at ? String(t.created_at).split("T")[0] : new Date().toISOString().split("T")[0],
      submissions: mappedSubmissions
    };
  });
}

