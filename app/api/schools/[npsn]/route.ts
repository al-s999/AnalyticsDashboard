import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

// ─── GET /api/schools/[npsn] ──────────────────────────────────────────────
// Mengambil detail sekolah berdasarkan NPSN dari tabel public.schools (Supabase).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ npsn: string }> }
) {
  try {
    const { npsn } = await params;
    const cleanNpsn = npsn.trim();

    if (!cleanNpsn) {
      return NextResponse.json(
        { success: false, error: "NPSN wajib diisi" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const db = supabase as any;

    const { data: school, error } = await db
      .from("schools")
      .select("id, npsn, name, level, status, province, city, district, is_verified")
      .eq("npsn", cleanNpsn)
      .maybeSingle();

    if (error) {
      console.error("[schools/[npsn]] Supabase error:", error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!school) {
      return NextResponse.json(
        { success: false, error: "Sekolah dengan NPSN tersebut tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      source: "supabase",
      school,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
