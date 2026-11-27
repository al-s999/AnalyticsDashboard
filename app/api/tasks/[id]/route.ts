import { NextRequest, NextResponse } from "next/server";
import {
  getSupabaseAdminClient,
  mapDbTasksToStudentTasks,
  parseDeadlineToIso
} from "@/lib/tasks/server";

export const dynamic = "force-dynamic";

// ─── GET /api/tasks/[id] ───────────────────────────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from("teacher_tasks")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: "Tugas tidak ditemukan" }, { status: 404 });
    }

    const [task] = await mapDbTasksToStudentTasks(supabase, [data]);
    return NextResponse.json({ success: true, task });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ─── PATCH /api/tasks/[id] ─────────────────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = getSupabaseAdminClient();

    const updates: Record<string, any> = {};

    if (typeof body.title === "string") {
      if (!body.title.trim()) {
        return NextResponse.json({ success: false, error: "Judul tugas tidak boleh kosong" }, { status: 400 });
      }
      updates.title = body.title.trim();
    }

    if (typeof body.deadline === "string" && body.deadline.trim()) {
      updates.deadline = parseDeadlineToIso(body.deadline);
    }

    if (typeof body.passingScore === "number") {
      updates.passing_score = body.passingScore;
    }

    if (body.type === "reguler" || body.type === "prescriptive_remedial") {
      updates.task_type = body.type;
    }

    if (typeof body.targetCompetency === "string") {
      updates.target_competency = body.targetCompetency;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: "Tidak ada perubahan yang dikirim" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("teacher_tasks")
      .update(updates)
      .eq("id", id)
      .is("deleted_at", null)
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: error?.message || "Tugas tidak ditemukan" },
        { status: error ? 500 : 404 }
      );
    }

    const [task] = await mapDbTasksToStudentTasks(supabase, [data]);
    return NextResponse.json({ success: true, task });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ─── DELETE /api/tasks/[id] ────────────────────────────────────────────────
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdminClient();

    const { error } = await supabase
      .from("teacher_tasks")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .is("deleted_at", null);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

