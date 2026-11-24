/**
 * Kamus dan Parser Domain Resmi Pemerintahan Indonesia (.go.id & kemdikbud.go.id)
 * Memisahkan secara tegas antara Dinas Kabupaten (dinas_kab) dan Dinas Kota (dinas_kota),
 * serta memberikan wewenang penuh monitoring seluruh jenjang di wilayahnya (termasuk SMA/SMK/SLB).
 */

export interface GovDomainInfo {
  role: "dinas_kab" | "dinas_kota" | "dinas_provinsi" | "dinas_nasional";
  regionName: string;
  levelTitle: string;
  jurisdictionScope: string;
}

// 1. Pemetaan Domain Nasional
const NATIONAL_DOMAINS: Record<string, GovDomainInfo> = {
  "kemdikbud.go.id": {
    role: "dinas_nasional",
    regionName: "Nasional (Seluruh Indonesia)",
    levelTitle: "Kementerian Pendidikan Dasar & Menengah RI",
    jurisdictionScope: "Semua Jenjang Nasional (PAUD, SD, SMP, SMA, SMK)"
  },
  "kemendikbud.go.id": {
    role: "dinas_nasional",
    regionName: "Nasional (Seluruh Indonesia)",
    levelTitle: "Kementerian Pendidikan Dasar & Menengah RI",
    jurisdictionScope: "Semua Jenjang Nasional (PAUD, SD, SMP, SMA, SMK)"
  }
};

// 2. Pemetaan Provinsi (38 Provinsi Indonesia)
const PROVINCE_KEYS: Record<string, string> = {
  "acehprov": "Provinsi Aceh",
  "sumutprov": "Provinsi Sumatera Utara",
  "sumbarprov": "Provinsi Sumatera Barat",
  "riau": "Provinsi Riau",
  "kepriprov": "Provinsi Kepulauan Riau",
  "jambiprov": "Provinsi Jambi",
  "sumselprov": "Provinsi Sumatera Selatan",
  "bengkuluprov": "Provinsi Bengkulu",
  "lampungprov": "Provinsi Lampung",
  "babelprov": "Provinsi Kepulauan Bangka Belitung",
  "jakarta": "Provinsi DKI Jakarta",
  "dki": "Provinsi DKI Jakarta",
  "jabarprov": "Provinsi Jawa Barat",
  "jatengprov": "Provinsi Jawa Tengah",
  "jogjaprov": "Provinsi D.I. Yogyakarta",
  "diy": "Provinsi D.I. Yogyakarta",
  "jatimprov": "Provinsi Jawa Timur",
  "bantenprov": "Provinsi Banten",
  "baliprov": "Provinsi Bali",
  "ntbprov": "Provinsi Nusa Tenggara Barat",
  "nttprov": "Provinsi Nusa Tenggara Timur",
  "kalbarprov": "Provinsi Kalimantan Barat",
  "kaltengprov": "Provinsi Kalimantan Tengah",
  "kalselprov": "Provinsi Kalimantan Selatan",
  "kaltimprov": "Provinsi Kalimantan Timur",
  "kaltaraprov": "Provinsi Kalimantan Utara",
  "sulutprov": "Provinsi Sulawesi Utara",
  "sultengprov": "Provinsi Sulawesi Tengah",
  "sulselprov": "Provinsi Sulawesi Selatan",
  "sultraprov": "Provinsi Sulawesi Tenggara",
  "gorontaloprov": "Provinsi Gorontalo",
  "sulbarprov": "Provinsi Sulawesi Barat",
  "malukuprov": "Provinsi Maluku",
  "malutprov": "Provinsi Maluku Utara",
  "papuaprov": "Provinsi Papua",
  "papuabaratprov": "Provinsi Papua Barat",
  "papuaselatanprov": "Provinsi Papua Selatan",
  "papuatengahprov": "Provinsi Papua Tengah",
  "papuapegununganprov": "Provinsi Papua Pegunungan",
  "papuabaratdayaprov": "Provinsi Papua Barat Daya"
};

// 3. Parser Otomatis Domain Pemerintah
export function parseGovEmailDomain(email: string): GovDomainInfo | null {
  if (!email || !email.includes("@")) return null;
  const domain = email.toLowerCase().split("@")[1]?.trim();
  if (!domain) return null;

  // Cek jika domain kemdikbud / nasional
  for (const [natDomain, info] of Object.entries(NATIONAL_DOMAINS)) {
    if (domain === natDomain || domain.endsWith(`.${natDomain}`)) {
      return info;
    }
  }

  if (!domain.endsWith(".go.id")) return null;

  // Bersihkan ekstensi .go.id
  // Contoh: disdik.malangkab.go.id -> ["disdik", "malangkab"]
  // Contoh: disdik.malangkota.go.id -> ["disdik", "malangkota"]
  // Contoh: surabaya.go.id -> ["surabaya"]
  const parts = domain.replace(/\.go\.id$/, "").split(".");
  const mainPart = parts[parts.length - 1]; // kata kunci utama sebelum .go.id

  // A. Cek apakah Tingkat Provinsi
  if (PROVINCE_KEYS[mainPart] || mainPart.endsWith("prov")) {
    const provName =
      PROVINCE_KEYS[mainPart] ||
      `Provinsi ${capitalize(mainPart.replace(/prov$/, ""))}`;
    return {
      role: "dinas_provinsi",
      regionName: provName,
      levelTitle: "Dinas Pendidikan Provinsi",
      jurisdictionScope: "Agregasi Mutu Antar Kab/Kota se-Provinsi (Semua Jenjang: SD, SMP, SMA, SMK)"
    };
  }

  // B. Pembedaan Tegas: Kabupaten (dinas_kab) vs Kota (dinas_kota)
  // Contoh kasus nyata: malangkab (Kab. Malang) vs malangkota / kotamalang / surabaya (Kota)
  let cleanRegionName = mainPart;
  let isKabupaten = false;

  if (
    cleanRegionName.endsWith("kab") ||
    cleanRegionName.startsWith("kab") ||
    parts.some((p) => p === "kab" || p.endsWith("kab"))
  ) {
    isKabupaten = true;
    cleanRegionName = cleanRegionName.replace(/^kab/, "").replace(/kab$/, "");
  } else if (cleanRegionName.startsWith("kota") || cleanRegionName.endsWith("kota")) {
    isKabupaten = false;
    cleanRegionName = cleanRegionName.replace(/^kota/, "").replace(/kota$/, "");
  } else {
    // Pola nama kota tanpa imbuhan (seperti surabaya, semarang, bandung, denpasar)
    // Standar default adalah Kota kecuali tertera kata "kab"
    isKabupaten = false;
  }

  const formattedName = isKabupaten
    ? `Kabupaten ${capitalize(cleanRegionName)}`
    : `Kota ${capitalize(cleanRegionName)}`;

  return {
    role: isKabupaten ? "dinas_kab" : "dinas_kota",
    regionName: formattedName,
    levelTitle: isKabupaten ? "Dinas Pendidikan Kabupaten" : "Dinas Pendidikan Kota",
    jurisdictionScope: `Seluruh Satuan Pendidikan di ${formattedName} (PAUD, SD, SMP, SMA, SMK)`
  };
}

function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}
