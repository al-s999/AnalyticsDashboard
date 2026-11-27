import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

// ─── POST /api/schools ──────────────────────────────────────────────────────
// Menambahkan sekolah custom secara manual (is_verified = false)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, level, province, city } = await request.json();
    const trimmedName = (name || "").trim();

    if (!trimmedName || trimmedName.length < 2) {
      return NextResponse.json({ error: "Nama sekolah tidak valid" }, { status: 400 });
    }

    const db = supabase as any;

    // Cek apakah sudah ada sekolah dengan nama yang sama
    const { data: existing } = await db
      .from("schools")
      .select("id, name, level, province, city")
      .ilike("name", trimmedName)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ school: existing });
    }

    // Insert sekolah custom (is_verified = false)
    const { data: newSchool, error } = await db
      .from("schools")
      .insert({
        name: trimmedName,
        level: level || null,
        province: province || null,
        city: city || null,
        is_verified: false,
      })
      .select()
      .single();

    if (error) {
      console.error("[schools/POST] Supabase error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ school: newSchool });
  } catch (err: any) {
    console.error("[schools/POST] Error:", err.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

