import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

// ─── GET /api/schools/search?q=...&level=...&limit=... ────────────────────
// Mencari sekolah berdasarkan nama atau NPSN dari tabel public.schools (Supabase).
// Mengembalikan maksimal 20 hasil (default) untuk autocomplete dropdown.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const level = searchParams.get("level") || "";
    const defaultLimit = q.length < 2 ? 50 : 20;
    const limit = Math.min(parseInt(searchParams.get("limit") || String(defaultLimit), 10) || defaultLimit, 50);

    const supabase = await createClient();
    const db = supabase as any;

    let query = db
      .from("schools")
      .select("id, npsn, name, level, status, province, city")
      .order("name")
      .limit(limit);

    if (q.length >= 2) {
      const isNpsn = /^\d+$/.test(q);
      if (isNpsn) {
        // Pencarian by NPSN prefix
        query = query.ilike("npsn", `${q}%`);
      } else {
        // Pencarian by nama
        query = query.ilike("name", `%${q}%`);
      }
    }

    // Filter opsional berdasarkan jenjang
    if (level) {
      query = query.eq("level", level.toUpperCase());
    }

    const { data: schools, error } = await query;

    if (error) {
      console.error("[schools/search] Supabase error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      total: (schools ?? []).length,
      schools: schools ?? [],
    });
  } catch (err: any) {
    console.error("[schools/search] Internal error:", err.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
