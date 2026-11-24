// "use client";

// // ============================================================
// // notifications/_components/NotificationItem.tsx
// //
// // Komponen item notifikasi yang dipakai BERSAMA oleh:
// //   - Header bell dropdown
// //   - Halaman notifikasi (tabel)
// //
// // Props `variant`:
// //   "dropdown" → tampilan compact untuk header dropdown
// //   "row"      → tampilan baris tabel untuk halaman notifikasi
// // ============================================================

// import { Loader2 } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { cn } from "@/lib/utils";
// import type { Notification } from "@/types/notifications";

// import { useI18n } from "@/hooks/use-i18n";

// // ── Title renderer ────────────────────────────────────────────

// export function NotificationTitle({ item }: { item: Notification }) {
//   const { t } = useI18n();
//   if (item.type === "sessionGroup") {
//     return (
//       <span className="block max-w-full truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
//         {item.actor_id}{" "}
//         <span className="font-normal text-zinc-500">{t("notifications.fromGroup")}</span>{" "}
//         {typeof item.from_group_id === "string"
//           ? item.from_group_id
//           : (item.from_group_id as any)?.name}
//       </span>
//     );
//   }
//   if (item.type === "sessionFriend" || item.type === "group") {
//     return (
//       <span className="block max-w-full truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
//         {item.actor_id}
//       </span>
//     );
//   }
//   if (item.type === "admin") {
//     return (
//       <span className="block max-w-full truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
//         {item.content?.title || t("notifications.systemNotification")}
//       </span>
//     );
//   }
//   return (
//     <span className="block max-w-full truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
//       {t("common.notifications")}
//     </span>
//   );
// }

// // ── Description renderer ──────────────────────────────────────

// export function NotificationDescription({ item }: { item: Notification }) {
//   const { t } = useI18n();
//   if (item.type === "sessionGroup" || item.type === "sessionFriend") {
//     const session = item.entity_id as any;
//     return (
//       <span className="block max-w-full truncate text-xs text-zinc-500 dark:text-zinc-400">
//         {t("notifications.toJoinSession")} &ldquo;{session?.name}&rdquo; ({session?.application})
//       </span>
//     );
//   }
//   if (item.type === "group") {
//     const group = item.from_group_id as any;
//     return (
//       <span className="block max-w-full truncate text-xs text-zinc-500 dark:text-zinc-400">
//         {t("notifications.toJoinGroup")}{" "}
//         <span className="font-semibold text-zinc-700 dark:text-zinc-300">
//           {group?.name ?? group}
//         </span>
//       </span>
//     );
//   }
//   if (item.type === "admin") {
//     return (
//       <span className="line-clamp-2 block text-xs text-zinc-500 dark:text-zinc-400">
//         {item.content?.message || ""}
//       </span>
//     );
//   }
//   return (
//     <span className="text-xs text-zinc-500 dark:text-zinc-400">
//       {t("notifications.actionRequired")}
//     </span>
//   );
// }

// // ── Status badge ──────────────────────────────────────────────

// export function StatusBadge({ status }: { status: "accepted" | "declined" }) {
//   const { t } = useI18n();
//   return (
//     <span
//       className={cn(
//         "rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase",
//         status === "accepted"
//           ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
//           : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400"
//       )}>
//       {status === "accepted" ? t("common.accepted") : t("common.declined")}
//     </span>
//   );
// }

// // ── Action buttons ────────────────────────────────────────────

// interface ActionButtonsProps {
//   item: Notification;
//   actionLoading: string | null;
//   onAction: (item: Notification, action: "accepted" | "declined") => void;
//   /** "page" = button-orange style, "dropdown" = outline/destructive style */
//   variant?: "page" | "dropdown";
// }

// export function ActionButtons({
//   item,
//   actionLoading,
//   onAction,
//   variant = "page"
// }: ActionButtonsProps) {
//   const { t } = useI18n();
//   const isLoading = actionLoading === item.id;

