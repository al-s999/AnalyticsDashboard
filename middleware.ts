import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lewati static assets, _next, favicon, gambar, dan api routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|css|js)$/)
  ) {
    return NextResponse.next();
  }

  const authToken = request.cookies.get("auth-token")?.value;
  const userRole = request.cookies.get("user-role")?.value;

  // Cek apakah ada cookie sesi Supabase (`sb-*-auth-token*`)
  const hasSupabaseCookie = request.cookies.getAll().some(
    (c) => (c.name.startsWith("sb-") && c.name.includes("auth-token")) || c.name === "sb-access-token"
  );

  const isAuthenticated = Boolean(authToken || hasSupabaseCookie);

  // 1. Rute Root `/` -> langsung masuk ke login jika belum login, atau ke dashboard role
  if (pathname === "/") {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (userRole === "school_admin") {
      return NextResponse.redirect(new URL("/dashboard/school", request.url));
    } else if (userRole?.startsWith("dinas")) {
      return NextResponse.redirect(new URL("/dashboard/dinas", request.url));
    } else {
      return NextResponse.redirect(new URL("/dashboard/teacher", request.url));
    }
  }

  // 2. Rute `/dashboard` index -> redirect ke homePath role atau `/login`
  if (pathname === "/dashboard") {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (userRole === "school_admin") {
      return NextResponse.redirect(new URL("/dashboard/school", request.url));
    } else if (userRole?.startsWith("dinas")) {
      return NextResponse.redirect(new URL("/dashboard/dinas", request.url));
    } else {
      return NextResponse.redirect(new URL("/dashboard/teacher", request.url));
    }
  }

  // 3. Rute yang membutuhkan login `/dashboard/*`
  if (pathname.startsWith("/dashboard/")) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Role-based route access control
    if (userRole) {
      if (pathname.startsWith("/dashboard/teacher") && userRole !== "teacher") {
        const dest = userRole === "school_admin" ? "/dashboard/school" : "/dashboard/dinas";
        return NextResponse.redirect(new URL(dest, request.url));
      }
      if (pathname.startsWith("/dashboard/school") && userRole !== "school_admin") {
        const dest = userRole === "teacher" ? "/dashboard/teacher" : "/dashboard/dinas";
        return NextResponse.redirect(new URL(dest, request.url));
      }
      if (pathname.startsWith("/dashboard/dinas") && !userRole.startsWith("dinas")) {
        const dest = userRole === "school_admin" ? "/dashboard/school" : "/dashboard/teacher";
        return NextResponse.redirect(new URL(dest, request.url));
      }
    }
  }

  // 4. Rute `/login` -> jika sudah terotentikasi, langsung arahkan ke dashboard
  if (pathname === "/login" && isAuthenticated && userRole) {
    if (userRole === "school_admin") {
      return NextResponse.redirect(new URL("/dashboard/school", request.url));
    } else if (userRole?.startsWith("dinas")) {
      return NextResponse.redirect(new URL("/dashboard/dinas", request.url));
    } else {
      return NextResponse.redirect(new URL("/dashboard/teacher", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/dashboard", "/dashboard/:path*"]
};

