// ============================================================
// notifications/_services/notificationService.ts
//
// Semua operasi Supabase untuk sistem notifikasi.
// Dipanggil dari hook, TIDAK pernah langsung dari komponen.
//
// Fungsi yang tersedia (bisa dipanggil dari fitur lain):
//   fetchNotifications       – ambil + enrich notifikasi user
//   markAsRead               – tandai satu/banyak notif sebagai dibaca
//   markAllAsRead            – tandai semua notif user sebagai dibaca
//   updateNotifStatus        – ubah status notif (accepted/declined)
//   acceptGroupInvite        – terima undangan grup (atomik di database)
//   declineGroupInvite       – tolak undangan grup
//   respondTeamInvite – kirim respon accept/decline undangan tim ke app kompetisi
//   resolveSessionUrl        – resolve URL join session berdasar aplikasi
//   subscribeNotifications   – realtime subscription (mengembalikan unsubscribe fn)
// ============================================================

import { supabase } from "@/lib/supabase";
import { clientEnv } from "@/lib/env-config";
import type { Notification, SessionEntity } from "@/types/notifications";

// ─── fetchNotifications ──────────────────────────────────────

/**
 * Mengambil semua notifikasi milik user, lalu enrich dengan
 * data aktor (profiles), grup, dan session secara batch.
 *
 * Dapat dipakai dari: header bell, halaman notifikasi,
 * badge count di sidebar, dll.
 */
export async function fetchNotifications(profileId: string): Promise<Notification[]> {
  const { data: notifs, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[fetchNotifications] Error:", error);
    return [];
  }
  if (!notifs) return [];

  // ── Batch fetch actors ────────────────────────────────────
  const actorIds = [...new Set(notifs.map((n: any) => n.actor_id).filter(Boolean))];
  const profilesMap: Record<string, any> = {};
  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, nickname, fullname")
      .in("id", actorIds);
    profiles?.forEach((p: any) => { profilesMap[p.id] = p; });
  }

  // ── Batch fetch groups ────────────────────────────────────
  const groupIds = [
    ...new Set([
      ...notifs.filter((n: any) => n.type === "group"         && n.from_group_id).map((n: any) => n.from_group_id),
      ...notifs.filter((n: any) => n.type === "sessionGroup"  && n.from_group_id).map((n: any) => n.from_group_id),
    ]),
  ];
  const groupsMap: Record<string, any> = {};
  if (groupIds.length > 0) {
    const { data: groups } = await supabase
      .from("groups")
      .select("id, name")
      .in("id", groupIds);
    groups?.forEach((g: any) => { groupsMap[g.id] = g; });
  }

  // ── Batch fetch sessions ──────────────────────────────────
  const sessionIds = [
    ...new Set(
      notifs
        .filter((n: any) => (n.type === "sessionGroup" || n.type === "sessionFriend") && n.entity_id)
        .map((n: any) => n.entity_id)
    ),
  ];
  const sessionsMap: Record<string, SessionEntity> = {};
  if (sessionIds.length > 0) {
    const { data: sessions } = await supabase
      .from("game_sessions")
      .select("id, game_pin, application, quizzes!game_sessions_quiz_id_fkey(title)")
      .in("id", sessionIds);
    sessions?.forEach((s: any) => {
      const quizData = s.quizzes;
      const title    = Array.isArray(quizData) ? quizData[0]?.title : quizData?.title;
      sessionsMap[s.id] = {
        name:        title || "Unknown Quiz",
        code:        s.game_pin || "N/A",
        application: s.application || "N/A",
      };
    });
  }

  // ── Enrich ────────────────────────────────────────────────
  return notifs.map((n: any): Notification => {
    const actor     = profilesMap[n.actor_id] || {};
    const actorName = actor.nickname || actor.fullname || "User";

    const base: Notification = {
      id:                n.id,
      user_id:           n.user_id,
      actor_id:          actorName,
      raw_actor_id:      n.actor_id,
      type:              n.type,
      entity_type:       n.entity_type,
      entity_id:         n.entity_id,
      from_group_id:     n.from_group_id,
      raw_from_group_id: n.from_group_id,
      status:            n.status,
      content:           n.content,
      is_read:           n.is_read || false,
      created_at:        n.created_at,
    };

    if (n.type === "group") {
      base.from_group_id = { name: groupsMap[n.from_group_id]?.name || "Unknown Group" };
    } else if (n.type === "sessionFriend" || n.type === "sessionGroup") {
      base.entity_id = sessionsMap[n.entity_id] ?? {
        name: "Unknown Session", code: "N/A", application: "N/A",
      };
      if (n.type === "sessionGroup" && n.from_group_id) {
        base.from_group_id = groupsMap[n.from_group_id]?.name || "Unknown Group";
      }
    }

    return base;
  });
}

// ─── markAsRead ───────────────────────────────────────────────

/** Tandai array notif ID sebagai dibaca */
export async function markAsRead(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await supabase.from("notifications").update({ is_read: true }).in("id", ids);
}

/** Tandai SEMUA notif milik user sebagai dibaca */
export async function markAllAsRead(profileId: string): Promise<void> {
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", profileId)
    .eq("is_read", false);
}

// ─── updateNotifStatus ────────────────────────────────────────

/** Update status satu notifikasi (accepted / declined) */
export async function updateNotifStatus(
  id: string,
  status: "accepted" | "declined"
): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}

// ─── acceptGroupInvite / declineGroupInvite ─────────────────────

