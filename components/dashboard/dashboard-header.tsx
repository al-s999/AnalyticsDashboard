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
  LogOut,
  ChevronDown,
  User
} from "lucide-react";
import ThemeSwitch from "@/components/layout/header/theme-switch";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function DashboardHeader() {
  const { user, role, logout } = useAnalyticsAuth();

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b bg-background/95 px-4 sm:px-6 backdrop-blur-md shrink-0">
      {/* Sidebar Toggle & Mobile Brand */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted" />
        <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
          <Image
            src="/gameforsmartlogo.png"
            alt="GameForSmart"
            width={120}
            height={32}
            className="h-7 w-auto object-contain"
          />
        </Link>
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
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-xs font-semibold">{user?.fullname}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => logout()}
              className="text-destructive focus:text-destructive cursor-pointer text-xs flex items-center gap-2"
            >
              <LogOut className="size-3.5" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