//   if (item.status !== null) {
//     return <StatusBadge status={item.status} />;
//   }

//   if (item.type === "admin") return null;

//   if (variant === "dropdown") {
//     return (
//       <div className="mt-1 flex items-center gap-2">
//         <Button
//           size="sm"
//           variant="outline"
//           className="h-6 bg-green-700 px-3 text-[11px] text-white hover:bg-green-800 hover:text-white"
//           onClick={() => onAction(item, "accepted")}
//           disabled={isLoading}>
//           {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : t("common.accept")}
//         </Button>
//         <Button
//           size="sm"
//           variant="outline"
//           className="h-6 px-3 text-[11px]"
//           onClick={() => onAction(item, "declined")}
//           disabled={isLoading}>
//           {t("common.decline")}
//         </Button>
//       </div>
//     );
//   }

//   return (
//     <div className="mt-2 flex items-center gap-2">
//       <Button
//         variant="outline"
//         size="sm"
//         className="h-7 bg-green-700 px-4 text-[11px] text-white hover:bg-green-800 hover:text-white"
//         onClick={() => onAction(item, "accepted")}
//         disabled={isLoading}>
//         {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : t("common.accept")}
//       </Button>
//       <Button
//         size="sm"
//         variant="outline"
//         className="h-7 px-3 text-[11px]"
//         onClick={() => onAction(item, "declined")}
//         disabled={isLoading}>
//         {t("common.decline")}
//       </Button>
//     </div>
//   );
// }

"use client";

// ============================================================
// notifications/_components/NotificationItem.tsx
//
// Komponen item notifikasi yang dipakai BERSAMA oleh:
//   - Header bell dropdown
//   - Halaman notifikasi (tabel)
//
// Props `variant`:
//   "dropdown" → tampilan compact untuk header dropdown
//   "row"      → tampilan baris tabel untuk halaman notifikasi
// ============================================================

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/notifications";

import { useI18n } from "@/hooks/use-i18n";

// ── Unread dot ────────────────────────────────────────────────

function UnreadDot({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="inline-block size-2 shrink-0 rounded-full bg-red-500" aria-label="unread" />
  );
}

// ── Title renderer ────────────────────────────────────────────

export function NotificationTitle({ item }: { item: Notification }) {
  const { t } = useI18n();

  let content: React.ReactNode;

  if (item.type === "sessionGroup") {
    content = (
      <>
        {item.actor_id}{" "}
        <span className="font-normal text-zinc-500">{t("notifications.fromGroup")}</span>{" "}
        {typeof item.from_group_id === "string"
          ? item.from_group_id
          : (item.from_group_id as any)?.name}
      </>
    );
  } else if (item.type === "sessionFriend" || item.type === "group") {
    content = <>{item.actor_id}</>;
  } else if (item.type === "TEAM_INVITE") {
    content = <>{item.actor_id} invited you to team</>;
  } else if (item.type === "TEAM_INVITE_RESPONSE") {
    const isDeclined = item.status === "declined" || item.content?.status === "declined";
    content = (
      <>
        {item.actor_id}{" "}
        {isDeclined ? "menolak undangan Anda" : "telah menerima undangan Anda"}
      </>
    );
  } else if (item.type === "admin") {
    content = <>{item.content?.title || t("notifications.systemNotification")}</>;
  } else {
    content = <>{t("common.notifications")}</>;
  }

  return (
    <span className="block w-full max-w-full min-w-0 truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
      {content}
    </span>
  );
}

// ── Description renderer ──────────────────────────────────────

