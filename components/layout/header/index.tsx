"use client";

import { PanelLeftIcon, HelpCircle } from "lucide-react";
import { usePathname } from "next/navigation";

import { Separator } from "@/components/ui/separator";
import Notifications from "@/components/layout/header/notifications";
import Search from "@/components/layout/header/search";
import ThemeSwitch from "@/components/layout/header/theme-switch";
import UserMenu from "@/components/layout/header/user-menu";
import LanguageSwitch from "@/components/layout/header/language-switch";
import { ThemeCustomizerPanel } from "@/components/theme-customizer";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import NotificationBell from "./NotificationBell";

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();
  const pathname = usePathname();

  const handleHelpClick = () => {
    const baseUrl = "https://fumadocs-gfs-user.vercel.app";

    // Mapping from app routes to fumadocs documentation paths
    const routeToDocsMap: Record<string, string> = {
      "/dashboard":     "/docs/app/dashboard",
      "/evaluation":    "/docs/app/evaluation",
      "/history":       "/docs/app/history",
      "/quiz":          "/docs/app/quiz",
      "/friends":       "/docs/akun/friends",
      "/groups":        "/docs/akun/groups",
      "/profile":       "/docs/akun/profil",
      "/notifications": "/docs/akun/notifikasi",
    };

    // Find the best matching docs path by checking prefixes (longest match first)
    const sortedRoutes = Object.keys(routeToDocsMap).sort((a, b) => b.length - a.length);
    const matchedRoute = sortedRoutes.find((route) => pathname.startsWith(route));
    const docsPath = matchedRoute ? routeToDocsMap[matchedRoute] : "/docs/app";

    window.open(`${baseUrl}${docsPath}`, "_blank");
  };

  return (
    <header className="bg-background/80 sticky top-0 z-50 flex h-(--header-height) shrink-0 items-center gap-2 border-b backdrop-blur-md transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) dark:bg-zinc-950/80">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2">
        <Button onClick={toggleSidebar} size="icon" variant="ghost">
          <PanelLeftIcon />
        </Button>

        <div className="ml-auto rtl:mr-auto rtl:ml-0 flex items-center gap-2">
          <ThemeSwitch />
          <NotificationBell />
          <Button variant="ghost" size="icon" className="relative group/help" onClick={handleHelpClick}>
            <HelpCircle className="h-[1.2rem] w-[1.2rem]" />
          </Button>
          <LanguageSwitch />
          <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
