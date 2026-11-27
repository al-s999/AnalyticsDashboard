import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { StudentProfile } from "@/data/students-data";

export const dynamic = "force-dynamic";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "placeholder-key";

  return createClient(url, key, {
    auth: { persistSession: false }
  });
}

function formatRelativeLastActive(isoDate?: string | null): string {
  if (!isoDate) return "Belum pernah";
  const diffMs = Date.now() - new Date(isoDate).getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) return "Baru saja";
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${Math.max(1, diffMins)} menit lalu`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  return new Date(isoDate).toLocaleDateString("id-ID");
}

// ─── GET /api/groups/[id]/members?page=1&limit=20&search=...&status=...&progress=... ───
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    if (!groupId) {
      return NextResponse.json({ success: false, error: "groupId wajib disertakan" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const statusFilter = (searchParams.get("status") || "all").trim();
    const progressFilter = (searchParams.get("progress") || "all").trim();

    const supabase = getSupabaseClient();

    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id, creator_id, members, grade")
      .eq("id", groupId)
      .is("deleted_at", null)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ success: false, error: "Grup tidak ditemukan" }, { status: 404 });
    }

    const uniqueMemberIds: string[] = [];
    const seenIds = new Set<string>();
    if (Array.isArray(group.members)) {
      for (const m of group.members) {
        const mId = m.id || m.user_id;
        if (mId && mId !== group.creator_id && !seenIds.has(mId)) {
          seenIds.add(mId);
          uniqueMemberIds.push(mId);
        }
      }
    }

    if (uniqueMemberIds.length === 0) {
      return NextResponse.json({
        success: true,
        students: [],
        pagination: { page, limit, total: 0, totalPages: 1 }
      });
    }

    const hasFilters = Boolean(search) || statusFilter !== "all" || progressFilter !== "all";
    const targetIds = hasFilters
      ? uniqueMemberIds
      : uniqueMemberIds.slice((page - 1) * limit, page * limit);

    if (targetIds.length === 0) {
      const total = uniqueMemberIds.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      return NextResponse.json({
        success: true,
        students: [],
        pagination: { page, limit, total, totalPages }
      });
    }

    const [{ data: profilesData }, { data: groupTasksData }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, username, fullname, email, avatar_url, grade, organization, last_active")
        .in("id", targetIds),
      supabase
        .from("teacher_tasks")
        .select("id")
        .eq("group_id", groupId)
        .is("deleted_at", null)
    ]);

    const profilesMap = new Map<string, any>();
    (profilesData || []).forEach((p: any) => profilesMap.set(p.id, p));

    const taskIds = (groupTasksData || []).map((t: any) => t.id).filter(Boolean);
    const studentStats = new Map<
      string,
      {
        totalAssigned: number;
        completedCount: number;
        scoreSum: number;
        scoredCount: number;
        unmasteredTopics: Set<string>;
      }
    >();

    if (taskIds.length > 0) {
      const { data: subsData } = await supabase
        .from("task_submissions")
        .select("student_id, status, score, unmastered_subtopics")
        .in("task_id", taskIds)
        .in("student_id", targetIds);

      (subsData || []).forEach((sub: any) => {
        if (!sub.student_id) return;
        const existing = studentStats.get(sub.student_id) || {
          totalAssigned: 0,
          completedCount: 0,
          scoreSum: 0,
          scoredCount: 0,
          unmasteredTopics: new Set<string>()
        };
        existing.totalAssigned += 1;
        if (sub.status === "selesai") existing.completedCount += 1;
        if (sub.score !== null && sub.score !== undefined && !Number.isNaN(Number(sub.score))) {
          existing.scoreSum += Number(sub.score);
          existing.scoredCount += 1;
        }
        if (Array.isArray(sub.unmastered_subtopics)) {
          sub.unmastered_subtopics.forEach((topic: any) => {
            if (typeof topic === "string" && topic.trim()) {
              existing.unmasteredTopics.add(topic.trim());
            }
          });
        }
        studentStats.set(sub.student_id, existing);
      });
    }

    const mappedStudents: StudentProfile[] = [];
    for (const mId of targetIds) {
      const p = profilesMap.get(mId);
      if (!p) continue;
      const username = p.username || "siswa";
      const fullname = p.fullname || p.username || "Siswa GameForSmart";
      const avatarUrl =
        p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`;
      const stats = studentStats.get(p.id);
      const avgScore = stats && stats.scoredCount > 0 ? Math.round(stats.scoreSum / stats.scoredCount) : 0;
      const readinessStatus: StudentProfile["readinessStatus"] =
        !stats || stats.scoredCount === 0
          ? "Kurang"
          : avgScore >= 75
            ? "Baik"
            : avgScore >= 65
              ? "Cukup"
              : "Kurang";

      mappedStudents.push({
        id: p.id,
        username,
        fullname,
        email: p.email || `${username}@gameforsmart.com`,
        avatarUrl,
        grade: p.grade || group.grade || "Kelas 10",
        schoolNpsn: "20532247",
        schoolName: p.organization || "Sekolah GameForSmart",
        accuracyRate: avgScore,
        predictedExamScore: avgScore,
        readinessStatus,
        unmasteredTopics: stats ? Array.from(stats.unmasteredTopics) : [],
        completedTasksCount: stats?.completedCount ?? 0,
        totalAssignedTasks: stats?.totalAssigned ?? 0,
        lastActive: formatRelativeLastActive(p.last_active)
      });
    }

    let finalStudents = mappedStudents;
    let total = uniqueMemberIds.length;

    if (hasFilters) {
      const filtered = mappedStudents.filter((s) => {
        const matchSearch =
          !search ||
          s.fullname.toLowerCase().includes(search) ||
          s.username.toLowerCase().includes(search);
        if (!matchSearch) return false;

        const score = s.predictedExamScore ?? s.accuracyRate;
        if (statusFilter === "baik" && score < 75) return false;
        if (statusFilter === "cukup" && (score < 65 || score >= 75)) return false;
        if (statusFilter === "kurang" && score >= 65) return false;
        if (statusFilter === "selesai" && score < 75) return false;
        if (statusFilter === "remedial" && score >= 75) return false;

        const pendingTasks = Math.max(0, s.totalAssignedTasks - s.completedTasksCount);
        const isProgresSelesai = pendingTasks === 0 && s.totalAssignedTasks > 0;
        if (progressFilter === "selesai" && !isProgresSelesai) return false;
        if (progressFilter === "belum" && isProgresSelesai) return false;

        return true;
      });

      total = filtered.length;
      finalStudents = filtered.slice((page - 1) * limit, page * limit);
    }

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      success: true,
      students: finalStudents,
      pagination: { page, limit, total, totalPages }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ─── POST /api/groups/[id]/members ─────────────────────────────────────────
