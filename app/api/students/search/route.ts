import { NextResponse } from "next/server";
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

// ─── GET /api/students/search?q=...&npsn=... ──────────────────────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQ = (searchParams.get("q") || "").trim();
    // Hilangkan '@' jika dicari dengan format @username
    const q = rawQ.replace(/^@/, "").toLowerCase();
    const npsn = (searchParams.get("npsn") || "").trim();

    const supabase = getSupabaseClient();

    let query = supabase
      .from("profiles")
      .select("id, username, fullname, email, avatar_url, grade, organization, role, nickname, last_active")
      .is("deleted_at", null)
      .limit(30);

    if (q) {
      // Cari kecocokan username, fullname, nickname, atau email
      query = query.or(`username.ilike.%${q}%,fullname.ilike.%${q}%,nickname.ilike.%${q}%,email.ilike.%${q}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[api/students/search] Supabase error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Mapping record profiles Supabase ke antarmuka StudentProfile yang digunakan UI
    const students: StudentProfile[] = (data || []).map((p: any) => {
      const username = p.username || p.nickname || "user";
      const fullname = p.fullname || p.nickname || p.username || "Siswa GameForSmart";
      const avatarUrl =
        p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`;

      return {
        id: p.id,
        username,
        fullname,
        email: p.email || `${username}@gameforsmart.com`,
        avatarUrl,
        grade: p.grade || "Kelas 10",
        schoolNpsn: npsn || "20532247",
        schoolName: p.organization || "Sekolah GameForSmart",
        accuracyRate: 0,
        predictedExamScore: 0,
        readinessStatus: "Kurang",
        unmasteredTopics: [],
        completedTasksCount: 0,
        totalAssignedTasks: 0,
        lastActive: p.last_active ? new Date(p.last_active).toLocaleDateString("id-ID") : "Belum pernah"
      };
    });

    return NextResponse.json({
      success: true,
      total: students.length,
      students
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
