import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { resolveCookieScope } from "@/lib/auth-redirect";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const { sharedDomain, isSecureContext } = resolveCookieScope(request.headers);

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

    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch {}

    const response = NextResponse.json({ success: true, message: "Berhasil logout." });

    // Hapus cookies token eksplisit
    const cookiesToClear = ["auth-token", "sb-access-token", "user-role", "auth-redirect"];
    for (const name of cookiesToClear) {
      response.cookies.set(name, "", {
        path: "/",
        maxAge: 0,
        sameSite: "lax",
        secure: isSecureContext,
        ...(sharedDomain && { domain: sharedDomain })
      });
      if (sharedDomain) {
        response.headers.append("set-cookie", `${name}=; Path=/; Max-Age=0; SameSite=Lax`);
      }
    }

    // Hapus session cookies Supabase
    for (const { name } of sessionCookies) {
      response.cookies.set(name, "", {
        path: "/",
        maxAge: 0,
        sameSite: "lax",
        secure: isSecureContext,
        ...(sharedDomain && { domain: sharedDomain })
      });
      if (sharedDomain) {
        response.headers.append("set-cookie", `${name}=; Path=/; Max-Age=0; SameSite=Lax`);
      }
    }

    // Hapus semua cookie yang dimulai dengan "sb-"
    const allCookies = cookieStore.getAll();
    for (const cookie of allCookies) {
      if (cookie.name.startsWith("sb-") || cookie.name.includes("auth-token")) {
        response.cookies.set(cookie.name, "", {
          path: "/",
          maxAge: 0,
          sameSite: "lax",
          secure: isSecureContext,
          ...(sharedDomain && { domain: sharedDomain })
        });
        if (sharedDomain) {
          response.headers.append("set-cookie", `${cookie.name}=; Path=/; Max-Age=0; SameSite=Lax`);
        }
      }
    }

    return response;
  } catch (err: any) {
    console.error("[api/auth/logout] Error:", err);
    return NextResponse.json({ success: true });
  }
}

