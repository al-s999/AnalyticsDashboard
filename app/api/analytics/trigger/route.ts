import { NextResponse } from "next/server";
import { AnalyticsEngine } from "@/lib/analytics/engine";

// ─── POST /api/analytics/trigger ──────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      scopeType = "guru",
      targetId = "20532247",
      targetName = "SMAN 1 SURABAYA",
      subject = "Matematika",
      grade = "Kelas 10"
    } = body;

    const snapshot = await AnalyticsEngine.generateSnapshot({
      scopeType,
      targetId,
      targetName,
      subject,
      grade,
      isMidnightCron: false
    });

    return NextResponse.json({
      success: true,
      message: "Analitik berhasil diperbarui dan disimpan ke format JSON Snapshot.",
      snapshot
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

