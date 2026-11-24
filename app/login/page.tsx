"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, GraduationCap, Building2, Landmark, Sparkles, ArrowRight } from "lucide-react";
import { useAnalyticsAuth } from "@/contexts/analytics-auth-context";
import { ROLE_LABELS } from "@/types/auth-roles";
import { toast } from "sonner";
import ReCAPTCHA from "react-google-recaptcha";

function LoginFormInner() {
  const { user, role, login, loginWithGoogle, isLoading } = useAnalyticsAuth();
  const [formData, setFormData] = useState({
    emailOrUsername: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const isRecaptchaConfigured = Boolean(recaptchaSiteKey && recaptchaSiteKey.length > 5);

  // Jika sudah login, langsung alihkan ke halaman dashboard sesuai role
  useEffect(() => {
    if (!isLoading && user) {
      const targetPath = ROLE_LABELS[role]?.homePath || "/dashboard/teacher";
      router.replace(targetPath);
    }
  }, [isLoading, user, role, router]);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    const roleParam = searchParams.get("role");

    if (errorParam === "unauthorized") {
      const msg = roleParam
        ? `Akses ditolak: Akun Anda memiliki role '${roleParam}'. Hanya akun dengan role Guru, Pengelola Sekolah, atau Dinas Pendidikan yang diizinkan.`
        : "Akses ditolak: Hanya akun dengan role Guru, Pengelola Sekolah, atau Dinas Pendidikan yang diizinkan masuk.";
      setErrorMsg(msg);
      toast.error(msg);
    } else if (errorParam === "auth_code_error") {
      setErrorMsg("Gagal melakukan autentikasi Google. Silakan coba lagi.");
    }
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const emailOrUsername = (formData.emailOrUsername || emailInputRef.current?.value || "").trim();
    const password = formData.password || passwordInputRef.current?.value || "";

    if (!emailOrUsername || !password) {
      setErrorMsg("Email/Username dan Password wajib diisi.");
      return;
    }

    if (isRecaptchaConfigured && !captchaToken) {
      setErrorMsg("Silakan selesaikan verifikasi reCAPTCHA terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(emailOrUsername, password);
      toast.success("Berhasil masuk.");
    } catch (err: any) {
      console.error("[Login Error]:", err);
      const message = err.message || "Gagal masuk. Periksa kembali email/username dan password Anda.";
      setErrorMsg(message);
      toast.error(message);
      if (isRecaptchaConfigured) {
        setCaptchaToken(null);
        recaptchaRef.current?.reset();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
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
  };

  // Helper login demo cepat untuk testing
  const handleQuickDemo = async (roleType: "teacher" | "school_admin" | "dinas_kota") => {
    let email = "rahmat.guru@gameforsmart.com";
    if (roleType === "school_admin") email = "hendro.kepsek@gameforsmart.com";
    if (roleType === "dinas_kota") email = "pengawas.disdik@gameforsmart.com";

    setFormData({
      emailOrUsername: email,
      password: "demo12345"
    });
    setIsSubmitting(true);
    try {
      await login(email, "demo12345");
      toast.success(`Berhasil masuk sebagai ${roleType}.`);
    } catch (err: any) {
      toast.error(err.message || "Gagal login demo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-3 border-orange-500 border-t-transparent" />
          <p className="text-xs text-muted-foreground font-medium">Memeriksa sesi login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50/50 via-background to-orange-100/30 p-4 dark:from-zinc-950 dark:via-background dark:to-zinc-900">
      <Card className="w-full max-w-md rounded-2xl shadow-xl border bg-card/95 backdrop-blur-md">
        <CardHeader className="space-y-3 text-center pb-4 pt-6">
          <div className="flex justify-center">
            <Image
              src="/gameforsmartlogo.png"
              alt="GameForSmart Logo"
              width={160}
              height={48}
              priority
              className="h-10 w-auto object-contain"
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-5 px-6 pb-6">
          {errorMsg && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive dark:bg-destructive/20">
              {errorMsg}
            </div>
          )}

          <Button
            type="button"
            variant="ghost"
            disabled={isSubmitting}
            onClick={handleGoogleSignIn}
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
            <span>Masuk dengan Akun Google</span>
          </Button>

          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-card px-2 text-muted-foreground">Atau</span>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="emailOrUsername" className="text-xs font-semibold">
                Email
              </Label>
              <Input
                ref={emailInputRef}
                id="emailOrUsername"
                name="emailOrUsername"
                type="text"
                placeholder="nama@sekolah.sch.id atau username"
                value={formData.emailOrUsername}
                onChange={handleInputChange}
                required
                className="h-10 rounded-xl text-xs"
                autoComplete="username"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold">
                  Password
                </Label>
              </div>
              <div className="relative">
                <Input
                  ref={passwordInputRef}
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password Anda"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="h-10 rounded-xl pr-10 text-xs"
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-8 w-8 text-muted-foreground hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
            </div>

            {isRecaptchaConfigured && (
              <div className="flex justify-center pt-1">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={recaptchaSiteKey!}
                  onChange={setCaptchaToken}
                  theme="light"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 w-full rounded-xl bg-orange-600 font-semibold text-white hover:bg-orange-700 shadow-sm text-xs gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <div className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <span>Masuk</span>
                  <ArrowRight className="size-3.5" />
                </>
              )}
            </Button>
          </form>

          {/* Hyperlink ke Halaman Registrasi Pendidik */}
          <div className="text-center pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Belum memiliki akun?{" "}
              <Link
                href="/register"
                className="font-semibold text-orange-600 hover:text-orange-700 hover:underline dark:text-orange-400"
              >
                Daftar di sini
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="size-8 animate-spin rounded-full border-3 border-orange-500 border-t-transparent" />
        </div>
      }
    >
      <LoginFormInner />
    </Suspense>
  );
}
