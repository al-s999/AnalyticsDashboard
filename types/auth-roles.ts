export type UserRole =
  | "teacher"
  | "school_admin"
  | "dinas_kab"
  | "dinas_kota"
  | "dinas_provinsi"
  | "dinas_nasional";

export interface RoleScope {
  npsn?: string;
  schoolName?: string;
  district?: string;
  city?: string;
  province?: string;
  assignedGroupIds?: string[];
}

export interface AnalyticsUser {
  id: string;
  authUserId?: string;
  username: string;
  fullname: string;
  email: string;
  avatarUrl?: string | null;
  role: UserRole;
  scope: RoleScope;
}

export const ROLE_LABELS: Record<UserRole, { title: string; badge: string; description: string; homePath: string }> = {
  teacher: {
    title: "Guru Pengampu (Teacher)",
    badge: "Teacher",
    description: "Monitoring kelas dan grup binaan, penugasan materi, dan intervensi remedial per siswa.",
    homePath: "/dashboard/teacher"
  },
  school_admin: {
    title: "Pengelola Satuan Pendidikan (School Admin)",
    badge: "School Admin",
    description: "Monitoring seluruh kelas, jenjang, dan perbandingan performa antarkelas dalam satu sekolah.",
    homePath: "/dashboard/school"
  },
  dinas_kab: {
    title: "Dinas Pendidikan Kabupaten",
    badge: "Dinas Kab",
    description: "Pemetaan mutu dan capaian target kompetensi seluruh sekolah di wilayah kabupaten.",
    homePath: "/dashboard/dinas"
  },
  dinas_kota: {
    title: "Dinas Pendidikan Kota",
    badge: "Dinas Kota",
    description: "Pemetaan mutu dan capaian target kompetensi seluruh sekolah di wilayah kota.",
    homePath: "/dashboard/dinas"
  },
  dinas_provinsi: {
    title: "Dinas Pendidikan Provinsi",
    badge: "Dinas Provinsi",
    description: "Agregasi mutu pendidikan antarkabupaten/kota di bawah yurisdiksi provinsi.",
    homePath: "/dashboard/dinas"
  },
  dinas_nasional: {
    title: "Kementerian Pendidikan Nasional",
    badge: "Kemendikdasmen",
    description: "Pemetaan makro standar kompetensi dan indeks kesiapan ujian tingkat nasional.",
    homePath: "/dashboard/dinas"
  }
};

/**
 * Normalisasi role dari database Supabase (profiles.role) ke UserRole Dashboard Analitik.
 * Standarisasi dalam Bahasa Inggris: teacher, school_admin, dinas_kab, dinas_kota, dinas_provinsi, dinas_nasional.
 * Tetap mendukung alias lama (guru, pengelola_sekolah, dinas_kabkota, dll.) demi backward-compatibility.
 * User biasa/siswa (role: "user", null, dll) akan mengembalikan `null` (akses ditolak).
 */
