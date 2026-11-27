import { setVapidDetails, sendNotification } from "web-push";
import { getSupabaseAdminClient } from "@/lib/tasks/server";

let vapidConfigured = false;

function ensureVapidConfigured(): boolean {
  if (vapidConfigured) return true;
  const publicKey =
    process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
  const privateKey = process.env.VAPID_PRIVATE_KEY || "";
  const subject = process.env.VAPID_SUBJECT || "mailto:gameforsmartubig@gmail.com";

  if (!publicKey || !privateKey) {
    return false;
  }

  setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

export interface NotificationInsertRow {
  user_id: string;
  actor_id: string;
  type: "group" | "sessionGroup" | "sessionFriend" | "admin" | string;
  entity_type?: string | null;
  entity_id?: string | null;
  from_group_id?: string | null;
  status?: string | null;
  content?: Record<string, any> | null;
  is_read?: boolean;
  created_at?: string;
}

export function resolveSessionJoinUrl(
  code: string,
  application?: string | null,
  apex?: string | null
): { url: string; openInNewTab: boolean } {
  const envDomain = (process.env.NEXT_PUBLIC_COOKIE_DOMAIN || "")
    .trim()
    .replace(/^\.+/, "");
  const domain = envDomain || (apex ? apex.replace(/^\.+/, "") : "") || "gameforsmart.com";
  const appBaseUrl = (
    process.env.NEXT_PUBLIC_AUTH_BASE_URL || `https://app.${domain}`
  ).replace(/\/+$/, "");

  const app = (application || "").toLowerCase().trim();
  switch (app) {
    case "crazyrace":
      return { url: `https://crazyrace.${domain}/join/${code}`, openInNewTab: true };
    case "memoryquiz":
    case "memory quiz":
    case "memory-game":
    case "memory game":
      return { url: `https://memoryquiz.${domain}/player/${code}/waiting`, openInNewTab: true };
    case "quizrush":
      return { url: `https://quizrush.${domain}/join/${code}`, openInNewTab: true };
    case "space quiz":
    case "spacequiz":
    case "space-quiz":
      return { url: `https://spacequiz.${domain}/join/${code}`, openInNewTab: true };
    case "axiom":
      return { url: `https://axiom.${domain}/join/${code}`, openInNewTab: true };
    case "zigma":
      return { url: `https://zigma.${domain}/join/${code}`, openInNewTab: true };
    case "nitroquiz":
      return { url: `https://nitroquiz.${domain}/join/${code}`, openInNewTab: true };
    default:
      return { url: `${appBaseUrl}/join/${code}`, openInNewTab: false };
  }
}

async function buildPushPayload(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  notif: any
) {
  const result = {
    title: "GameForSmart",
    body: "You have a new notification",
    url: "/notifications",
    actions: [] as { action: string; title: string }[],
    notifId: notif.id || "",
    notifType: notif.type || "",
    entityId: notif.entity_id || null,
    groupId: notif.from_group_id || null,
    sessionCode: null as string | null,
    sessionApp: null as string | null
  };

  if (notif.content?.title) {
    result.title = notif.content.title;
    result.body = notif.content.body || notif.content.message || "";
    result.url = notif.content.url || "/notifications";
    return result;
  }

  let actorName = "Guru";
  if (notif.actor_id) {
    const { data: actor } = await supabase
      .from("profiles")
      .select("nickname, fullname, username")
      .eq("id", notif.actor_id)
      .maybeSingle();
    if (actor) {
      actorName = actor.nickname || actor.fullname || actor.username || "Guru";
    }
  }

  if (notif.type === "group") {
    let groupName = "a group";
    if (notif.from_group_id) {
      const { data: group } = await supabase
        .from("groups")
        .select("name")
        .eq("id", notif.from_group_id)
        .maybeSingle();
      if (group?.name) groupName = group.name;
    }

    result.title = "Group Invitation 👥";
    result.body = `${actorName} invite you to join group "${groupName}"`;
    result.url = "/notifications";
    return result;
  }

  if (notif.type === "sessionGroup") {
    let groupName = "a group";
    if (notif.from_group_id) {
      const { data: group } = await supabase
        .from("groups")
        .select("name")
        .eq("id", notif.from_group_id)
        .maybeSingle();
      if (group?.name) groupName = group.name;
    }

    let sessionName = "a game session";
    if (notif.entity_id) {
      const { data: session } = await supabase
        .from("game_sessions")
        .select("game_pin, application, quizzes!game_sessions_quiz_id_fkey(title)")
        .eq("id", notif.entity_id)
        .maybeSingle();
      if (session) {
        const quizData = (session as any).quizzes;
        const title = Array.isArray(quizData) ? quizData[0]?.title : quizData?.title;
        sessionName = title || "a game session";
        result.sessionCode = session.game_pin || null;
        result.sessionApp = session.application || null;
        if (session.game_pin) {
          result.url = resolveSessionJoinUrl(session.game_pin, session.application).url;
        }
      }
    }

    result.title = "Game Invitation 🎮";
    result.body = `${actorName} from group ${groupName} invite you to join session "${sessionName}"`;
    result.actions = [
      { action: "accept", title: "✅ Accept" },
      { action: "decline", title: "❌ Decline" }
    ];
    return result;
  }

  if (notif.type === "admin") {
    result.title = notif.content?.title || "System Notification";
    result.body = notif.content?.message || "";
    result.url = notif.content?.url || "/notifications";
    return result;
  }

  return result;
}

async function sendPushToUser(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  notif: any
) {
  if (!notif?.user_id || !ensureVapidConfigured()) return;

  try {
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", notif.user_id);

    if (error || !subscriptions || subscriptions.length === 0) return;

    const pushData = await buildPushPayload(supabase, notif);
    const payload = JSON.stringify({
      title: pushData.title,
      body: pushData.body,
      icon: "/logo.png",
      tag: `notif-${pushData.notifType}-${pushData.notifId || Date.now()}`,
      actions: pushData.actions,
      data: {
        type: pushData.notifType,
        url: pushData.url,
        notifId: pushData.notifId,
        entityId: pushData.entityId,
        groupId: pushData.groupId,
        sessionCode: pushData.sessionCode,
        sessionApp: pushData.sessionApp
      }
    });

    await Promise.allSettled(
      subscriptions.map(async (sub: any) => {
        try {
          await sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth }
            },
            payload
          );
        } catch (err: any) {
          if (err?.statusCode === 410 || err?.statusCode === 404) {
            await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          }
        }
      })
    );
  } catch (err) {
    console.warn("[notifications/server] sendPushToUser warning:", err);
  }
}

