import crypto from "crypto";

const CROCKFORD_BASE32 = "0123456789abcdefghjkmnpqrstvwxyz";

/**
 * Menghasilkan 20-karakter XID-compatible ID yang aman untuk URL dan PostgreSQL.
 */
export function generateSessionId(): string {
  const bytes = crypto.randomBytes(12);
  const timestamp = Math.floor(Date.now() / 1000);
  const all = Buffer.alloc(12);
  all.writeUInt32BE(timestamp, 0);
  bytes.copy(all, 4, 4, 12);

  let id = "";
  let bits = 0;
  let value = 0;
  for (let i = 0; i < all.length; i++) {
    value = (value << 8) | all[i];
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      id += CROCKFORD_BASE32[(value >>> bits) & 0x1f];
    }
  }
  if (bits > 0) {
    id += CROCKFORD_BASE32[(value << (5 - bits)) & 0x1f];
  }
  return id.slice(0, 20);
}

/**
 * Menghasilkan 6-digit PIN room (100000 - 999999).
 */
export function generateGamePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Menormalkan nama/ID game ke key aplikasi standar GameForSmart.
 */
export function resolveGameApplicationKey(gameId?: string | null): string {
  const normalized = (gameId || "")
    .toLowerCase()
    .trim()
    .replace(/[_\-]+/g, " ")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized || normalized === "none" || normalized === "gameforsmart" || normalized === "app" || normalized === "quiz v2" || normalized === "quizv2") {
    return "gameforsmart";
  }
  if (normalized.includes("zigma")) return "zigma";
  if (normalized.includes("nitroquiz") || normalized.includes("nitro quiz") || normalized === "nitro") {
    return "nitroquiz";
  }
  if (normalized.includes("crazyrace") || normalized.includes("crazy race")) return "crazyrace";
  if (
    normalized.includes("spacequiz") ||
    normalized.includes("space quiz") ||
    normalized.includes("quiz game v2")
  ) {
    return "spacequiz";
  }
  if (
    normalized.includes("quizrush") ||
    normalized.includes("zombie rawr") ||
    normalized.includes("zombierawr")
  ) {
    return "quizrush";
  }
  if (normalized.includes("memoryquiz") || normalized.includes("memory quiz") || normalized.includes("memory game")) {
    return "memoryquiz";
  }
  if (normalized.includes("axiom")) return "axiom";

  return "gameforsmart";
}

function resolveBaseDomain(apex?: string | null): string {
  const envCookieDomain = (process.env.NEXT_PUBLIC_COOKIE_DOMAIN || "")
    .trim()
    .replace(/^\.+/, "");
  if (envCookieDomain) return envCookieDomain;
  if (apex) return apex.replace(/^\.+/, "");
  return "gameforsmart.com";
}

/**
 * Menghasilkan URL lobby host sesuai aplikasi game yang dipilih pada tugas,
 * dengan domain dinamis mengikuti NEXT_PUBLIC_COOKIE_DOMAIN / apex request.
 */
export function buildHostLobbyUrl(params: {
  application: string;
  sessionId: string;
  gamePin: string;
  hostId?: string;
  quizId?: string | null;
  apex?: string | null;
  durationMinutes?: number;
  questionLimit?: number;
  difficulty?: string;
}): string {
  const {
    application,
    sessionId,
    gamePin,
    hostId,
    quizId,
    apex,
    durationMinutes,
    questionLimit,
    difficulty
  } = params;
  const domain = resolveBaseDomain(apex);
  const appBaseUrl = (process.env.NEXT_PUBLIC_AUTH_BASE_URL || `https://app.${domain}`).replace(/\/+$/, "");
  const hostQuery = hostId ? `?hostId=${encodeURIComponent(hostId)}` : "";

  switch (application) {
    case "nitroquiz":
      return `https://nitroquiz.${domain}/host/${gamePin}/lobby${hostQuery}`;
    case "crazyrace":
      return `https://crazyrace.${domain}/host/${gamePin}/lobby${hostQuery}`;
    case "spacequiz":
      return `https://spacequiz.${domain}/host/${gamePin}${hostQuery}`;
    case "memoryquiz":
      return `https://memoryquiz.${domain}/host/${gamePin}/lobby${hostQuery}`;
    case "quizrush":
      return `https://quizrush.${domain}/multiplayer/${gamePin}/lobby${hostQuery}`;
    case "axiom":
      return `https://axiom.${domain}/host/${gamePin}/lobby${hostQuery}`;
    case "zigma": {
      const q = new URLSearchParams();
      if (quizId) q.set("quizId", quizId);
      q.set("gamePin", gamePin);
      q.set("sessionId", sessionId);
      if (hostId) q.set("hostId", hostId);
      if (durationMinutes) q.set("duration", String(durationMinutes));
      if (questionLimit) q.set("limit", String(questionLimit));
      if (difficulty) q.set("difficulty", difficulty);
      return `https://zigma.${domain}/host/auto-create?${q.toString()}`;
    }
    default:
      return `${appBaseUrl}/host/${sessionId}/room${hostQuery}`;
  }
}