export function normalizeAnalyticsRole(rawRole: string | null | undefined): UserRole | null {
  if (!rawRole) return null;
  const r = rawRole.trim().toLowerCase();

  // 1. Teacher / Guru
  if (
    [
      "teacher",
      "guru",
      "pendidik",
      "educator",
      "pengajar",
      "instructor"
    ].includes(r)
  ) {
    return "teacher";
  }

  // 2. School Admin / Pengelola Sekolah / Principal
  if (
    [
      "school_admin",
      "school-admin",
      "pengelola_sekolah",
      "principal",
      "kepala_sekolah",
      "kepsek",
      "school",
      "schooladmin"
    ].includes(r)
  ) {
    return "school_admin";
  }

  // 3. Dinas Pendidikan Kabupaten
  if (
    [
      "dinas_kab",
      "dinas_kabupaten",
      "disdik_kab",
      "disdik_kabupaten"
    ].includes(r)
  ) {
    return "dinas_kab";
  }

  // 4. Dinas Pendidikan Kota
  if (
    [
      "dinas_kota",
      "disdik_kota"
    ].includes(r)
  ) {
    return "dinas_kota";
  }

  // 5. Dinas Pendidikan Kab/Kota (legacy) -> dinas_kab
  if (
    [
      "dinas_kabkota",
      "disdik_kabkota"
    ].includes(r)
  ) {
    return "dinas_kab";
  }

  // 6. Dinas Pendidikan Provinsi
  if (
    [
      "dinas_provinsi",
      "dinas_prov",
      "disdik_provinsi",
      "disdik_prov"
    ].includes(r)
  ) {
    return "dinas_provinsi";
  }

  // 7. Dinas Pendidikan Nasional / Kemendikdasmen
  if (
    [
      "dinas_nasional",
      "kemendikbud",
      "kemendikdasmen",
      "nasional",
      "kementerian"
    ].includes(r)
  ) {
    return "dinas_nasional";
  }

  // Fallback prefix dinas -> dinas_kab
  if (r === "dinas" || r.startsWith("dinas_") || r.startsWith("disdik_")) {
    return "dinas_kab";
  }

  // 8. Admin Sistem / Internal GameForSmart Management -> Izinkan akses analitik (default: teacher)
  if (["super_admin", "admin_support", "admin", "manager", "owner", "gm"].includes(r)) {
    return "teacher";
  }

  // Role lainnya (seperti "user", "student", "siswa", "player") -> DITOLAK
  return null;
}

export function isAllowedAnalyticsRole(rawRole: string | null | undefined): boolean {
  return normalizeAnalyticsRole(rawRole) !== null;
}

export const DEMO_USERS: Record<UserRole, AnalyticsUser> = {
  teacher: {
    id: "demo-teacher-01",
    username: "guru_rahmat",
    fullname: "Rahmat Hidayat, S.Pd.",
    email: "rahmat.guru@gameforsmart.com",
    avatarUrl: "/avatars/teacher.png",
    role: "teacher",
    scope: {
      npsn: "20532247",
      schoolName: "SMAN 1 SURABAYA",
      city: "Kota Surabaya",
      province: "Prov. Jawa Timur",
      assignedGroupIds: ["grp-10a-mat", "grp-11ipa-mat"]
    }
  },
  school_admin: {
    id: "demo-principal-01",
    username: "kepsek_sman1sby",
    fullname: "Dra. Hj. Siti Aminah, M.Pd.",
    email: "kepsek@sman1surabaya.sch.id",
    avatarUrl: "/avatars/principal.png",
    role: "school_admin",
    scope: {
      npsn: "20532247",
      schoolName: "SMAN 1 SURABAYA",
      city: "Kota Surabaya",
      province: "Prov. Jawa Timur"
    }
  },
  dinas_kab: {
    id: "demo-disdik-kab-01",
    username: "disdik_sidoarjo",
    fullname: "Dinas Pendidikan Kabupaten Sidoarjo",
    email: "kurikulum@disdik.sidoarjokab.go.id",
    role: "dinas_kab",
    scope: {
      city: "Kabupaten Sidoarjo",
      province: "Prov. Jawa Timur"
    }
  },
  dinas_kota: {
    id: "demo-disdik-kota-01",
    username: "disdik_surabaya",
    fullname: "Dinas Pendidikan Kota Surabaya",
    email: "kurikulum@disdik.surabaya.go.id",
    role: "dinas_kota",
    scope: {
      city: "Kota Surabaya",
      province: "Prov. Jawa Timur"
    }
  },
  dinas_provinsi: {
    id: "demo-disdik-prov-01",
    username: "disdik_jatim",
    fullname: "Dinas Pendidikan Provinsi Jawa Timur",
    email: "sma.smk@disdik.jatimprov.go.id",
    role: "dinas_provinsi",
    scope: {
      province: "Prov. Jawa Timur"
    }
  },
  dinas_nasional: {
    id: "demo-kemendikbud-01",
    username: "kemendikdasmen_pusat",
    fullname: "Direktorat Analitik Mutu Kemendikdasmen",
    email: "analitik@kemdikbud.go.id",
    role: "dinas_nasional",
    scope: {
      province: "Seluruh Indonesia"
    }
  }
};
