/**
 * Helper validasi verifikasi domain dan kredensial untuk registrasi AnalyticsDashboard.
 */

// 1. Domain Guru Resmi Kemendikbud
export const TEACHER_OFFICIAL_DOMAINS = [
  "belajar.id",
  "guru.sd.belajar.id",
  "guru.smp.belajar.id",
  "guru.sma.belajar.id",
  "guru.smk.belajar.id",
  "guru.paud.belajar.id",
  "admin.sd.belajar.id",
  "admin.smp.belajar.id",
  "admin.sma.belajar.id",
  "admin.smk.belajar.id",
  "admin.belajar.id",
];

export function isTeacherOfficialEmail(email: string): boolean {
  if (!email || !email.includes("@")) return false;
  const domain = email.toLowerCase().split("@")[1]?.trim();
  if (!domain) return false;

  return TEACHER_OFFICIAL_DOMAINS.some(
    (d) => domain === d || domain.endsWith(`.${d}`)
  );
}

// 2. Domain Resmi Sekolah (.sch.id)
export function isSchoolOfficialEmail(email: string): boolean {
  if (!email || !email.includes("@")) return false;
  const domain = email.toLowerCase().split("@")[1]?.trim();
  if (!domain) return false;

  return domain.endsWith(".sch.id") || domain.endsWith(".ac.id");
}

// 3. Domain Resmi Pemerintahan (.go.id / kemdikbud)
export function isDinasOfficialEmail(email: string): boolean {
  if (!email || !email.includes("@")) return false;
  const domain = email.toLowerCase().split("@")[1]?.trim();
  if (!domain) return false;

  return (
    domain.endsWith(".go.id") ||
    domain === "kemdikbud.go.id" ||
    domain.endsWith(".kemdikbud.go.id")
  );
}

// 4. Validasi format NUPTK (16 digit angka)
export function isValidNuptk(nuptk: string): boolean {
  if (!nuptk) return false;
  const cleaned = nuptk.trim().replace(/\D/g, "");
  return cleaned.length === 16;
}

// 5. Validasi Kode Registrasi Sekolah (School Passcode)
// Contoh kode sekolah terdaftar atau format khusus "SCH-<NPSN>-<PIN>" atau token min 6 karakter
export function isValidSchoolPasscode(passcode: string): boolean {
  if (!passcode) return false;
  const trimmed = passcode.trim();
  return trimmed.length >= 4;
}

