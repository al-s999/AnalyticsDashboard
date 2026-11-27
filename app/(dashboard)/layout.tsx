"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAnalyticsAuth } from "@/contexts/analytics-auth-context";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ROLE_LABELS } from "@/types/auth-roles";
import { ShieldAlert, LogOut, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, role, isLoading, accessDenied, deniedRole, logout } = useAnalyticsAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user && !accessDenied) {
      router.replace("/login");
      return;
    }

    if (!isLoading && user) {
      // Role-based protection:
      // Pastikan pengguna hanya mengakses halaman yang sesuai dengan perannya
      const isTeacherRoute = pathname.startsWith("/dashboard/teacher");
      const isSchoolRoute = pathname.startsWith("/dashboard/school");
      const isDinasRoute = pathname.startsWith("/dashboard/dinas");

      if (isTeacherRoute && role !== "teacher") {
        router.replace(ROLE_LABELS[role]?.homePath || "/dashboard/teacher");
      } else if (isSchoolRoute && role !== "school_admin") {
        router.replace(ROLE_LABELS[role]?.homePath || "/dashboard/school");
      } else if (isDinasRoute && !role.startsWith("dinas")) {
        router.replace(ROLE_LABELS[role]?.homePath || "/dashboard/dinas");
      }
    }
  }, [isLoading, user, role, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-3 border-orange-500 border-t-transparent" />
          <p className="text-xs text-muted-foreground font-medium">Memuat sesi analitik...</p>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md rounded-2xl border bg-card p-6 text-center shadow-sm space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-lg font-bold text-foreground">Kamu tidak memiliki akses ini</h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Akun Anda ({deniedRole || "user"}) bukan role untuk Analytics Dashboard. Halaman ini hanya dapat diakses oleh akun Guru, Pengelola Sekolah, atau Dinas Pendidikan.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            <a
              href={process.env.NEXT_PUBLIC_AUTH_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://app.gameforsmart.com"}
              className="w-full sm:w-auto"
            >
              <Button size="sm" className="w-full rounded-xl text-xs gap-1.5 bg-orange-600 hover:bg-orange-700 text-white">
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Kembali ke GameForSmart</span>
              </Button>
            </a>
            <Button
              size="sm"
              variant="outline"
              onClick={() => logout()}
              className="w-full sm:w-auto rounded-xl text-xs gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Keluar Akun</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <DashboardSidebar />
      <SidebarInset className="min-w-0 flex flex-1 flex-col">
        <DashboardHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
