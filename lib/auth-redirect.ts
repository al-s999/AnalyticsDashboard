/**
 * Trusted hosts for post-OAuth redirects (open-redirect protection).
 * Aligns with Supabase ADDITIONAL_REDIRECT_URLS wildcards.
 */
function isTrustedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().split(":")[0];

  if (host === "localhost" || host === "127.0.0.1") {
    return true;
  }

  if (host === "gameforsmart.com" || host.endsWith(".gameforsmart.com")) {
    return true;
  }

  if (host === "gameforsmart.my.id" || host.endsWith(".gameforsmart.my.id")) {
    return true;
  }

  return false;
}

/**
 * Apex ekosistem yang sharing cookie per-domain,
 * sama seperti pola awal .gameforsmart.com:
 * prod = gameforsmart.com, testing = gameforsmart.my.id
 */
const SHARED_APEXES = ["gameforsmart.com", "gameforsmart.my.id"] as const;

/** Normalisasi hostname: lowercase + buang port (header Host bisa bawa :port). */
function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().split(":")[0];
}

/**
 * Apex (tanpa dot) yang menaungi hostname, atau null bila tidak dikenal.
 */
export function getCookieApex(hostname: string): string | null {
  const host = normalizeHostname(hostname);
  for (const apex of SHARED_APEXES) {
    if (host === apex || host.endsWith(`.${apex}`)) {
      return apex;
    }
  }
  return null;
}

/**
 * Domain cookie yang di-share lintas subdomain ("."+apex),
 * sama seperti pola awal .gameforsmart.com.
 * Return undefined untuk localhost/dev agar cookie host-only.
 */
export function getSharedCookieDomain(hostname: string): string | undefined {
  const apex = getCookieApex(hostname);
  return apex ? `.${apex}` : undefined;
}

/** true jika host berjalan di konteks HTTPS prod/testing/dev (perlu Secure cookie). */
export function isSecureAuthHost(hostname: string): boolean {
  const host = normalizeHostname(hostname);
  if (getCookieApex(host)) return true;
  if (host.endsWith(".vercel.app")) return true;
  if (host.includes("ngrok-free.app") || host.includes("ngrok.io")) return true;
  return false;
}

/** Bridge OAuth per-apex (tujuan redirectTo lintas-subdomain dalam apex yang sama). */
export function getOAuthBridgeHost(hostname: string): string {
  const apex = getCookieApex(hostname);
  if (apex === "gameforsmart.my.id") return "https://app.gameforsmart.my.id";
  return "https://gameforsmart.com";
}

/**
 * Host publik dari request yang lewat reverse proxy.
 * Di balik aaPanel/nginx → 127.0.0.1:3008, header `Host` bisa berisi IP/port
 * sehingga server salah mengira hostname (cookie jadi host-only).
 * Prioritas: x-forwarded-host (nilai pertama) → host.
 * Aman dari spoofing: hasilnya hanya dipakai memilih apex whitelist
 * (selainnya → host-only); header bohong tidak bisa membuat browser
 * menyimpan cookie untuk domain asing.
 */
export function getRequestHost(
  headers: { get: (name: string) => string | null },
  fallbackUrl?: string
): string {
  const forwarded = headers.get("x-forwarded-host");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  const host = headers.get("host");
  if (host) return host;
  if (fallbackUrl) {
    try {
      return new URL(fallbackUrl).host;
    } catch {
      /* abaikan */
    }
  }
  return "";
}

export type CookieScope = {
  host: string;
  sharedDomain: string | undefined;
  isSecureContext: boolean;
};

/**
 * Satu-satunya sumber kebenaran untuk memilih scope cookie sesi.
 *
 * getRequestHost memprioritaskan x-forwarded-host tanpa fallback ke host,
 * sehingga header upstream yang tidak dikenal justru MENURUNKAN scope ke
 * host-only (regresi). Fungsi ini menguji tiap kandidat (x-forwarded-host →
 * host → host dari fallbackUrl) dan memakai kandidat PERTAMA yang menghasilkan
 * apex dikenal — sehingga tidak pernah menurunkan konfigurasi yang sudah benar.
 */
