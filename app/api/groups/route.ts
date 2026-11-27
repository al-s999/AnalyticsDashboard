import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { AcademicGroup, StudentProfile } from "@/data/students-data";

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

// ─── GET /api/groups ───────────────────────────────────────────────────────
// Mengambil daftar rombel/grup yang dimiliki (creator_id / owner) oleh guru yang login
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get("creator_id");
    const isLite = searchParams.get("lite") === "1";

    let query = supabase
      .from("groups")
      .select("id, name, description, creator_id, members, created_at, grade, category")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    // Jika parameter creatorId diberikan, filter ketat hanya grup yang dibuat oleh user tersebut
    if (creatorId) {
      query = query.eq("creator_id", creatorId);
    }

    const { data: rawGroups, error: groupError } = await query;

    if (groupError) {
      console.error("[api/groups] Fetch groups error:", groupError);
      return NextResponse.json({ success: false, error: groupError.message }, { status: 500 });
    }

    if (isLite) {
      const liteGroups: AcademicGroup[] = (rawGroups || []).map((g: any) => ({
        id: g.id,
        name: g.name,
        level: (g.grade?.includes("SD") ? "SD" : g.grade?.includes("SMP") ? "SMP" : "SMA") as any,
        grade: g.grade || "Kelas 10",
        subjects: ["Matematika Wajib"],
        subject: "Matematika Wajib",
        academicYear: "2025/2026 Ganjil",
        teacherId: g.creator_id,
        schoolNpsn: "20532247",
        students: [],
        createdAt: g.created_at || new Date().toISOString()
      }));
      return NextResponse.json({ success: true, groups: liteGroups });
    }

    // Kumpulkan seluruh member user_id untuk mengambil profil siswa
    const memberIds = new Set<string>();
    (rawGroups || []).forEach((g: any) => {
      if (Array.isArray(g.members)) {
        g.members.forEach((m: any) => {
          const id = m.id || m.user_id;
          // Jangan sertakan creator/owner grup sendiri sebagai siswa di tabel
          if (id && id !== g.creator_id) {
            memberIds.add(id);
          }
        });
      }
    });

    const groupIds = (rawGroups || []).map((g: any) => g.id).filter(Boolean);
    const memberIdsArray = Array.from(memberIds);

    // Ambil data profil & tugas secara paralel dengan Promise.all
    const [profilesRes, groupTasksRes] = await Promise.all([
      memberIdsArray.length > 0
        ? supabase
            .from("profiles")
            .select("id, username, fullname, email, avatar_url, grade, organization, last_active")
            .in("id", memberIdsArray)
        : Promise.resolve({ data: [] as any[] }),
      groupIds.length > 0 && memberIdsArray.length > 0
        ? supabase
            .from("teacher_tasks")
            .select("id, group_id")
            .in("group_id", groupIds)
            .is("deleted_at", null)
        : Promise.resolve({ data: [] as any[] })
    ]);

    const profilesMap = new Map<string, any>();
    (profilesRes.data || []).forEach((p: any) => profilesMap.set(p.id, p));

    // Ambil data submission untuk menghitung progres dan nilai siswa per grup
    const taskToGroupMap = new Map<string, string>();
    const studentGroupStats = new Map<
      string,
      {
        totalAssigned: number;
        completedCount: number;
        scoreSum: number;
        scoredCount: number;
        unmasteredTopics: Set<string>;
      }
    >();

    const taskIds: string[] = [];
    (groupTasksRes.data || []).forEach((t: any) => {
      if (t.id && t.group_id) {
        taskIds.push(t.id);
        taskToGroupMap.set(t.id, t.group_id);
      }
    });

    if (taskIds.length > 0 && memberIdsArray.length > 0) {
      const { data: subsData } = await supabase
        .from("task_submissions")
        .select("task_id, student_id, status, score, unmastered_subtopics")
        .in("task_id", taskIds)
        .in("student_id", memberIdsArray);

      (subsData || []).forEach((sub: any) => {
        const gId = taskToGroupMap.get(sub.task_id);
        if (!gId || !sub.student_id) return;
        const key = `${gId}:${sub.student_id}`;
        const existing = studentGroupStats.get(key) || {
          totalAssigned: 0,
          completedCount: 0,
          scoreSum: 0,
          scoredCount: 0,
          unmasteredTopics: new Set<string>()
        };

        existing.totalAssigned += 1;
        if (sub.status === "selesai") {
          existing.completedCount += 1;
        }
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
        studentGroupStats.set(key, existing);
      });
    }

    const formatRelativeLastActive = (isoDate?: string | null): string => {
      if (!isoDate) return "Belum pernah";
      const diffMs = Date.now() - new Date(isoDate).getTime();
      if (Number.isNaN(diffMs) || diffMs < 0) return "Baru saja";
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 60) return `${Math.max(1, diffMins)} menit lalu`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} jam lalu`;
      return new Date(isoDate).toLocaleDateString("id-ID");
    };

    // Map ke format AcademicGroup untuk Dashboard Guru
    const groups: AcademicGroup[] = (rawGroups || []).map((g: any) => {
      const students: StudentProfile[] = [];
      const seenStudentIds = new Set<string>();

      if (Array.isArray(g.members)) {
        g.members.forEach((m: any) => {
          const mId = m.id || m.user_id;
          if (mId && mId !== g.creator_id && !seenStudentIds.has(mId)) {
            seenStudentIds.add(mId);
            const p = profilesMap.get(mId);
            if (p) {
              const username = p.username || "siswa";
              const fullname = p.fullname || p.username || "Siswa GameForSmart";
              const avatarUrl =
                p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`;

              const stats = studentGroupStats.get(`${g.id}:${p.id}`);
              const avgScore =
                stats && stats.scoredCount > 0 ? Math.round(stats.scoreSum / stats.scoredCount) : 0;
              const readinessStatus: StudentProfile["readinessStatus"] =
                !stats || stats.scoredCount === 0
                  ? "Kurang"
                  : avgScore >= 75
                    ? "Baik"
                    : avgScore >= 65
                      ? "Cukup"
                      : "Kurang";

              students.push({
                id: p.id,
                username,
                fullname,
                email: p.email || `${username}@gameforsmart.com`,
                avatarUrl,
                grade: p.grade || g.grade || "Kelas 10",
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
          }
        });
      }

      return {
        id: g.id,
        name: g.name,
        level: (g.grade?.includes("SD") ? "SD" : g.grade?.includes("SMP") ? "SMP" : "SMA") as any,
        grade: g.grade || "Kelas 10",
        subjects: ["Matematika Wajib"],
        subject: "Matematika Wajib",
        academicYear: "2025/2026 Ganjil",
        teacherId: g.creator_id,
        schoolNpsn: "20532247",
        students,
        createdAt: g.created_at ? g.created_at.split("T")[0] : new Date().toISOString().split("T")[0]
      };
    });

    return NextResponse.json({
      success: true,
      groups
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ─── POST /api/groups ──────────────────────────────────────────────────────
// Membuat rombel baru di Supabase tabel groups dengan creator_id guru
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();

    const { name, level, grade, subjects, creatorId } = body;
    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: "Nama grup wajib diisi" }, { status: 400 });
    }

    if (!creatorId) {
      return NextResponse.json({ success: false, error: "ID Guru (creatorId) wajib disertakan" }, { status: 400 });
    }

    const newGroupRecord = {
      name: name.trim(),
      description: `Rombel Kelas Guru - ${grade || ""}`,
      creator_id: creatorId,
      members: [{ id: creatorId, role: "owner" }],
      category: level || "SMA",
      grade: grade || "Kelas 10",
      settings: { status: "public", admins_approval: false }
    };

    const { data, error } = await supabase
      .from("groups")
      .insert(newGroupRecord)
      .select()
      .single();

    if (error) {
      console.error("[api/groups] Insert error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const createdGroup: AcademicGroup = {
      id: data.id,
      name: data.name,
      level: (data.grade?.includes("SD") ? "SD" : data.grade?.includes("SMP") ? "SMP" : "SMA") as any,
      grade: data.grade || "Kelas 10",
      subjects: Array.isArray(subjects) && subjects.length > 0 ? subjects : ["Matematika Wajib"],
      subject: subjects?.[0] || "Matematika Wajib",
      academicYear: "2025/2026 Ganjil",
      teacherId: data.creator_id,
      schoolNpsn: "20532247",
      students: [],
      createdAt: data.created_at?.split("T")[0] || new Date().toISOString().split("T")[0]
    };

    return NextResponse.json({ success: true, group: createdGroup });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
