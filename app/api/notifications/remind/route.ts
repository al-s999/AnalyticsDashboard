import { NextRequest, NextResponse } from "next/server";
import { formatDeadlineDisplay, getSupabaseAdminClient } from "@/lib/tasks/server";
import { createNotificationsWithPush, resolveSessionJoinUrl } from "@/lib/notifications/server";
import { resolveGameApplicationKey } from "@/lib/tasks/session-helper";
import { getCookieApex, getRequestHost } from "@/lib/auth-redirect";

export const dynamic = "force-dynamic";

// ─── POST /api/notifications/remind ──────────────────────────────────────────
// Mengirim notifikasi pengingat tugas ke 1 atau beberapa siswa di gameforsmartNewUI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const actorId = typeof body?.actorId === "string" ? body.actorId.trim() : "";
    const taskId = typeof body?.taskId === "string" ? body.taskId.trim() : "";
    const groupId = typeof body?.groupId === "string" ? body.groupId.trim() : "";
    const pendingCount =
      typeof body?.pendingCount === "number" && body.pendingCount > 0
        ? body.pendingCount
        : undefined;

    const rawIds = Array.isArray(body?.studentIds) ? body.studentIds : [];
    const studentIds: string[] = Array.from(
      new Set(
        rawIds
          .filter((id: unknown): id is string => typeof id === "string" && id.trim().length > 0)
          .map((id: string) => id.trim())
      )
    );

    if (studentIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Minimal 1 siswa target wajib disertakan" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // 1. Ambil detail tugas jika taskId disertakan
    let taskRow: any = null;
    if (taskId) {
      const { data } = await supabase
        .from("teacher_tasks")
        .select("id, title, quiz_title, deadline, session_id, game_pin, game_id, game_name, group_id, teacher_id")
        .eq("id", taskId)
        .is("deleted_at", null)
        .maybeSingle();
      taskRow = data;
    }

    const resolvedActorId = actorId || taskRow?.teacher_id || "";
    if (!resolvedActorId) {
      return NextResponse.json(
        { success: false, error: "actorId wajib disertakan" },
        { status: 400 }
      );
    }

    // 2. Ambil nama guru untuk pesan pengingat yang jelas
    let actorName = "Guru";
    const { data: actorProfile } = await supabase
      .from("profiles")
      .select("nickname, fullname, username")
      .eq("id", resolvedActorId)
      .maybeSingle();
    if (actorProfile) {
      actorName =
        actorProfile.nickname ||
        actorProfile.fullname ||
        actorProfile.username ||
        "Guru";
    }

    const resolvedGroupId = groupId || taskRow?.group_id || null;
    const apex = getCookieApex(getRequestHost(request.headers, request.url));

    let targetUrl = "/notifications";
    if (taskRow?.game_pin) {
      const appKey = resolveGameApplicationKey(taskRow.game_id || taskRow.game_name);
      targetUrl = resolveSessionJoinUrl(taskRow.game_pin, appKey, apex).url;
    }

    const taskLabel = taskRow?.title || taskRow?.quiz_title || "tugas";
    const deadlineText = taskRow?.deadline
      ? ` sebelum ${formatDeadlineDisplay(taskRow.deadline)}`
      : "";

    const message = taskRow
      ? `${actorName} mengingatkan Anda untuk segera mengerjakan "${taskLabel}"${deadlineText}.`
      : `${actorName} mengingatkan Anda untuk segera mengerjakan ${pendingCount || 1} tugas yang belum selesai.`;

    const receivers = studentIds.filter((uid) => uid !== resolvedActorId);
    if (receivers.length === 0) {
      return NextResponse.json({
        success: true,
        sentCount: 0,
        message: "Tidak ada siswa target untuk dikirimi pengingat"
      });
    }

    const notifications = receivers.map((studentId) => ({
      user_id: studentId,
      actor_id: resolvedActorId,
      type: "admin" as const,
      entity_type: taskRow ? "task" : "group",
      entity_id: taskRow?.id || null,
      from_group_id: resolvedGroupId,
      is_read: false,
      status: null,
      content: {
        title: "Pengingat Tugas 📚",
        message,
        url: targetUrl,
        taskId: taskRow?.id || null,
        groupId: resolvedGroupId
      }
    }));

    const { error: notifErr } = await createNotificationsWithPush(notifications);
    if (notifErr) {
      return NextResponse.json(
        { success: false, error: `Gagal mengirim pengingat: ${notifErr}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sentCount: receivers.length,
      message: `Pengingat berhasil dikirim ke ${receivers.length} siswa`
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Gagal mengirim pengingat tugas" },
      { status: 500 }
    );
  }
}

