import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getSharedCookieDomain,
  isSecureAuthHost,
  getRequestHost
} from "@/lib/auth-redirect";
import { normalizeAnalyticsRole, ROLE_LABELS } from "@/types/auth-roles";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const host = getRequestHost(request.headers, request.url);
  const sharedDomain = getSharedCookieDomain(host);
  const isSecureContext = isSecureAuthHost(host);

  const fallbackOrigin =
    process.env.NEXT_PUBLIC_APP_URL ||
    (host ? `http://${host}` : "http://localhost:3000");

  const publicOrigin = (() => {
    const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    if (host) {
      return `${forwardedProto ?? (isSecureContext ? "https" : "http")}://${host}`;
    }
    return fallbackOrigin;
  })();

  if (!code) {
    return NextResponse.redirect(`${publicOrigin}/login?error=auth_code_missing`);
  }

  const cookieStore = await cookies();
  let sessionCookies: { name: string; value: string; options?: Record<string, unknown> }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieEncoding: "raw",
      cookies: {
        encode: "tokens-only",
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          sessionCookies = cookiesToSet;
        }
      }
    }
  );

  const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !exchangeData?.user) {
    console.error("[auth/callback] exchangeCodeForSession failed:", exchangeError?.message);
    return NextResponse.redirect(`${publicOrigin}/login?error=auth_code_error`);
  }

  // Verifikasi role dari tabel profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("auth_user_id", exchangeData.user.id)
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  const targetRole = normalizeAnalyticsRole(profile?.role);

  if (!targetRole) {
    console.warn(`[auth/callback] Akses ditolak: role '${profile?.role}' bukan role pendidik/pengelola.`);
    // Sign out akun yang tidak berhak
    await supabase.auth.signOut();
    return NextResponse.redirect(
      `${publicOrigin}/login?error=unauthorized&role=${encodeURIComponent(profile?.role || "user")}`
    );
  }

  // Arahkan ke dashboard sesuai role
  const destinationPath = ROLE_LABELS[targetRole].homePath;
  const response = NextResponse.redirect(`${publicOrigin}${destinationPath}`);

  // Tulis session cookies
  for (const { name, value, options } of sessionCookies) {
    response.cookies.set(name, value, {
      ...options,
      path: typeof options?.path === "string" ? options.path : "/",
      secure: isSecureContext,
      sameSite: "lax" as const,
      ...(sharedDomain && { domain: sharedDomain })
    });
  }

  // Tulis cookie auth-token JWT dan user-role
  const jwtToken = exchangeData.session?.access_token;
  if (jwtToken) {
    response.cookies.set("auth-token", jwtToken, {
      path: "/",
      sameSite: "lax",
      secure: isSecureContext,
      maxAge: exchangeData.session?.expires_in || 604800,
      httpOnly: false,
      ...(sharedDomain && { domain: sharedDomain })
    });

    response.cookies.set("sb-access-token", jwtToken, {
      path: "/",
      sameSite: "lax",
      secure: isSecureContext,
      maxAge: exchangeData.session?.expires_in || 604800,
      httpOnly: false,
      ...(sharedDomain && { domain: sharedDomain })
    });
  }

  response.cookies.set("user-role", targetRole, {
    path: "/",
    sameSite: "lax",
    secure: isSecureContext,
    maxAge: exchangeData.session?.expires_in || 604800,
    httpOnly: false,
    ...(sharedDomain && { domain: sharedDomain })
  });

  return response;
}

