import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { resolveCookieScope } from "@/lib/auth-redirect";
import { normalizeAnalyticsRole, ROLE_LABELS, type AnalyticsUser, DEMO_USERS } from "@/types/auth-roles";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawInput = typeof body.emailOrUsername === "string" 
      ? body.emailOrUsername 
      : typeof body.email === "string" 
        ? body.email 
        : "";
    const password = typeof body.password === "string" ? body.password : "";

    const emailOrUsername = rawInput.trim();
    if (!emailOrUsername || !password) {
      return NextResponse.json(
        { error: "Email/Username dan password wajib diisi." },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const { host, sharedDomain, isSecureContext } = resolveCookieScope(request.headers);

    let sessionCookies: { name: string; value: string; options?: Record<string, unknown> }[] = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key",
      {
        cookieEncoding: "raw",
        cookieOptions: {
          domain: sharedDomain,
          path: "/",
          sameSite: "lax",
          secure: isSecureContext,
        },
        cookies: {
          encode: "tokens-only",
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            sessionCookies = cookiesToSet;
          },
        },
      }
    );

    let emailToUse = emailOrUsername;

    // Jika input bukan email, cari email berdasarkan username di tabel profiles
    if (!emailOrUsername.includes("@")) {
      const { data: profileByUsername, error: usernameError } = await supabase
        .from("profiles")
        .select("email, role")
        .ilike("username", emailOrUsername)
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!usernameError && profileByUsername?.email) {
        emailToUse = profileByUsername.email;
      }
    }

    // Coba sign in dengan Supabase Auth
    let authData: any = null;
    let authError: any = null;

    try {
      const res = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password
      });
      authData = res.data;
      authError = res.error;
    } catch (err: any) {
      authError = err;
    }

    // Jika autentikasi database gagal, periksa apakah pengguna menggunakan akun demo
    if (authError || !authData?.user) {
      // Cek demo accounts
      const lower = emailOrUsername.toLowerCase();
      let matchedDemoUser: AnalyticsUser | null = null;
      if (lower.includes("guru") || lower.includes("teacher") || lower === "rahmat.guru@gameforsmart.com") {
        matchedDemoUser = DEMO_USERS.teacher;
      } else if (lower.includes("sekolah") || lower.includes("school") || lower.includes("principal")) {
        matchedDemoUser = DEMO_USERS.school_admin;
      } else if (lower.includes("dinas") || lower.includes("disdik")) {
        matchedDemoUser = DEMO_USERS.dinas_kota;
      }

      if (matchedDemoUser && password === "demo12345") {
        const demoJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(
          JSON.stringify({
            sub: matchedDemoUser.id,
            email: matchedDemoUser.email,
            role: matchedDemoUser.role,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 604800
          })
        )}.DEMO_SIGNATURE`;

        const homePath = ROLE_LABELS[matchedDemoUser.role].homePath;
        const response = NextResponse.json({
          success: true,
          user: matchedDemoUser,
          role: matchedDemoUser.role,
          homePath,
          accessToken: demoJwt
        });

        // Simpan token JWT di cookie persis seperti di gameforsmartNewUI
        response.cookies.set("auth-token", demoJwt, {
          path: "/",
          sameSite: "lax",
          secure: isSecureContext,
          maxAge: 604800,
          httpOnly: false,
          ...(sharedDomain && { domain: sharedDomain })
        });

        response.cookies.set("sb-access-token", demoJwt, {
          path: "/",
          sameSite: "lax",
          secure: isSecureContext,
          maxAge: 604800,
          httpOnly: false,
          ...(sharedDomain && { domain: sharedDomain })
        });

        response.cookies.set("user-role", matchedDemoUser.role, {
          path: "/",
          sameSite: "lax",
          secure: isSecureContext,
          maxAge: 604800,
          httpOnly: false,
          ...(sharedDomain && { domain: sharedDomain })
        });

        return response;
      }

      return NextResponse.json(
        { error: authError?.message || "Email/username atau password salah." },
        { status: 401 }
      );
    }

    // Ambil data profil dari database Supabase
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, auth_user_id, username, fullname, nickname, email, avatar_url, role, organization, city_id, state_id, country_id")
      .eq("auth_user_id", authData.user.id)
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: "Profil pengguna tidak ditemukan di database." },
        { status: 404 }
      );
    }

    // Validasi izin akses role
    const targetRole = normalizeAnalyticsRole(profile.role);
    if (!targetRole) {
      await supabase.auth.signOut();
      return NextResponse.json(
        {
          error: `Akses ditolak: Akun Anda memiliki role '${profile.role || "user"}'. Hanya akun dengan role Guru, Pengelola Sekolah, atau Dinas Pendidikan yang diizinkan.`
        },
        { status: 403 }
      );
    }

    const analyticsUser: AnalyticsUser = {
      id: profile.id,
      authUserId: profile.auth_user_id || authData.user.id,
      username: profile.username || "pengguna",
      fullname: profile.fullname || profile.nickname || profile.username || "Pengguna Analitik",
      email: profile.email || authData.user.email || "",
      avatarUrl: profile.avatar_url || null,
      role: targetRole,
      scope: {
        schoolName: profile.organization || undefined,
        assignedGroupIds: []
      }
    };

    const homePath = ROLE_LABELS[targetRole].homePath;
    const jwtAccessToken = authData.session?.access_token || "";

    const response = NextResponse.json({
      success: true,
      user: analyticsUser,
      role: targetRole,
      homePath,
      accessToken: jwtAccessToken,
      refreshToken: authData.session?.refresh_token || null
    });

    // 1. Tulis cookies standar Supabase SSR (encode: "tokens-only")
    for (const { name, value, options } of sessionCookies) {
      response.cookies.set(name, value, {
        ...options,
        path: typeof options?.path === "string" ? options.path : "/",
        sameSite: "lax",
        secure: isSecureContext,
        ...(sharedDomain && { domain: sharedDomain })
      });
    }

    // 2. Tulis cookie JWT `auth-token` dan `sb-access-token` secara eksplisit
    if (jwtAccessToken) {
      response.cookies.set("auth-token", jwtAccessToken, {
        path: "/",
        sameSite: "lax",
        secure: isSecureContext,
        maxAge: authData.session?.expires_in || 604800,
        httpOnly: false,
        ...(sharedDomain && { domain: sharedDomain })
      });

      response.cookies.set("sb-access-token", jwtAccessToken, {
        path: "/",
        sameSite: "lax",
        secure: isSecureContext,
        maxAge: authData.session?.expires_in || 604800,
        httpOnly: false,
        ...(sharedDomain && { domain: sharedDomain })
      });
    }

    // 3. Tulis cookie `user-role` untuk kemudahan middleware & server components
    response.cookies.set("user-role", targetRole, {
      path: "/",
      sameSite: "lax",
      secure: isSecureContext,
      maxAge: authData.session?.expires_in || 604800,
      httpOnly: false,
      ...(sharedDomain && { domain: sharedDomain })
    });

    // 4. Bersihkan varian host-only basi bila di shared domain
    if (sharedDomain) {
      for (const { name } of sessionCookies) {
        response.headers.append("set-cookie", `${name}=; Path=/; Max-Age=0; SameSite=Lax`);
      }
      response.headers.append("set-cookie", "auth-token=; Path=/; Max-Age=0; SameSite=Lax");
      response.headers.append("set-cookie", "sb-access-token=; Path=/; Max-Age=0; SameSite=Lax");
    }

    return response;
  } catch (err: any) {
    console.error("[api/auth/login] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Terjadi kesalahan pada server saat login." },
      { status: 500 }
    );
  }
}

