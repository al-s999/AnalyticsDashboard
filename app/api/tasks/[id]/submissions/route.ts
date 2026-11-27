import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/tasks/server";

export const dynamic = "force-dynamic";

// ─── PATCH /api/tasks/[id]/submissions ─────────────────────────────────────
// Memperbarui status atau hasil pengerjaan siswa pada sebuah tugas
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const body = await request.json();
    const { studentId, status, score, timeSpentMinutes, unmasteredSubtopics, submittedAt } = body;

    if (!taskId || !studentId) {
      return NextResponse.json(
        { success: false, error: "taskId dan studentId wajib disertakan" },
        { status: 400 }
      );
    }

    const validStatuses = ["belum_mulai", "sedang_mengerjakan", "selesai"];
    const nextStatus = validStatuses.includes(status) ? status : "sedang_mengerjakan";

    const upsertPayload: Record<string, any> = {
      task_id: taskId,
      student_id: studentId,
      status: nextStatus
    };

    if (typeof score === "number") {
      upsertPayload.score = score;
    }

    if (typeof timeSpentMinutes === "number") {
      upsertPayload.time_spent_minutes = timeSpentMinutes;
    }

    if (Array.isArray(unmasteredSubtopics)) {
      upsertPayload.unmastered_subtopics = unmasteredSubtopics;
    }

    if (nextStatus === "selesai") {
      upsertPayload.submitted_at = submittedAt || new Date().toISOString();
    } else if (submittedAt) {
      upsertPayload.submitted_at = submittedAt;
    }

    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("task_submissions")
      .upsert(upsertPayload, { onConflict: "task_id,student_id" })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, submission: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

