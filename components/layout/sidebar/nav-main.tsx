"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar
} from "@/components/ui/sidebar";
import {
  ActivityIcon,
  ArchiveRestoreIcon,
  BadgeDollarSignIcon,
  BrainCircuitIcon,
  BrainIcon,
  Building2Icon,
  CalendarIcon,
  ChartBarDecreasingIcon,
  ChartPieIcon,
  ChevronRight,
  ClipboardCheckIcon,
  ClipboardMinusIcon,
  ComponentIcon,
  CookieIcon,
  FingerprintIcon,
  FolderDotIcon,
  FolderIcon,
  GaugeIcon,
  GraduationCapIcon,
  ImagesIcon,
  KeyIcon,
  MailIcon,
  MessageSquareIcon,
  ProportionsIcon,
  SettingsIcon,
  ShoppingBagIcon,
  SquareCheckIcon,
  SquareKanbanIcon,
  StickyNoteIcon,
  UserIcon,
  UsersIcon,
  WalletMinimalIcon,
  type LucideIcon,
  GithubIcon,
  RedoDotIcon,
  BrushCleaningIcon,
  CreditCardIcon,
  SpeechIcon,
  MessageSquareHeartIcon,
  BookAIcon,
  PuzzleIcon,
  LayoutDashboardIcon,
  HandshakeIcon,
  Users,
  History,
  Gamepad2,
  ChartBar,
  Bell,
  Flag,
  UserCircle2Icon,
  LifeBuoy
} from "lucide-react";
import { FaHeadset } from "@/components/icons/fa-headset";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";

type NavGroup = {
  title: string;
  items: NavItem;
};

type NavItem = {
  title: string;
  href: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  isComing?: boolean;
  isDataBadge?: string;
  isNew?: boolean;
  newTab?: boolean;
  items?: NavItem;
}[];

export const navItems: NavGroup[] = [
  {
    title: "Dashboards",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboardIcon
      },
      {
        title: "Quiz",
        href: "/quiz",
        icon: PuzzleIcon
      },
      {
        title: "Friends",
        href: "/friends",
        icon: HandshakeIcon
      },
      { title: "Groups", href: "/groups", icon: Users },
      { title: "History", href: "/history", icon: Gamepad2 },
      {
        title: "Evaluation",
        href: "/evaluation",
        icon: ChartBar
      },
      {
        title: "Support",
        href: "/support",
        icon: FaHeadset
      }
    ]
  }
];