// Tambah anggota siswa ke dalam kolom jsonb `members` di tabel groups Supabase
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    const body = await request.json();
    const { studentId } = body;

    if (!groupId || !studentId) {
      return NextResponse.json({ success: false, error: "groupId dan studentId wajib disertakan" }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // 1. Ambil data grup saat ini
    const { data: group, error: fetchErr } = await supabase
      .from("groups")
      .select("id, members")
      .eq("id", groupId)
      .single();

    if (fetchErr || !group) {
      return NextResponse.json({ success: false, error: "Grup tidak ditemukan" }, { status: 404 });
    }

    const currentMembers: any[] = Array.isArray(group.members) ? group.members : [];
    
    // Periksa apakah studentId sudah ada di members
    const isAlreadyMember = currentMembers.some((m: any) => (m.id || m.user_id) === studentId);
    if (isAlreadyMember) {
      return NextResponse.json({ success: true, message: "Siswa sudah terdaftar di grup ini", members: currentMembers });
    }

    const updatedMembers = [...currentMembers, { id: studentId, role: "member", joined_at: new Date().toISOString() }];

    const { error: updateErr } = await supabase
      .from("groups")
      .update({ members: updatedMembers, updated_at: new Date().toISOString() })
      .eq("id", groupId);

    if (updateErr) {
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, members: updatedMembers });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ─── DELETE /api/groups/[id]/members ───────────────────────────────────────
// Keluarkan siswa dari grup
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    const body = await request.json();
    const { studentId, studentIds } = body as { studentId?: string; studentIds?: string[] };

    const targetIds = Array.isArray(studentIds) && studentIds.length > 0
      ? studentIds.filter(Boolean)
      : studentId
        ? [studentId]
        : [];

    if (!groupId || targetIds.length === 0) {
      return NextResponse.json({ success: false, error: "groupId dan studentId wajib disertakan" }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    const { data: group, error: fetchErr } = await supabase
      .from("groups")
      .select("id, members")
      .eq("id", groupId)
      .single();

    if (fetchErr || !group) {
      return NextResponse.json({ success: false, error: "Grup tidak ditemukan" }, { status: 404 });
    }

    const targetIdSet = new Set(targetIds);
    const currentMembers: any[] = Array.isArray(group.members) ? group.members : [];
    const updatedMembers = currentMembers.filter((m: any) => !targetIdSet.has(m.id || m.user_id));

    const { error: updateErr } = await supabase
      .from("groups")
      .update({ members: updatedMembers, updated_at: new Date().toISOString() })
      .eq("id", groupId);

    if (updateErr) {
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, members: updatedMembers });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