export function NotificationDescription({ item }: { item: Notification }) {
  const { t } = useI18n();
  if (item.type === "sessionGroup" || item.type === "sessionFriend") {
    const session = item.entity_id as any;
    return (
      <span className="block max-w-full min-w-0 truncate text-xs text-zinc-500 dark:text-zinc-400">
        {t("notifications.toJoinSession")} &ldquo;{session?.name}&rdquo; ({session?.application})
      </span>
    );
  }
  if (item.type === "group") {
    const group = item.from_group_id as any;
    return (
      <span className="block max-w-full min-w-0 truncate text-xs text-zinc-500 dark:text-zinc-400">
        {t("notifications.toJoinGroup")}{" "}
        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
          {group?.name ?? group}
        </span>
      </span>
    );
  }
  if (item.type === "TEAM_INVITE") {
    return (
      <span className="block max-w-full min-w-0 truncate text-xs text-zinc-500 dark:text-zinc-400">
        are you want to join team &ldquo;{item.content?.competitionName || 'a competition'}&rdquo; as {item.content?.role?.toLowerCase()} ?
      </span>
    );
  }
  if (item.type === "TEAM_INVITE_RESPONSE") {
    return (
      <span className="line-clamp-2 block max-w-full min-w-0 truncate text-xs text-zinc-500 dark:text-zinc-400">
        {item.content?.message || ""}
      </span>
    );
  }
  if (item.type === "admin") {
    return (
      <span className="block max-w-full min-w-0 truncate text-xs text-zinc-500 dark:text-zinc-400">
        {item.content?.message || ""}
      </span>
    );
  }
  return (
    <span className="block max-w-full min-w-0 truncate text-xs text-zinc-500 dark:text-zinc-400">
      {t("notifications.actionRequired")}
    </span>
  );
}

// ── Status badge ──────────────────────────────────────────────

export function StatusBadge({ status }: { status: "accepted" | "declined" | "approved" }) {
  const { t } = useI18n();
  return (
    <span
      className={cn(
        "rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase",
        status === "accepted" || status === "approved"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
          : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400"
      )}>
      {status === "accepted" ? t("common.accepted")
        : status === "approved" ? "Approved"
        : t("common.declined")}
    </span>
  );
}

// ── Action buttons ────────────────────────────────────────────

interface ActionButtonsProps {
  item: Notification;
  actionLoading: string | null;
  onAction: (item: Notification, action: "accepted" | "declined") => void;
  /** "page" = button-orange style, "dropdown" = outline/destructive style */
  variant?: "page" | "dropdown";
}

export function ActionButtons({
  item,
  actionLoading,
  onAction,
  variant = "page"
}: ActionButtonsProps) {
  const { t } = useI18n();
  const isLoading = actionLoading === item.id;

  if (item.status !== null) {
    return <StatusBadge status={item.status as any} />;
  }

  if (item.type === "admin") return null;

  // Respon undangan tim: hanya info, tidak ada konfirmasi manager lagi
  if (item.type === "TEAM_INVITE_RESPONSE") {
    if (item.content?.status === "declined" || item.status === "declined") {
      return <StatusBadge status="declined" />;
    }
    return null;
  }

  if (variant === "dropdown") {
    return (
      <div className="mt-1 flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-6 bg-green-700 px-3 text-[11px] text-white hover:bg-green-800 hover:text-white dark:bg-green-700 dark:text-white dark:hover:bg-green-800 dark:hover:text-white"
          onClick={() => onAction(item, "accepted")}
          disabled={isLoading}>
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : t("common.accept")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-6 px-3 text-[11px]"
          onClick={() => onAction(item, "declined")}
          disabled={isLoading}>
          {t("common.decline")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="h-7 bg-green-700 px-4 text-[11px] text-white hover:bg-green-800 hover:text-white dark:bg-green-700 dark:text-white dark:hover:bg-green-800 dark:hover:text-white"
        onClick={() => onAction(item, "accepted")}
        disabled={isLoading}>
        {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : t("common.accept")}
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-7 px-3 text-[11px]"
        onClick={() => onAction(item, "declined")}
        disabled={isLoading}>
        {t("common.decline")}
      </Button>
    </div>
  );
}
