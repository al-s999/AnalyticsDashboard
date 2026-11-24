"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAnalyticsAuth } from "@/contexts/analytics-auth-context";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  BarChart3,
  TrendingUp,
  School,
  MapPin,
  FileSpreadsheet,
  Award,
  Sparkles,
  BookOpen
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function DashboardSidebar() {
  const pathname = usePathname();
  const { role, user } = useAnalyticsAuth();

  const getNavItems = () => {
    switch (role) {
      case "teacher":
      case "guru" as any:
        return [
          {
            title: "Ringkasan Kelas",
            href: "/dashboard/teacher",
            icon: LayoutDashboard,
          },
          {
            title: "Grup & Murid",
            href: "/dashboard/teacher/groups",
            icon: Users
          },
          {
            title: "Penugasan Task",
            href: "/dashboard/teacher/tasks",
            icon: CheckSquare
          },
          {
            title: "Analitik 3 Pilar",
            href: "/dashboard/teacher/analytics",
            icon: BarChart3
          }
        ];
      case "school_admin":
      case "pengelola_sekolah" as any:
        return [
          {
            title: "Ringkasan Sekolah",
            href: "/dashboard/school",
            icon: School,
            badge: user?.scope.npsn || "NPSN"
          },
          {
            title: "Benchmark Antarkelas",
            href: "/dashboard/school/benchmark",
            icon: TrendingUp
          },
          {
            title: "Ketuntasan Kompetensi",
            href: "/dashboard/school/competencies",
            icon: Award
          }
        ];
      case "dinas_kab":
      case "dinas_kota":
      case "dinas_provinsi":
      case "dinas_nasional":
      default:
        return [
          {
            title: "Peta Mutu Wilayah",
            href: "/dashboard/dinas",
            icon: MapPin,
            badge: role === "dinas_nasional" ? "Nasional" : role === "dinas_provinsi" ? "Provinsi" : "Daerah"
          },
          {
            title: "Daftar Sekolah",
            href: "/dashboard/dinas/schools",
            icon: School
          },
          {
            title: "Kesiapan Ujian Wilayah",
            href: "/dashboard/dinas/readiness",
            icon: TrendingUp
          }
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 shrink-0 border-r bg-muted/20 hidden md:flex flex-col justify-between p-4">
      <div className="space-y-6">
        {/* Navigation Section */}
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors ${isActive
                  ? "bg-orange-600 text-white shadow-xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="size-4 shrink-0" />
                  <span>{item.title}</span>
                </div>
                {item.badge && (
                  <Badge
                    variant={isActive ? "secondary" : "outline"}
                    className={`text-[9px] px-1.5 py-0 ${isActive ? "bg-white/20 text-white border-transparent" : "border-orange-200 text-orange-800 dark:border-zinc-700 dark:text-zinc-300"
                      }`}
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

