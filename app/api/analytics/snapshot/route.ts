import { NextResponse } from "next/server";
import { AnalyticsEngine } from "@/lib/analytics/engine";

// ─── GET /api/analytics/snapshot?scopeType=...&targetId=... ───────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scopeType = (searchParams.get("scopeType") || "guru") as any;
    const targetId = searchParams.get("targetId") || "20532247";
    const subject = searchParams.get("subject") || "Matematika";
    const grade = searchParams.get("grade") || "Kelas 10";

    let snapshot = AnalyticsEngine.getCachedSnapshot(
      scopeType,
      targetId,
      subject,
      grade
    );

    if (!snapshot) {
      snapshot = await AnalyticsEngine.generateSnapshot({
        scopeType,
        targetId,
        targetName: "SMAN 1 SURABAYA",
        subject,
        grade,
        isMidnightCron: true
      });
    }

    return NextResponse.json({
      success: true,
      source: "json_snapshot_cache",
      snapshot
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

