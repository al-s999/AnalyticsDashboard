"use client";

import React, { useState, useRef, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReCAPTCHA from "react-google-recaptcha";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  GraduationCap,
  Building2,
  Landmark,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  School as SchoolIcon,
  ShieldCheck,
  KeyRound,
  IdCard,
  AlertCircle
} from "lucide-react";
import { SchoolSelector, SchoolOption } from "@/components/ui/school-selector";
import { toast } from "sonner";
import { useAnalyticsAuth } from "@/contexts/analytics-auth-context";
import { parseGovEmailDomain, GovDomainInfo } from "@/lib/gov-domains";

type RegistrationRole = "teacher" | "school_admin" | "dinas_kota" | "dinas_provinsi";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="size-8 animate-spin rounded-full border-3 border-orange-500 border-t-transparent" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const { loginWithGoogle } = useAnalyticsAuth();

  // Role
  const [selectedRole, setSelectedRole] = useState<RegistrationRole>("teacher");

  // Identitas Dasar
  const [fullname, setFullname] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Sekolah & Wilayah
  const [selectedSchool, setSelectedSchool] = useState<SchoolOption | null>(null);
  const [schoolNameManual, setSchoolNameManual] = useState("");
  const [region, setRegion] = useState("");

  // Dropdown Verifikasi Guru (Default kosong / none, wajib pilih)
  const [teacherVerifMethod, setTeacherVerifMethod] = useState<string>("");
  const [nuptk, setNuptk] = useState("");
  const [schoolCode, setSchoolCode] = useState("");

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const isRecaptchaConfigured = Boolean(recaptchaSiteKey && recaptchaSiteKey.length > 5);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // 1. Validasi dasar
    if (!fullname.trim() || !username.trim() || !email.trim() || !password) {
      setErrorMsg("Harap lengkapi semua data wajib.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Kata sandi minimal 6 karakter.");
      return;
    }

    if (isRecaptchaConfigured && !captchaToken) {
      setErrorMsg("Silakan selesaikan verifikasi reCAPTCHA terlebih dahulu.");
      return;
    }

    const schoolNameToUse = selectedSchool?.name || schoolNameManual.trim();

    // 2. Validasi Khusus Tiap Role
    if (selectedRole === "teacher") {
      if (!schoolNameToUse) {
        setErrorMsg("Harap cari dan pilih sekolah asal Anda.");
        return;
      }

      if (!teacherVerifMethod) {
        setErrorMsg("Harap pilih metode verifikasi guru terlebih dahulu.");
        return;
      }

      if (teacherVerifMethod === "nuptk" && (!nuptk || nuptk.replace(/\D/g, "").length !== 16)) {
        setErrorMsg("Nomor NUPTK harus terdiri dari 16 digit angka yang sah.");
        return;
      }

      if (teacherVerifMethod === "school_code" && (!schoolCode || schoolCode.trim().length < 4)) {
        setErrorMsg("Harap masukkan Kode Undangan Guru yang diberikan pihak sekolah.");
        return;
      }
    }

    if (selectedRole === "school_admin") {
      if (!schoolNameToUse) {
        setErrorMsg("Harap pilih satuan pendidikan (NPSN) yang Anda kelola.");
        return;
      }

      if (!schoolCode || schoolCode.trim().length < 4) {
        setErrorMsg("Harap masukkan Kode Otorisasi Satuan Pendidikan.");
        return;
      }
    }

    if (selectedRole.startsWith("dinas")) {
      const govInfo = parseGovEmailDomain(email);
      if (!govInfo) {
        setErrorMsg("Email Anda harus berupa domain resmi pemerintahan (.go.id atau kemdikbud.go.id).");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const govInfo = selectedRole.startsWith("dinas") ? parseGovEmailDomain(email) : null;
      const roleToSubmit = govInfo ? govInfo.role : selectedRole;
      const regionToSubmit = govInfo ? govInfo.regionName : selectedSchool?.province || undefined;

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullname,
          username,
          email,
          password,
          role: roleToSubmit,
          schoolName: schoolNameToUse,
          npsn: selectedSchool?.npsn || null,
          verificationMethod: teacherVerifMethod,
          nuptk: selectedRole === "teacher" && teacherVerifMethod === "nuptk" ? nuptk : undefined,
          schoolCode: schoolCode.trim() || undefined,
          region: regionToSubmit
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal melakukan pendaftaran.");
      }

      setIsSuccess(true);
      toast.success("Pendaftaran berhasil! Akun resmi Anda telah aktif.");
    } catch (err: any) {
      console.error("[Register Error]:", err);
      setErrorMsg(err.message || "Terjadi kesalahan saat pendaftaran.");
      toast.error(err.message || "Gagal melakukan pendaftaran.");
      if (isRecaptchaConfigured) {
        setCaptchaToken(null);
        recaptchaRef.current?.reset();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50/50 via-background to-orange-100/30 p-4 dark:from-zinc-950 dark:via-background dark:to-zinc-900">
        <Card className="w-full max-w-md rounded-2xl shadow-xl border bg-card/95 p-8 text-center space-y-5">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <CheckCircle2 className="size-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight">Akun Berhasil Didaftarkan!</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Selamat datang di <strong>GameForSmart Analytics Dashboard</strong>. Kredensial Anda telah berhasil diverifikasi dan akun siap digunakan.
            </p>
          </div>
          <Button
            onClick={() => router.push("/login")}
            className="w-full h-10 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs gap-1.5 shadow-sm"
          >
            <span>Masuk Sekarang</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50/50 via-background to-orange-100/30 p-4 py-8 dark:from-zinc-950 dark:via-background dark:to-zinc-900">
      <Card className="w-full max-w-lg rounded-2xl shadow-xl border bg-card/95 backdrop-blur-md">
        <CardHeader className="space-y-3 text-center pb-3 pt-6">
          <div className="flex justify-center">
            <Image
              src="/gameforsmartlogo.png"
              alt="GameForSmart Logo"
              width={160}
              height={48}
              priority
              className="h-9 w-auto object-contain"
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-5 px-6 pb-6">
          {errorMsg && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2 dark:bg-destructive/20">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Tombol Masuk / Daftar dengan Google */}
          <Button
            type="button"
            variant="ghost"
            disabled={isSubmitting}
            onClick={async () => {
              setErrorMsg(null);
              setIsSubmitting(true);
              try {
                await loginWithGoogle();
              } catch (err: any) {
                console.error("[Google Login Error]:", err);
                const message = err.message || "Gagal masuk dengan Google. Silakan coba lagi.";
                setErrorMsg(message);
                toast.error(message);
                setIsSubmitting(false);
              }
            }}
            className="h-9 w-full rounded-xl text-xs gap-2 border hover:bg-muted/50"
          >
            <svg className="size-3.5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign Up with Google</span>
          </Button>

          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or</span>
          </div>

          {/* Pemilihan Peran */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Peran</Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("teacher");
                  setErrorMsg(null);
                }}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${selectedRole === "teacher"
                  ? "border-orange-500 bg-orange-50/70 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 font-semibold shadow-xs"
                  : "border-border hover:bg-muted/50 text-muted-foreground"
                  }`}
              >
                <GraduationCap className="size-5 mb-1 text-orange-500" />
                <span className="text-xs">Guru</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole("school_admin");
                  setErrorMsg(null);
                }}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${selectedRole === "school_admin"
                  ? "border-amber-500 bg-amber-50/70 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 font-semibold shadow-xs"
                  : "border-border hover:bg-muted/50 text-muted-foreground"
                  }`}
              >
                <Building2 className="size-5 mb-1 text-amber-500" />
                <span className="text-xs">Pengelola sekolah</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole("dinas_kota");
                  setErrorMsg(null);
                }}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${selectedRole.startsWith("dinas")
                  ? "border-blue-500 bg-blue-50/70 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-semibold shadow-xs"
                  : "border-border hover:bg-muted/50 text-muted-foreground"
                  }`}
              >
                <Landmark className="size-5 mb-1 text-blue-500" />
                <span className="text-xs">Dinas Pendidikan</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nama Lengkap */}
            <div className="space-y-1.5">
              <Label htmlFor="fullname" className="text-xs font-semibold">
                Nama
              </Label>
              <Input
                id="fullname"
                type="text"
                placeholder="Masukkan Nama Anda"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                required
                className="h-9 rounded-xl text-xs"
              />
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-semibold">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Masukkan Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-9 rounded-xl text-xs"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={
                  selectedRole === "teacher"
                    ? "nama@guru.sma.belajar.id"
                    : selectedRole === "school_admin"
                      ? "kepsek@sekolah.sch.id"
                      : "pejabat@disdik.daerah.go.id"
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-9 rounded-xl text-xs"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-9 rounded-xl pr-9 text-xs"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-0.5 h-8 w-8 text-muted-foreground hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </Button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-xs font-semibold">
                Konfirmasi Password
              </Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Ulangi kata sandi"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-9 rounded-xl text-xs"
              />
            </div>

            {/* Asal Sekolah (Untuk Guru & Pengelola Sekolah) */}
            {(selectedRole === "teacher" || selectedRole === "school_admin") && (
              <div className="space-y-1.5 border-t pt-3">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <SchoolIcon className="size-3.5 text-orange-500" />
                  <span>Nomor Pokok Sekolah Nasional (NPSN)</span>
                </Label>
                <SchoolSelector
                  name="school"
                  label=""
                  placeholder="Ketik 8-digit NPSN atau nama sekolah..."
                  defaultValue={schoolNameManual}
                  onChange={(val) => {
                    setSchoolNameManual(val);
                  }}
                />
              </div>
            )}

            {/* 1. KHUSUS GURU: Dropdown Verifikasi Guru (Default none, tanpa border terpisah) */}
            {selectedRole === "teacher" && (
              <>
                <div className="space-y-1.5 border-t pt-3">
                  <Label htmlFor="teacherVerifMethod" className="text-xs font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5 text-orange-500" />
                    <span>Verifikasi</span>
                  </Label>
                  <Select
                    value={teacherVerifMethod}
                    onValueChange={(val) => {
                      setTeacherVerifMethod(val);
                      setErrorMsg(null);
                    }}
                  >
                    <SelectTrigger id="teacherVerifMethod" className="h-9 w-full rounded-xl text-xs">
                      <SelectValue placeholder="-- Pilih Metode Verifikasi Guru --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nuptk">
                        Nomor NUPTK (16 Digit Angka)
                      </SelectItem>
                      <SelectItem value="school_code">
                        Kode Undangan Guru dari Sekolah
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Input Dinamis Guru */}
                {teacherVerifMethod === "nuptk" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="nuptk" className="text-xs font-semibold flex items-center gap-1">
                      <IdCard className="size-3.5 text-orange-500" />
                      <span>Nomor NUPTK (16 Digit Angka) *</span>
                    </Label>
                    <Input
                      id="nuptk"
                      type="text"
                      maxLength={16}
                      placeholder="Masukkan 16 digit NUPTK Anda"
                      value={nuptk}
                      onChange={(e) => setNuptk(e.target.value.replace(/\D/g, ""))}
                      required
                      className="h-9 rounded-xl text-xs"
                    />
                  </div>
                )}

                {teacherVerifMethod === "school_code" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="schoolCode" className="text-xs font-semibold flex items-center gap-1">
                      <KeyRound className="size-3.5 text-orange-500" />
                      <span>Kode Undangan Guru dari Sekolah *</span>
                    </Label>
                    <Input
                      id="schoolCode"
                      type="text"
                      placeholder="Masukkan kode undangan dari Kepala Sekolah"
                      value={schoolCode}
                      onChange={(e) => setSchoolCode(e.target.value)}
                      required
                      className="h-9 rounded-xl text-xs uppercase"
                    />
                  </div>
                )}
              </>
            )}

            {/* 2. KHUSUS PENGELOLA SEKOLAH: Cuma 1 opsi -> Input Biasa (Tanpa dropdown & tanpa border) */}
            {selectedRole === "school_admin" && (
              <div className="space-y-1.5 border-t pt-3">
                <Label htmlFor="schoolAuthCode" className="text-xs font-semibold flex items-center gap-1">
                  <KeyRound className="size-3.5 text-amber-500" />
                  <span>Kode Otorisasi Satuan Pendidikan *</span>
                </Label>
                <Input
                  id="schoolAuthCode"
                  type="text"
                  placeholder="Masukkan Kode Otorisasi / Registrasi Sekolah"
                  value={schoolCode}
                  onChange={(e) => setSchoolCode(e.target.value)}
                  required
                  className="h-9 rounded-xl text-xs uppercase"
                />
              </div>
            )}

            {/* 3. KHUSUS DINAS PENDIDIKAN: Wilayah & Tingkat Terdeteksi Otomatis (Read-Only) */}
            {selectedRole.startsWith("dinas") && (() => {
              const detectedGov = parseGovEmailDomain(email);
              return (
                <div className="space-y-3 border-t pt-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                      <Landmark className="size-3.5" />
                      <span>Wilayah & Tingkat Yurisdiksi Dinas *</span>
                    </Label>

                    {detectedGov ? (
                      <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 space-y-1.5 dark:border-blue-900/40 dark:bg-blue-950/20">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
                            {detectedGov.regionName}
                          </span>
                          <span className="text-[10px] font-semibold bg-blue-200/70 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 px-2 py-0.5 rounded-full">
                            {detectedGov.levelTitle}
                          </span>
                        </div>
                        <p className="text-[11px] text-blue-700 dark:text-blue-400">
                          Kewenangan Monitoring: <strong>{detectedGov.jurisdictionScope}</strong>
                        </p>
                        <p className="text-[10px] text-muted-foreground pt-0.5">
                          ✓ Wilayah dan tingkat yurisdiksi terkunci otomatis dari domain email <code>@{email.split("@")[1]}</code>.
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed p-3 text-center space-y-1 bg-muted/20">
                        <p className="text-xs font-medium text-muted-foreground">
                          Wilayah otomatis terdeteksi setelah email diisi
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Gunakan alamat email resmi instansi pemerintah (contoh: <code>budi@disdik.surabaya.go.id</code> atau <code>siti@disdik.jatimprov.go.id</code>).
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* reCAPTCHA */}
            {isRecaptchaConfigured && (
              <div className="flex justify-center pt-2">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={recaptchaSiteKey!}
                  onChange={setCaptchaToken}
                  theme="light"
                />
              </div>
            )}

            {/* Tombol Submit */}
            {(() => {
              // Validasi kelengkapan data dasar
              const hasBaseFields =
                Boolean(fullname.trim()) &&
                Boolean(username.trim()) &&
                Boolean(email.trim()) &&
                Boolean(password) &&
                Boolean(confirmPassword) &&
                password === confirmPassword;

              // Validasi spesifik per role
              let hasRoleFields = true;
              if (selectedRole === "teacher") {
                const hasSchool = Boolean(selectedSchool || schoolNameManual.trim());
                const hasVerif =
                  (teacherVerifMethod === "nuptk" && Boolean(nuptk.trim())) ||
                  (teacherVerifMethod === "school_code" && Boolean(schoolCode.trim()));
                hasRoleFields = hasSchool && hasVerif;
              } else if (selectedRole === "school_admin") {
                const hasSchool = Boolean(selectedSchool || schoolNameManual.trim());
                const hasAuthCode = Boolean(schoolCode.trim());
                hasRoleFields = hasSchool && hasAuthCode;
              } else if (selectedRole.startsWith("dinas")) {
                const govInfo = parseGovEmailDomain(email.trim());
                hasRoleFields = Boolean(govInfo);
              }

              const isCaptchaValid = !isRecaptchaConfigured || Boolean(captchaToken);
              const isFormValid = hasBaseFields && hasRoleFields && isCaptchaValid;

              return (
                <Button
                  type="submit"
                  disabled={isSubmitting || !isFormValid}
                  className="h-10 w-full rounded-xl bg-orange-600 font-semibold text-white hover:bg-orange-700 shadow-sm text-xs gap-1.5 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Memproses Pendaftaran...</span>
                    </>
                  ) : (
                    <>
                      <span>Daftar</span>
                      <ArrowRight className="size-3.5" />
                    </>
                  )}
                </Button>
              );
            })()}
          </form>

          {/* Link Kembali ke Login */}
          <div className="text-center pt-1 border-t">
            <p className="text-xs text-muted-foreground">
              Sudah memiliki akun terdaftar?{" "}
              <Link
                href="/login"
                className="font-semibold text-orange-600 hover:text-orange-700 hover:underline dark:text-orange-400"
              >
                Masuk di sini
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
