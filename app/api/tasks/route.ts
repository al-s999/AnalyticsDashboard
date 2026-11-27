import { NextRequest, NextResponse } from "next/server";
import {
  getSupabaseAdminClient,
  mapDbTasksToStudentTasks,
  parseDeadlineToIso
} from "@/lib/tasks/server";

export const dynamic = "force-dynamic";

interface CreateTaskPayload {
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

// ─── GET /api/tasks ────────────────────────────────────────────────────────
// Mengambil daftar penugasan guru (opsional filter teacher_id, group_id, search, serta pagination page & limit)
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdminClient();
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get("teacher_id");
    const groupId = searchParams.get("group_id");
    const search = (searchParams.get("search") || "").trim();
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    const isPaginated = pageParam !== null || limitParam !== null;
    const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(limitParam || "20", 10) || 20));

    let query = supabase
      .from("teacher_tasks")
      .select("*", isPaginated ? { count: "exact" } : undefined)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (teacherId) {
      query = query.eq("teacher_id", teacherId);
    }

    if (groupId && groupId !== "all") {
      query = query.eq("group_id", groupId);
    }

    if (search) {
      const escaped = search.replace(/[%_]/g, "\\$&");
      query = query.or(
        `title.ilike.%${escaped}%,group_name.ilike.%${escaped}%,subject.ilike.%${escaped}%`
      );
    }

    if (isPaginated) {
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);
    }

    const { data: rawTasks, error, count } = await query;

    if (error) {
      console.error("[api/tasks] GET error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const tasks = await mapDbTasksToStudentTasks(supabase, rawTasks || []);

    if (isPaginated) {
      const total = count ?? tasks.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      return NextResponse.json({
        success: true,
        tasks,
        pagination: { page, limit, total, totalPages }
      });
    }

    return NextResponse.json({ success: true, tasks });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ─── POST /api/tasks ───────────────────────────────────────────────────────
// Membuat satu atau beberapa penugasan baru sekaligus inisialisasi task_submissions
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdminClient();
    const body = await request.json();

    const payloads: CreateTaskPayload[] = Array.isArray(body?.tasks) ? body.tasks : [body];

    if (payloads.length === 0) {
      return NextResponse.json(
        { success: false, error: "Payload tugas tidak boleh kosong" },
        { status: 400 }
      );
    }

    for (const item of payloads) {
      if (!item?.teacherId || !item?.groupId || !item?.title?.trim()) {
        return NextResponse.json(
          { success: false, error: "teacherId, groupId, dan title wajib diisi" },
          { status: 400 }
        );
      }
    }

    const taskRecords = payloads.map((item) => ({
      teacher_id: item.teacherId,
      group_id: item.groupId,
      group_name: item.groupName || "Kelas",
      quiz_id: item.quizId || null,
      quiz_title: item.quizTitle || "Kuis Pilihan",
      question_count: typeof item.questionCount === "number" ? item.questionCount : 10,
      game_id: item.gameId && item.gameId !== "none" ? item.gameId : null,
      game_name: item.gameName && item.gameName !== "none" ? item.gameName : null,
      title: item.title.trim(),
      subject: item.subject || "Matematika",
      task_type: item.type === "prescriptive_remedial" ? "prescriptive_remedial" : "reguler",
      execution_mode: item.executionMode === "live_room" ? "live_room" : "homework",
      target_scope: item.targetScope === "remedial_only" ? "remedial_only" : "all",
      target_competency: item.targetCompetency || "",
      deadline: parseDeadlineToIso(item.deadline),
      passing_score: typeof item.passingScore === "number" ? item.passingScore : 75
    }));

    const { data: insertedTasks, error: insertError } = await supabase
      .from("teacher_tasks")
      .insert(taskRecords)
      .select("*");

    if (insertError || !insertedTasks) {
      console.error("[api/tasks] POST insert error:", insertError);
      return NextResponse.json(
        { success: false, error: insertError?.message || "Gagal membuat tugas" },
        { status: 500 }
      );
    }

    // Inisialisasi baris task_submissions untuk setiap siswa yang ditugaskan
    const submissionRows: any[] = [];
    insertedTasks.forEach((createdTask: any, idx: number) => {
      const studentIds = payloads[idx]?.studentIds || [];
      const uniqueStudentIds = Array.from(new Set(studentIds.filter(Boolean)));
      uniqueStudentIds.forEach((studentId) => {
        submissionRows.push({
          task_id: createdTask.id,
          student_id: studentId,
          status: "belum_mulai"
        });
      });
    });

    if (submissionRows.length > 0) {
      const { error: subError } = await supabase
        .from("task_submissions")
        .insert(submissionRows);

      if (subError) {
        console.error("[api/tasks] Insert submissions error:", subError);
      }
    }

    const tasks = await mapDbTasksToStudentTasks(supabase, insertedTasks);

    return NextResponse.json({
      success: true,
      tasks,
      task: tasks[0] || null
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