/**
 * Terima undangan grup.
 *
 * Semua perubahan (penambahan member, pencatatan activity, dan status
 * notifikasi) dilakukan oleh satu RPC SECURITY DEFINER di database,
 * sehingga tidak bisa gagal separuh jalan dan aman dipanggil dua kali.
 */
export async function acceptGroupInvite(
  groupId:        string,
  notificationId: string
): Promise<{ alreadyMember: boolean }> {
  const { data, error } = await supabase.rpc("accept_group_invite", {
    p_group_id:        groupId,
    p_notification_id: notificationId
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  return { alreadyMember: Boolean(data?.already_member) };
}

/**
 * Tolak undangan grup (status notifikasi diubah di database).
 */
export async function declineGroupInvite(notificationId: string): Promise<void> {
  const { data, error } = await supabase.rpc("decline_group_invite", {
    p_notification_id: notificationId
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
}

// ─── respondTeamInvite ───────────────────────────────────────

/**
 * Invitee merespons undangan tim kompetisi (TEAM_INVITE).
 * Memanggil endpoint respond di aplikasi kompetisi (new_comp) yang:
 * - ACCEPT: mengubah profiles.role invitee, menambahkan email-nya ke
 *   kolom role terkait di competitions, lalu menghapus notifikasi undangan.
 * - DECLINE: menghapus notifikasi undangan.
 * Tidak ada konfirmasi manager lagi; penerimaan langsung berlaku.
 */
export async function respondTeamInvite(
  notificationId: string,
  action: "ACCEPT" | "DECLINE"
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }

    const isMyId =
      typeof window !== "undefined" &&
      (window.location.hostname === "gameforsmart.my.id" ||
        window.location.hostname.endsWith(".gameforsmart.my.id"));

    const competitionBaseUrl = isMyId
      ? "https://competition.gameforsmart.my.id"
      : clientEnv.app.competitionUrl;

    const res = await fetch(
      `${competitionBaseUrl}/api/team-invites/respond`,
      {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ notificationId, action })
      }
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data?.error || "Failed to respond to team invite" };
    }
    return { success: true };
  } catch (err: any) {
    console.error("[notificationService] respondTeamInvite:", err);
    return { success: false, error: err?.message || "Failed to respond to team invite" };
  }
}

// ─── notifyManagerDeclined ────────────────────────────────────

/**
 * Kirim notifikasi info ke manager saat undangan tim DITOLAK
 * (type TEAM_INVITE_RESPONSE, status declined). Undangan yang
 * diterima tidak perlu lagi — member langsung aktif di app kompetisi
 * melalui respondTeamInvite.
 */
export async function notifyManagerDeclined(
  profileId: string,
  managerId: string,
  competitionId: string,
  role: string,
  competitionName?: string
): Promise<void> {
  const { error } = await supabase.from("notifications").insert({
    user_id: managerId, // manager yang mengundang
    actor_id: profileId, // user yang menolak
    type: "TEAM_INVITE_RESPONSE",
    content: {
      message: `Telah menolak undangan Anda sebagai ${role} di kompetisi ${competitionName || "ini"}.`,
      competitionId,
      role,
      competitionName,
      status: "declined"
    },
    entity_type: "COMPETITION",
    status: "declined",
    is_read: false
  });

  if (error) {
    throw new Error(error.message || "Failed to send response to manager");
  }
}

// ─── resolveSessionUrl ────────────────────────────────────────

/**
 * Resolve URL join session berdasarkan nama aplikasi.
 * Mengembalikan { url, openInNewTab }.
 * Dapat dipanggil dari fitur lain (mis. tombol join di halaman lain).
 */
export function resolveSessionUrl(
  code: string,
  application: string
): { url: string; openInNewTab: boolean } {
  const app = application.toLowerCase().trim();
  switch (app) {
    case "crazyrace":
      return { url: `https://crazyrace.gameforsmart.com/join/${code}`, openInNewTab: true };
    case "memoryquiz":
    case "memory quiz":
    case "memory-game":
    case "memory game":
      return { url: `https://memoryquiz.gameforsmart.com/player/${code}/waiting`, openInNewTab: true };
    case "quizrush":
      return { url: `https://quizrush.gameforsmart.com/join/${code}`, openInNewTab: true };
    case "space quiz":
    case "spacequiz":
    case "space-quiz":
      return { url: `https://spacequiz.gameforsmart.com/join/${code}`, openInNewTab: true };
    case "axiom":
      return { url: `https://axiom.gameforsmart.com/join/${code}`, openInNewTab: true };
    case "zigma":
      return { url: `https://zigma.gameforsmart.com/join/${code}`, openInNewTab: true };
    case "nitroquiz":
      return { url: `https://nitroquiz.gameforsmart.com/join/${code}`, openInNewTab: true };
    default:
      return { url: `https://app.gameforsmart.com/join/${code}`, openInNewTab: false };
  }
}


// ─── subscribeNotifications ───────────────────────────────────

/**
 * Membuat realtime subscription Supabase untuk notifikasi user.
 * Mengembalikan fungsi unsubscribe — panggil di cleanup effect.
 *
 * @param profileId  – ID profile yang dimonitor
 * @param channelKey – nama unik channel (mis. "header" / "page")
 * @param onChange   – callback dipanggil saat ada perubahan
 */
export function subscribeNotifications(
  profileId:  string,
  channelKey: string,
  onChange:   () => void
): () => void {
  const channel = supabase
    .channel(`notifications-${channelKey}`)
    .on(
      "postgres_changes",
      {
        event:  "*",
        schema: "public",
        table:  "notifications",
        filter: `user_id=eq.${profileId}`,
      },
      onChange
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
