import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/tasks/server";
import { createNotificationsWithPush } from "@/lib/notifications/server";

export const dynamic = "force-dynamic";

// ─── GET /api/groups/[id]/invite ─────────────────────────────────────────────
// Ambil daftar user_id siswa yang memiliki undangan grup berstatus pending (status IS NULL)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    if (!groupId) {
      return NextResponse.json(
        { success: false, error: "groupId wajib disertakan" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("user_id")
      .eq("type", "group")
      .eq("from_group_id", groupId)
      .is("status", null);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const pendingUserIds = Array.from(
      new Set((data || []).map((row: any) => row.user_id).filter(Boolean))
    );

    return NextResponse.json({ success: true, pendingUserIds });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Gagal memuat status undangan" },
      { status: 500 }
    );
  }
}

// ─── POST /api/groups/[id]/invite ────────────────────────────────────────────
// Mengirim undangan bergabung ke grup (notifikasi type: "group" dengan opsi Ya/Tidak di gameforsmartNewUI)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    const body = await request.json().catch(() => ({}));
    const studentId = typeof body?.studentId === "string" ? body.studentId.trim() : "";
    const actorId = typeof body?.actorId === "string" ? body.actorId.trim() : "";

    if (!groupId || !studentId) {
      return NextResponse.json(
        { success: false, error: "groupId dan studentId wajib disertakan" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // 1. Pastikan grup ada dan cek apakah siswa sudah terdaftar di members
    const { data: group, error: groupErr } = await supabase
      .from("groups")
      .select("id, name, creator_id, members")
      .eq("id", groupId)
      .is("deleted_at", null)
      .single();

    if (groupErr || !group) {
      return NextResponse.json(
        { success: false, error: "Grup tidak ditemukan" },
        { status: 404 }
      );
    }

    const members: any[] = Array.isArray(group.members) ? group.members : [];
    const isAlreadyMember = members.some(
      (m: any) => (m.id || m.user_id) === studentId
    );
    if (isAlreadyMember) {
      return NextResponse.json(
        {
          success: false,
          alreadyMember: true,
          error: "Siswa sudah terdaftar di grup ini"
        },
        { status: 409 }
      );
    }

    // 2. Cegah duplikat invite yang masih pending (status IS NULL)
    const { data: existingPending } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", studentId)
      .eq("type", "group")
      .eq("from_group_id", groupId)
      .is("status", null)
      .limit(1);

    if (existingPending && existingPending.length > 0) {
      return NextResponse.json({
        success: true,
        alreadyInvited: true,
        message: "Undangan sudah dikirim dan sedang menunggu konfirmasi siswa"
      });
    }

    const resolvedActorId = actorId || group.creator_id;
    if (!resolvedActorId) {
      return NextResponse.json(
        { success: false, error: "Identitas pengirim undangan (actorId) tidak ditemukan" },
        { status: 400 }
      );
    }

    // 3. Insert notifikasi type "group" (sesuai template gameforsmartNewUI) + Web Push
    const { error: notifErr } = await createNotificationsWithPush([
      {
        user_id: studentId,
        actor_id: resolvedActorId,
        type: "group",
        entity_type: "group",
        entity_id: null,
        from_group_id: groupId,
        is_read: false,
        status: null,
        content: null
      }
    ]);

    if (notifErr) {
      return NextResponse.json(
        { success: false, error: `Gagal mengirim undangan: ${notifErr}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      alreadyInvited: false,
      message: `Undangan bergabung ke "${group.name}" berhasil dikirim`
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Gagal mengirim undangan grup" },
      { status: 500 }
    );
  }
}

