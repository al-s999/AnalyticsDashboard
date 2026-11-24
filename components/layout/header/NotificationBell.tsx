"use client";

// ============================================================
// notifications/_components/NotificationBell.tsx
// Bell icon + dropdown untuk header.
// Menggunakan useNotifications hook (shared dengan halaman).
// ============================================================

import { useState, useEffect } from "react";
import Link from "next/link";
import { BellIcon, ClockIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import {
  NotificationTitle,
  NotificationDescription,
  ActionButtons
} from "@/components/NotificationItem";
import { useI18n } from "@/hooks/use-i18n";
import { formatTimeAgo } from "@/lib/utils";

export function NotificationBell() {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const { t, currentLanguage } = useI18n();

  const { notifications, hasUnread, unreadCount, actionLoading, handleAction, handleHeaderOpen } =
    useNotifications("header");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button size="icon" variant="ghost" className="relative">
        <BellIcon />
      </Button>
    );
  }

  return (
    <DropdownMenu onOpenChange={handleHeaderOpen}>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="relative">
          <BellIcon className="animate-tada" />
          {hasUnread && (
            <span className="ring-background absolute top-[8px] right-[9px] block h-[6px] w-[6px] rounded-full bg-red-500 ring-[1.5px] dark:ring-zinc-950" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={isMobile ? "center" : "end"}
        className="ms-4 w-80 max-w-[90vw] overflow-hidden p-0">
        {/* Header */}
        <DropdownMenuLabel className="bg-background dark:bg-muted sticky top-0 z-10 p-0">
          <div className="flex min-w-0 justify-between border-b px-6 py-4">
            <div className="min-w-0 truncate text-sm font-medium">
              {t("common.notifications")}
              {unreadCount > 0 && (
                <span className="ml-1.5 text-xs text-zinc-400">({unreadCount})</span>
              )}
            </div>
            <Button
              variant="link"
              className="relative h-auto shrink-0 p-0 text-xs"
              size="sm"
              asChild>
              <Link href="/notifications">
                {t("notifications.viewAll")}
                {hasUnread && (
                  <span className="bg-destructive absolute -top-1 -right-2 block size-2 shrink-0 rounded-full" />
                )}
              </Link>
            </Button>
          </div>
        </DropdownMenuLabel>

        {/* List (top 5) */}
        <ScrollArea className="h-[350px] w-full [&>div>div]:!block">
          {notifications.length === 0 ? (
            <div className="text-muted-foreground p-6 text-center text-sm">
              {t("notifications.noNotifications")}
            </div>
          ) : (
            notifications.slice(0, 5).map((item) => (
              <DropdownMenuItem
                key={item.id}
                onSelect={(e) => e.preventDefault()}
                className="group relative flex w-full min-w-0 cursor-pointer items-start gap-3 overflow-hidden rounded-none border-b px-4 py-3">
                <div className="flex min-w-0 flex-1 flex-col gap-1 overflow-hidden">
                  <NotificationTitle item={item} />
                  <NotificationDescription item={item} />

                  <ActionButtons
                    item={item}
                    actionLoading={actionLoading}
                    onAction={handleAction}
                    variant="dropdown"
                  />

                  <div className="text-muted-foreground mt-1 flex min-w-0 items-center gap-1 text-xs">
                    <ClockIcon className="size-3 shrink-0" />
                    <span className="truncate">
                      {formatTimeAgo(item.created_at, "long", currentLanguage as any)}
                    </span>
                  </div>
                </div>

                {!item.is_read && (
                  <span className="absolute top-2 right-3 block size-2.5 rounded-full bg-red-500 ring-2 ring-background dark:ring-zinc-950" />
                )}
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NotificationBell;