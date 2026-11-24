import { NextResponse } from "next/server";
import { INDONESIAN_SCHOOLS_DATA } from "@/data/indonesian-schools";

// ─── GET /api/schools/[npsn] ──────────────────────────────────────────────
export async function GET(
  request: Request,
  { params }: { params: Promise<{ npsn: string }> }
) {
  try {
    const { npsn } = await params;
    const cleanNpsn = npsn.trim();

    // 1. Cek dataset curated lokal
    const local = INDONESIAN_SCHOOLS_DATA.find((s) => s.npsn === cleanNpsn);
    if (local) {
      return NextResponse.json({
        success: true,
        source: "local_curated",
        school: local
      });
    }

    // 2. Cek API Dapodik Gateway
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(
        `https://api-sekolah-indonesia.vercel.app/sekolah?npsn=${cleanNpsn}`,
        {
          signal: controller.signal,
          headers: { Accept: "application/json" }
        }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const item = json.dataSekolah || json.data;
        if (item) {
          const school = {
            id: item.id || `sch-${item.npsn}`,
            npsn: String(item.npsn),
            name: String(item.sekolah || item.nama).toUpperCase(),
            level: (item.bentuk || item.jenjang || "SMA").toUpperCase(),
            status: (item.status || "NEGERI").toUpperCase(),
            province: item.propinsi || item.provinsi || "Jawa Timur",
            city: item.kabupaten_kota || item.kab_kota || "Surabaya",
            district: item.kecamatan || "",
            address: item.alamat_jalan || item.alamat || "Indonesia",
            accreditation: item.akreditasi || "A"
          };
          return NextResponse.json({
            success: true,
            source: "api",
            school
          });
        }
      }
    } catch {}

    return NextResponse.json(
      { success: false, error: "Sekolah dengan NPSN tersebut tidak ditemukan" },
      { status: 404 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

