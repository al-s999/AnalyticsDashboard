import { NextResponse } from "next/server";
import { AnalyticsEngine } from "@/lib/analytics/engine";

// ─── GET/POST /api/analytics/cron ─────────────────────────────────────────
// Simulasi Cron Job yang dijalankan otomatis setiap jam 00:00 WIB (12 Dini Hari)
export async function GET() {
  return handleMidnightCron();
}

export async function POST() {
  return handleMidnightCron();
}

async function handleMidnightCron() {
  const syncTargets = [
    { scopeType: "guru" as const, targetId: "demo-teacher-01", targetName: "Guru Rahmat - SMAN 1 SURABAYA" },
    { scopeType: "pengelola_sekolah" as const, targetId: "20532247", targetName: "SMAN 1 SURABAYA" },
    { scopeType: "dinas_kabkota" as const, targetId: "dinas-surabaya", targetName: "Dinas Pendidikan Kota Surabaya" },
    { scopeType: "dinas_provinsi" as const, targetId: "dinas-jatim", targetName: "Dinas Pendidikan Provinsi Jawa Timur" },
    { scopeType: "dinas_nasional" as const, targetId: "dinas-nasional", targetName: "Kementerian Pendidikan Nasional" }
  ];

  const results = [];
  for (const t of syncTargets) {
    const snap = await AnalyticsEngine.generateSnapshot({
      scopeType: t.scopeType,
      targetId: t.targetId,
      targetName: t.targetName,
      subject: "Matematika",
      grade: "Kelas 10",
      isMidnightCron: true
    });
    results.push({ target: t.targetName, snapshotId: snap.id });
  }

  return NextResponse.json({
    success: true,
    job: "midnight_analytics_aggregation",
    scheduledTime: "00:00:00 WIB",
    executedAt: new Date().toISOString(),
    totalUpdated: results.length,
    snapshots: results
  });
}

