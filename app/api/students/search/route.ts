import { NextResponse } from "next/server";
import { GAMEFORSMART_STUDENTS } from "@/data/students-data";

// ─── GET /api/students/search?q=...&npsn=... ──────────────────────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim().toLowerCase();
    const npsn = (searchParams.get("npsn") || "").trim();

    let students = GAMEFORSMART_STUDENTS;

    if (npsn) {
      students = students.filter((s) => s.schoolNpsn === npsn);
    }

    if (q) {
      students = students.filter(
        (s) =>
          s.username.toLowerCase().includes(q) ||
          s.fullname.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
      );
    }

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