export function NavMain() {
  const pathname = usePathname();
  const { isMobile } = useSidebar();
  const { t, currentLanguage } = useI18n();

  return (
    <>
      {navItems.map((nav) => (
        <SidebarGroup key={nav.title}>
          {/* <SidebarGroupLabel>{t(`sidebar.${nav.title.toLowerCase()}`)}</SidebarGroupLabel> */}
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              {nav.items.map((item) => {
                // Cek apakah ada sub-item yang sedang aktif
                const isSubItemActive = item.items?.some((sub) => pathname.startsWith(sub.href));
                const isParentActive = pathname === item.href || (pathname.startsWith(item.href + "/"));
                const translatedTitle = t(`sidebar.${item.title.toLowerCase()}`);

                return (
                  <SidebarMenuItem key={item.title}>
                    {Array.isArray(item.items) && item.items.length > 0 ? (
                      <>
                        {/* TAMPILAN SAAT SIDEBAR COLLAPSED (ICON ONLY) */}
                        <div className="hidden group-data-[collapsible=icon]:block">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <SidebarMenuButton
                                tooltip={translatedTitle}
                                className={`sidebar ${isSubItemActive ? "active" : ""}`}>
                                <div 
                                  suppressHydrationWarning
                                  dir={currentLanguage === "ar" ? "rtl" : "ltr"}
                                  className={cn("relative z-10 flex w-full items-center gap-3 group-data-[collapsible=icon]:justify-center",
                                  currentLanguage === "ar" && "text-right")}>
                                  {item.icon && <item.icon />}
                                  <span suppressHydrationWarning className={cn("group-data-[collapsible=icon]:hidden", currentLanguage === "ar" && "w-full text-right")}>{translatedTitle}</span>
                                  <ChevronRight className={cn("transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden", 
                                    currentLanguage === "ar" ? "mr-auto rotate-180" : "ml-auto")} />
                                </div>
                              </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              side={isMobile ? "bottom" : "right"}
                              align={isMobile ? "end" : "start"}
                              className="min-w-48 rounded-lg">
                              <DropdownMenuLabel suppressHydrationWarning>{translatedTitle}</DropdownMenuLabel>
                              {item.items?.map((sub) => {
                                const translatedSubTitle = t(`sidebar.${sub.title.toLowerCase()}`);
                                return (
                                  <DropdownMenuItem
                                    key={sub.title}
                                    asChild
                                    className={cn(
                                      "cursor-pointer transition-all duration-200",
                                      pathname === sub.href || pathname.startsWith(sub.href + "/") ? "sidebar active" : ""
                                    )}>
                                      <a 
                                        suppressHydrationWarning
                                        href={sub.href} 
                                        dir={currentLanguage === "ar" ? "rtl" : "ltr"}
                                        className={cn("relative z-10", currentLanguage === "ar" ? "text-right block w-full" : "")}>
                                        <span suppressHydrationWarning>{translatedSubTitle}</span>
                                      </a>
                                  </DropdownMenuItem>
                                );
                              })}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* TAMPILAN SAAT SIDEBAR EXPANDED */}
                        <Collapsible
                          className="group/collapsible block group-data-[collapsible=icon]:hidden"
                          defaultOpen={!!item.items.find((s) => pathname === s.href || pathname.startsWith(s.href + "/"))}>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              className="sidebar transition-all duration-300"
                              tooltip={translatedTitle}>
                              <div 
                                suppressHydrationWarning
                                dir={currentLanguage === "ar" ? "rtl" : "ltr"}
                                className={cn("relative z-10 flex w-full items-center gap-3 group-data-[collapsible=icon]:justify-center",
                                  currentLanguage === "ar" && "text-right")}>
                                {item.icon && <item.icon />}
                                <span suppressHydrationWarning className={cn("group-data-[collapsible=icon]:hidden", currentLanguage === "ar" && "w-full text-right")}>{translatedTitle}</span>
                                <ChevronRight className={cn("transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden",
                                  currentLanguage === "ar" ? "mr-auto rotate-180" : "ml-auto")} />
                              </div>
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item?.items?.map((subItem, key) => {
                                const translatedSubTitle = t(`sidebar.${subItem.title.toLowerCase()}`);
                                return (
                                  <SidebarMenuSubItem key={key}>
                                    <SidebarMenuSubButton
                                      className={cn(
                                        "sidebar font-semibold transition-all duration-300",
                                        pathname === subItem.href || pathname.startsWith(subItem.href + "/") ? "sidebar active" : ""
                                      )}
                                      isActive={pathname === subItem.href || pathname.startsWith(subItem.href + "/")}
                                      asChild>
                                        <Link
                                          suppressHydrationWarning
                                          href={subItem.href}
                                          target={subItem.newTab ? "_blank" : ""}
                                          dir={currentLanguage === "ar" ? "rtl" : "ltr"}
                                          className={cn("relative z-10 w-full", currentLanguage === "ar" && "text-right block")}>
                                          <span suppressHydrationWarning>{translatedSubTitle}</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                );
                              })}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </Collapsible>
                      </>
                    ) : (
                      /* MENU TUNGGAL (TANPA SUB-MENU) */
                      <SidebarMenuButton
                        className={cn(
                          "sidebar font-semibold transition-all duration-300",
                          isParentActive ? "sidebar active" : ""
                        )}
                        isActive={isParentActive}
                        tooltip={translatedTitle}
                        asChild>
                          <Link
                          suppressHydrationWarning
                          href={item.href}
                          target={item.newTab ? "_blank" : ""}
                          dir={currentLanguage === "ar" ? "rtl" : "ltr"}
                          className={cn("relative z-10 flex w-full items-center gap-3 group-data-[collapsible=icon]:justify-center",
                            currentLanguage === "ar" && "text-right")}>
                          {item.icon && <item.icon />}
                          <span suppressHydrationWarning className={cn("group-data-[collapsible=icon]:hidden", currentLanguage === "ar" && "w-full text-right")}>{translatedTitle}</span>
                        </Link>
                      </SidebarMenuButton>
                    )}

                    {/* BADGE LOGIC */}
                    <div className="pointer-events-none relative z-10">
                      {!!item.isComing && (
                        <SidebarMenuBadge className="peer-hover/menu-button:text-foreground opacity-50">
                          Coming
                        </SidebarMenuBadge>
                      )}
                      {!!item.isNew && (
                        <SidebarMenuBadge className="border border-green-400 text-green-600 peer-hover/menu-button:text-green-600">
                          New
                        </SidebarMenuBadge>
                      )}
                      {!!item.isDataBadge && (
                        <SidebarMenuBadge className="peer-hover/menu-button:text-foreground">
                          {item.isDataBadge}
                        </SidebarMenuBadge>
                      )}
                    </div>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}
