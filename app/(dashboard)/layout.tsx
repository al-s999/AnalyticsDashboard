"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAnalyticsAuth } from "@/contexts/analytics-auth-context";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { ROLE_LABELS } from "@/types/auth-roles";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, role, isLoading } = useAnalyticsAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
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

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader />
      <div className="flex flex-1">
        <DashboardSidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
