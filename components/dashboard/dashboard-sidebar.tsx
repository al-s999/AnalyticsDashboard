"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
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
  Award,
  BookOpen
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function DashboardSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { role, user } = useAnalyticsAuth();

  const getNavItems = () => {
    switch (role) {
      case "teacher":
      case "guru" as any:
        return [
          {
            title: "Dashboard",
            href: "/dashboard/teacher",
            icon: LayoutDashboard,
          },
          {
            title: "Siswa",
            href: "/dashboard/teacher/groups",
            icon: Users
          },
          {
            title: "Tugas",
            href: "/dashboard/teacher/tasks",
            icon: CheckSquare
          },
          {
            title: "Analisa",
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
    <Sidebar collapsible="icon" {...props}>
      {/* Header Logo: Menyesuaikan tampilan saat expand vs collapsed (icon) */}
      <SidebarHeader className="border-b h-16 flex items-center justify-center px-4">
        <Link href="/dashboard" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <Image
            src="/logo.png"
            width={32}
            height={32}
            className="size-8 object-contain shrink-0 hidden group-data-[collapsible=icon]:block"
            alt="GameForSmart"
          />
          <Image
            src="/gameforsmartlogo.png"
            width={140}
            height={36}
            className="h-8 w-auto object-contain group-data-[collapsible=icon]:hidden"
            alt="GameForSmart"
          />
        </Link>
      </SidebarHeader>

      {/* Konten Menu Navigasi dengan Tooltip otomatis saat collapsed */}
      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={cn(
                        "h-11 rounded-xl text-sm font-medium transition-all group-data-[collapsible=icon]:justify-center",
                        isActive
                          ? "bg-orange-600 text-white hover:bg-orange-600 hover:text-white dark:bg-orange-600 dark:text-white shadow-xs font-semibold"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Link href={item.href} className="flex items-center gap-3">
                        <Icon className="size-5 shrink-0" />
                        <span className="group-data-[collapsible=icon]:hidden truncate">{item.title}</span>
                        {item.badge && (
                          <Badge
                            variant={isActive ? "secondary" : "outline"}
                            className={cn(
                              "ml-auto text-[10px] px-2 py-0.5 group-data-[collapsible=icon]:hidden",
                              isActive
                                ? "bg-white/20 text-white border-transparent"
                                : "border-orange-200 text-orange-800 dark:border-zinc-700 dark:text-zinc-300"
                            )}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {/* Rail untuk kemudahan resize/toggle */}
      <SidebarRail />
    </Sidebar>
  );
}
