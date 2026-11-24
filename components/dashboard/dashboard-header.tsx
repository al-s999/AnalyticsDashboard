"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useAnalyticsAuth } from "@/contexts/analytics-auth-context";
import { UserRole, ROLE_LABELS } from "@/types/auth-roles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  GraduationCap,
  Building2,
  Landmark,
  LogOut,
  ChevronDown,
  User
} from "lucide-react";
import ThemeSwitch from "@/components/layout/header/theme-switch";

export function DashboardHeader() {
  const { user, role, logout } = useAnalyticsAuth();

  const getRoleIcon = (r: UserRole) => {
    switch (r) {
      case "teacher":
      case "guru" as any:
        return <GraduationCap className="size-4 text-orange-500" />;
      case "school_admin":
      case "pengelola_sekolah" as any:
        return <Building2 className="size-4 text-amber-500" />;
      default:
        return <Landmark className="size-4 text-blue-500" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b bg-background/95 px-4 sm:px-6 backdrop-blur-md">
      {/* Brand & Scope Indicator */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/gameforsmartlogo.png"
            alt="GameForSmart"
            width={140}
            height={40}
            className="h-8 w-auto object-contain"
          />
        </Link>
        <span className="text-muted-foreground hidden sm:inline">|</span>
        <div className="hidden sm:flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 border-orange-200 bg-orange-50/50 text-orange-800 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-300">
            {getRoleIcon(role)}
            <span>{ROLE_LABELS[role].badge}</span>
          </Badge>
          {user?.scope.schoolName && (
            <span className="text-xs font-medium text-muted-foreground">
              {user.scope.schoolName}
            </span>
          )}
          {user?.scope.city && !user?.scope.schoolName && (
            <span className="text-xs font-medium text-muted-foreground">
              Wilayah {user.scope.city}
            </span>
          )}
        </div>
      </div>

      {/* User Profile Menu & Theme Switch */}
      <div className="flex items-center gap-2">
        <ThemeSwitch />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 gap-2 pl-2 pr-2.5">
              <div className="flex size-7 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-800 dark:bg-orange-950 dark:text-orange-300">
                {user?.fullname.charAt(0) || "U"}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-semibold leading-tight line-clamp-1">{user?.fullname}</span>
                <span className="text-[10px] text-muted-foreground leading-tight">{ROLE_LABELS[role].badge}</span>
              </div>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-xs font-semibold">{user?.fullname}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                <div className="pt-1">
                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-normal">
                    {ROLE_LABELS[role].title}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/login" className="flex items-center gap-2 cursor-pointer text-xs">
                <User className="size-3.5" />
                <span>Ganti Akun</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => logout()}
              className="text-destructive focus:text-destructive cursor-pointer text-xs flex items-center gap-2"
            >
              <LogOut className="size-3.5" />
              <span>Keluar (Logout)</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
