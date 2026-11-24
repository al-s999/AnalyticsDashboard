"use client";

import { BellIcon, ClockIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect, useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { respondTeamInvite, notifyManagerDeclined, acceptGroupInvite, declineGroupInvite } from "@/app/service/notifications/notificationService";

import { useI18n } from "@/hooks/use-i18n";
import { formatTimeAgo } from "@/lib/utils";

const Notifications = () => {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const { profileId } = useAuth();
  const { t, currentLanguage } = useI18n();
  const [dbNotifications, setDbNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = async (dataItem: any, action: "accepted" | "declined") => {
    if (!profileId) return;
    setActionLoading(dataItem.id);

    try {
      // Team invite: accept langsung diproses di app kompetisi (update
      // profiles.role + kolom competitions + hapus notifikasi undangan),
      // tanpa konfirmasi manager lagi.
      if (dataItem.type === "TEAM_INVITE" && dataItem.content?.competitionId && dataItem.content?.role) {
        if (action === "accepted") {
          const { success, error } = await respondTeamInvite(dataItem.id, "ACCEPT");
          if (!success) throw new Error(error || "Failed to accept team invite");
          setDbNotifications((prev) => prev.filter((notif) => notif.id !== dataItem.id));
          toast.success("Berhasil bergabung dengan tim kompetisi");
        } else {
          const { error: declineError } = await supabase
            .from("notifications")
            .update({ status: "declined" })
            .eq("id", dataItem.id);
          if (declineError) throw declineError;

          setDbNotifications((prev) =>
            prev.map((notif) => (notif.id === dataItem.id ? { ...notif, status: "declined" } : notif))
          );

          await notifyManagerDeclined(
            profileId,
            dataItem.raw_actor_id || dataItem.actor_id,
            dataItem.content.competitionId,
            dataItem.content.role,
            dataItem.content.competitionName
          );
          toast.success("Undangan tim kompetisi ditolak");
        }
        return;
      }

      // Undangan grup: satu RPC atomik di database (member + activity + status).
      if (dataItem.type === "group" && dataItem.raw_from_group_id) {
        if (action === "accepted") {
          const { alreadyMember } = await acceptGroupInvite(
            dataItem.raw_from_group_id,
            dataItem.id
          );

          setDbNotifications((prev) =>
            prev.map((notif) => (notif.id === dataItem.id ? { ...notif, status: "accepted" } : notif))
          );

          if (alreadyMember) {
            toast.info(t("notifications.alreadyMember"));
          } else {
            toast.success(t("notifications.successJoinGroup"));
          }
        } else {
          await declineGroupInvite(dataItem.id);

          setDbNotifications((prev) =>
            prev.map((notif) => (notif.id === dataItem.id ? { ...notif, status: "declined" } : notif))
          );
        }
        return;
      }

      // 1. Update notification status
      const { error: updateError } = await supabase
        .from("notifications")
        .update({ status: action })
        .eq("id", dataItem.id);

      if (updateError) throw updateError;

      // Update UI state
      setDbNotifications((prev) =>
        prev.map((notif) => (notif.id === dataItem.id ? { ...notif, status: action } : notif))
      );

      // 2. Execute logic if accepted
      if (action === "accepted") {
        if (dataItem.type === "sessionGroup" || dataItem.type === "sessionFriend") {
          const code = dataItem.entity_id?.code;
          const application = (dataItem.entity_id?.application || "gameforsmartnewui")
            .toLowerCase()
            .trim();

          if (!code) {
            toast.error(t("notifications.sessionCodeNotFound"));
            return;
          }

          toast.success(t("notifications.redirectingToSession"));

          let targetUrl = "";
          let openInNewTab = false;

          switch (application) {
            case "crazyrace":
              targetUrl = `https://crazyrace.gameforsmart.com/join/${code}`;
              openInNewTab = true;
              break;
            case "memoryquiz":
            case "memory quiz":
            case "memory-game":
            case "memory game":
              targetUrl = `https://memoryquiz.gameforsmart.com/player/${code}/waiting`;
              openInNewTab = true;
              break;
            case "quizrush":
              targetUrl = `https://quizrush.gameforsmart.com/join/${code}`;
              openInNewTab = true;
              break;
            case "space quiz":
            case "spacequiz":
              targetUrl = `https://spacequiz.gameforsmart.com/join/${code}`;
              openInNewTab = true;
              break;
            case "axiom":
              targetUrl = `https://axiom.gameforsmart.com/join/${code}`;
              openInNewTab = true;
              break;
            case "zigma":
              targetUrl = `https://zigma.gameforsmart.com/join/${code}`;
              openInNewTab = true;
              break;
            case "nitroquiz":
              targetUrl = `https://nitroquiz.gameforsmart.com/join/${code}`;
              openInNewTab = true;
              break;
            case "Quiz V2":
            default:
              targetUrl = `https://app.gameforsmart.com/join/${code}`;
              openInNewTab = false;
              break;
          }

          if (openInNewTab) {
            window.open(targetUrl, "_blank");
          } else {
            window.location.href = targetUrl;
          }
        }
      }
    } catch (error: any) {
      console.error("Action error:", error);
      toast.error(error.message || t("common.error"));
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!profileId) return;

    const fetchDatas = async () => {
      setIsLoading(true);
      const { data: notifs, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", profileId)
        .order("created_at", { ascending: false });

      if (error || !notifs) {
        setIsLoading(false);
        return;
      }

      const actorIds = [...new Set(notifs.map((n) => n.actor_id).filter(Boolean))];
      const profilesMap: Record<string, any> = {};
      if (actorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, nickname, fullname")
          .in("id", actorIds);
        if (profiles) {
          profiles.forEach((p) => {
            profilesMap[p.id] = p;
          });
        }
      }

      const groupIds = [
        ...new Set([
          ...notifs
            .filter((n) => n.type === "group" && n.from_group_id)
            .map((n) => n.from_group_id),
          ...notifs
            .filter((n) => n.type === "sessionGroup" && n.from_group_id)
            .map((n) => n.from_group_id)
        ])
      ];
      const groupsMap: Record<string, any> = {};
      if (groupIds.length > 0) {
        const { data: groups } = await supabase
          .from("groups")
          .select("id, name")
          .in("id", groupIds);
        if (groups) {
          groups.forEach((g) => {
            groupsMap[g.id] = g;
          });
        }
      }

      // Pre-fetch game sessions resolving to quizzes for session types
      const sessionIds = [
        ...new Set(
          notifs
            .filter((n) => (n.type === "sessionGroup" || n.type === "sessionFriend") && n.entity_id)
            .map((n) => n.entity_id)
        )
      ];

      const sessionsMap: Record<string, any> = {};

      if (sessionIds.length > 0) {
        const { data: sessions } = await supabase
          .from("game_sessions")
          .select(`id, game_pin, application, quizzes!game_sessions_quiz_id_fkey(title)`)
          .in("id", sessionIds);

        if (sessions) {
          sessions.forEach((s: any) => {
            const quizData = s.quizzes;
            const title = Array.isArray(quizData) ? quizData[0]?.title : quizData?.title;

            sessionsMap[s.id] = {
              name: title || "Unknown Quiz",
              code: s.game_pin || "N/A",
              application: s.application
            };
          });
        }
      }

      const enriched = notifs.map((n) => {
        const actor = profilesMap[n.actor_id] || {};
        const actorName = actor.nickname || actor.fullname || "User";

        const adapted = {
          id: n.id,
          user_id: n.user_id,
          actor_id: actorName,
          raw_actor_id: n.actor_id,
          type: n.type,
          entity_type: n.entity_type,
          entity_id: n.entity_id,
          from_group_id: n.from_group_id,
          status: n.status,
          content: n.content,
          is_read: n.is_read || false,
          created_at: n.created_at
        };

        if (n.type === "group") {
          adapted.from_group_id = { name: groupsMap[n.from_group_id]?.name || "Unknown Group" };
        } else if (n.type === "sessionFriend" || n.type === "sessionGroup") {
          adapted.entity_id = sessionsMap[n.entity_id] || {
            name: "Unknown Session",
            code: "N/A",
            application: "N/A"
          };

          if (n.type === "sessionGroup" && n.from_group_id) {
            adapted.from_group_id = groupsMap[n.from_group_id]?.name || "Unknown Group";
          }
        }

        return adapted;
      });

      setDbNotifications(enriched);
      setIsLoading(false);
    };

    fetchDatas();

    const channel = supabase
      .channel("header-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profileId}`
        },
        () => {
          fetchDatas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId]);

  const hasUnread = dbNotifications.some((n) => !n.is_read);

  const handleOpenChange = async (open: boolean) => {
    if (open) {
      const top5Unread = dbNotifications.slice(0, 5).filter((n) => !n.is_read);
      if (top5Unread.length > 0) {
        const ids = top5Unread.map((n) => n.id);

        // Optimistic UI update
        setDbNotifications((prev) =>
          prev.map((n) => (ids.includes(n.id) ? { ...n, is_read: true } : n))
        );

        // Background sync to db
        await supabase.from("notifications").update({ is_read: true }).in("id", ids);
      }
    }
  };

  if (!mounted) {
    return (
      <Button size="icon" variant="ghost" className="relative">
        <BellIcon />
      </Button>
    );
  }

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="relative">
          <>
            <BellIcon className="animate-tada" />
            {hasUnread && (
              <span className="ring-background absolute top-[8px] right-[9px] block h-[6px] w-[6px] rounded-full bg-red-500 ring-[1.5px] dark:ring-zinc-950"></span>
            )}
          </>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        collisionPadding={16}
        className="w-[calc(100vw-20px)] max-w-[360px] overflow-hidden p-0 sm:w-[400px] sm:max-w-[400px]">
        <DropdownMenuLabel className="bg-background dark:bg-muted sticky top-0 z-10 p-0">
          <div className="flex justify-between border-b px-3 py-4 sm:px-6">
            <div className="font-medium">{t("common.notifications")}</div>
            <Button variant="link" className="relative h-auto p-0 text-xs" size="sm" asChild>
              <Link href="/notifications">
                {t("notifications.viewAll")}
                {hasUnread && (
                  <span className="bg-destructive absolute -top-1 -right-2 block size-2 shrink-0 rounded-full"></span>
                )}
              </Link>
            </Button>
          </div>
        </DropdownMenuLabel>

        <ScrollArea className="h-[350px]">
          {isLoading ? (
            <div className="flex h-full items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            </div>
          ) : dbNotifications.length === 0 ? (
            <div className="text-muted-foreground p-4 text-center text-sm">
              {t("notifications.noNotifications")}
            </div>
          ) : (
            dbNotifications.slice(0, 5).map((dataItem, key) => (
              <NotificationItem
                key={key}
                dataItem={dataItem}
                t={t}
                currentLanguage={currentLanguage}
                handleAction={handleAction}
                actionLoading={actionLoading}
              />
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

function NotificationItem({
  dataItem,
  t,
  currentLanguage,
  handleAction,
  actionLoading,
}: {
  dataItem: any;
  t: any;
  currentLanguage: string;
  handleAction: (dataItem: any, action: "accepted" | "declined") => void;
  actionLoading: string | null;
}) {
  let title = null;
  let subtitle = null;
  let actions = null;
  let subtitleClassName = "dark:group-hover:text-default-700 text-muted-foreground truncate text-xs";

  if (dataItem.type === "sessionGroup") {
    title = <>{dataItem.actor_id} {t("notifications.inviteFromGroup")} {dataItem.from_group_id}</>;
    subtitle = <>{t("notifications.toJoinSession")} &quot;{dataItem.entity_id?.name}&quot; {t("notifications.onApplication")} {dataItem.entity_id?.application}</>;
  } else if (dataItem.type === "sessionFriend") {
    title = <>{dataItem.actor_id} {t("notifications.inviteYou")}</>;
    subtitle = <>{t("notifications.toJoinSession")} &quot;{dataItem.entity_id?.name}&quot; {t("notifications.onApplication")} {dataItem.entity_id?.application}</>;
  } else if (dataItem.type === "group") {
    title = <>{dataItem.actor_id} {t("notifications.inviteYou")}</>;
    subtitle = <>{t("notifications.toJoinGroup")} {dataItem.from_group_id?.name}</>;
  } else if (dataItem.type === "admin") {
    title = dataItem.content?.title || t("notifications.systemNotification");
    subtitle = <>{dataItem.content?.message || ""}</>;
    subtitleClassName = "dark:group-hover:text-default-700 text-muted-foreground line-clamp-2 text-xs leading-relaxed";
  } else if (dataItem.type === "TEAM_INVITE_RESPONSE") {
    const isDeclined = dataItem.status === "declined" || dataItem.content?.status === "declined";
    title = <>{dataItem.actor_id} {isDeclined ? "menolak undangan Anda" : "telah menerima undangan Anda"}</>;
    subtitle = <>{dataItem.content?.message || ""}</>;
    subtitleClassName = "dark:group-hover:text-default-700 text-muted-foreground line-clamp-2 truncate text-xs";
  } else if (dataItem.type === "TEAM_INVITE") {
    title = <>{dataItem.actor_id} invited you to team</>;
    subtitle = <>are you want to join team &ldquo;{dataItem.content?.competitionName || 'a competition'}&rdquo; as {dataItem.content?.role?.toLowerCase()} ?</>;
  } else {
    return null;
  }

  if (dataItem.type === "admin") {
    // No actions
  } else if (dataItem.type === "TEAM_INVITE_RESPONSE") {
    const isDeclined = dataItem.status === "declined" || dataItem.content?.status === "declined";
    const isApproved = dataItem.status === "approved";
    if (isDeclined || isApproved) {
      actions = (
        <div className="mt-1">
          <span
            className={`rounded-full px-2 py-1 text-[10px] font-semibold tracking-wider uppercase ${isApproved
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}>
            {isApproved ? "Approved" : "Declined"}
          </span>
        </div>
      );
    }
  } else {
    if (dataItem.status === null) {
      actions = (
        <div className="mt-1 flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className={dataItem.type === "TEAM_INVITE" ? "h-6 bg-green-700 px-3 text-[11px] text-white hover:bg-green-800 hover:text-white" : ""}
            onClick={() => handleAction(dataItem, "accepted")}
            disabled={actionLoading === dataItem.id}>
            {actionLoading === dataItem.id ? (
              <Loader2 className={`animate-spin ${dataItem.type === "TEAM_INVITE" ? "h-3 w-3" : "h-4 w-4"}`} />
            ) : (
              t("common.accept")
            )}
          </Button>
          <Button
            size="sm"
            variant={dataItem.type === "TEAM_INVITE" ? "outline" : "destructive"}
            className={dataItem.type === "TEAM_INVITE" ? "h-6 px-3 text-[11px]" : ""}
            onClick={() => handleAction(dataItem, "declined")}
            disabled={actionLoading === dataItem.id}>
            {t("common.decline")}
          </Button>
        </div>
      );
    } else {
      actions = (
        <div className="mt-1">
          <span
            className={`rounded-full px-2 py-1 text-[10px] font-semibold tracking-wider uppercase ${dataItem.status === "accepted"
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}>
            {dataItem.status === "accepted"
              ? t("common.accepted")
              : t("common.declined")}
          </span>
        </div>
      );
    }
  }

  return (
    <DropdownMenuItem
      onSelect={(e) => e.preventDefault()}
      className={`group relative flex cursor-pointer items-start overflow-hidden rounded-none border-b py-3 ${dataItem.type === "admin" ? "gap-9 px-6" : "gap-3 px-3 sm:px-6"}`}>
      <div className="flex min-w-0 flex-1 items-start gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1 overflow-hidden">
          <div className="dark:group-hover:text-default-800 truncate text-sm font-medium">
            {title}
          </div>
          <div className={subtitleClassName}>
            {subtitle}
          </div>
          {actions}
          <div className={`dark:group-hover:text-default-500 text-muted-foreground flex items-center gap-1 text-xs ${dataItem.type === "admin" ? "mt-1" : ""}`}>
            <ClockIcon className="size-3!" />
            {formatTimeAgo(dataItem.created_at, "long", currentLanguage as any)}
          </div>
        </div>
      </div>
      {!dataItem.is_read && (
        <span className="absolute top-2 right-3 block size-2.5 rounded-full bg-red-500 ring-2 ring-background dark:ring-zinc-950" />
      )}
    </DropdownMenuItem>
  );
}

export default Notifications;