/**
 * Menyimpan notifikasi ke tabel `notifications` dan mengirim Web Push ke subscriber aktif.
 */
export async function createNotificationsWithPush(rows: NotificationInsertRow[]) {
  if (!rows || rows.length === 0) {
    return { inserted: [] as any[], error: null as string | null };
  }

  const supabase = getSupabaseAdminClient();
  const timestamp = new Date().toISOString();

  const normalizedRows = rows.map((row) => ({
    user_id: row.user_id,
    actor_id: row.actor_id,
    type: row.type,
    entity_type: row.entity_type ?? null,
    entity_id: row.entity_id ?? null,
    from_group_id: row.from_group_id ?? null,
    status: row.status ?? null,
    content: row.content ?? null,
    is_read: row.is_read ?? false,
    created_at: row.created_at ?? timestamp
  }));

  const { data: insertedRows, error } = await supabase
    .from("notifications")
    .insert(normalizedRows)
    .select("id, user_id, actor_id, type, entity_type, entity_id, from_group_id, content");

  if (error) {
    return { inserted: [] as any[], error: error.message };
  }

  const rowsToPush = insertedRows || normalizedRows;
  await Promise.allSettled(rowsToPush.map((row) => sendPushToUser(supabase, row)));

  return { inserted: rowsToPush, error: null as string | null };
}