export function resolveCookieScope(
  headers: { get: (name: string) => string | null },
  fallbackUrl?: string
): CookieScope {
  const candidates: string[] = [];
  const forwarded = headers.get("x-forwarded-host");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) candidates.push(first);
  }
  const host = headers.get("host");
  if (host) candidates.push(host);
  if (fallbackUrl) {
    try {
      candidates.push(new URL(fallbackUrl).host);
    } catch {
      /* abaikan */
    }
  }

  for (const candidate of candidates) {
    const apex = getCookieApex(candidate);
    if (apex) {
      return {
        host: candidate,
        sharedDomain: `.${apex}`,
        isSecureContext: true
      };
    }
  }

  const resolvedHost = candidates[0] ?? "";
  return {
    host: resolvedHost,
    sharedDomain: undefined,
    isSecureContext: isSecureAuthHost(resolvedHost)
  };
}

/**
 * Nama cookie sesi Supabase Auth: sb-<project-ref>-auth-token (+ .N per chunk).
 * Dipakai migrasi client satu-kali yang menghapus varian host-only basi.
 * (Pengecualian: *-code-verifier tidak ikut — masih dibutuhkan flow OAuth berjalan.)
 */
export function isSupabaseAuthCookieName(name: string, supabaseUrl?: string): boolean {
  const url = supabaseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  try {
    const projectRef = new URL(url).hostname.split(".")[0];
    if (!projectRef) return false;
    const baseKey = `sb-${projectRef}-auth-token`;
    return name === baseKey || name.startsWith(`${baseKey}.`);
  } catch {
    return false;
  }
}

/**
 * Hapus varian HOST-ONLY cookie sesi Supabase milik project ref sendiri.
 * Dipakai callback OAuth setelah setSession() sukses: sesi baru sudah
 * ditulis Domain=.apex, sehingga varian host-only yang tersisa hanyalah
 * artefak basi milik akun lain — cookie.parse (first-wins) bisa membuat
 * akun lama menang di document.cookie. No-op di localhost (di sana
 * host-only adalah scope kanonik; shared domain tidak ada).
 * *-code-verifier dilewati (masih dibutuhkan flow OAuth berjalan).
 */
export function purgeHostOnlySupabaseAuthCookies(): void {
  if (typeof document === "undefined") return;
  // Tanpa shared domain (localhost/dev) host-only = scope kanonik → jangan dihapus.
  if (!getSharedCookieDomain(window.location.hostname)) return;
  for (const part of document.cookie.split(";")) {
    const eq = part.indexOf("=");
    const name = (eq === -1 ? part : part.slice(0, eq)).trim();
    if (!name || name.endsWith("-code-verifier")) continue;
    if (isSupabaseAuthCookieName(name)) {
      // Tanpa atribut Domain = hanya menghapus varian host-only.
      document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
    }
  }
}

/** Returns true if url is an absolute http(s) URL on a trusted host. */
export function isTrustedAuthRedirect(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return false;
    }
    // Only allow http on local loopback
    if (parsed.protocol === "http:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
      return false;
    }
    return isTrustedHostname(parsed.hostname);
  } catch {
    return false;
  }
}

type ResolvePostAuthRedirectArgs = {
  originParam: string | null;
  next: string;
  requestOrigin: string;
};

/**
 * Priority: trusted `origin` query → trusted absolute `next` → `${requestOrigin}${nextPath}`.
 */
export function resolvePostAuthRedirect({
  originParam,
  next,
  requestOrigin
}: ResolvePostAuthRedirectArgs): string {
  if (originParam) {
    const decoded = (() => {
      try {
        return decodeURIComponent(originParam);
      } catch {
        return originParam;
      }
    })();

    if (isTrustedAuthRedirect(decoded)) {
      return decoded;
    }
  }

  if (next.startsWith("http") && isTrustedAuthRedirect(next)) {
    return next;
  }

  const path = next.startsWith("/") ? next : `/${next}`;
  return `${requestOrigin}${path}`;
}
