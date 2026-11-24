"use client";

// AuthContext

import type React from "react";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-browser";
import { isSupabaseAuthCookieName, getSharedCookieDomain } from "@/lib/auth-redirect";

/**
 * Bersihkan semua kunci identitas game dari localStorage. Dipakai saat
 * logout/switch akun supaya akun yang baru login tidak mewarisi profil atau
 * participant akun sebelumnya (mis. akun B menempel di akun A).
 */
export function clearIdentityStorageKeys() {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (
        key === "user_id" ||
        key === "pin" ||
        key === "current_profile_id" ||
        key === "current_participant_id" ||
        key === "current_game_session" ||
        key === "current_host_id" ||
        key.startsWith("game_participant_") ||
        key.startsWith("game_host_") ||
        // State posisi main (flag + index) per sesi — sampah kalau dibiarkan:
        // tidak pernah terhapus, menumpuk tiap game, dan berpotensi jadi
        // petunjuk identitas basi di device bersama.
        key.startsWith("player_game_state_")
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* best-effort */
  }
}

// Guard: hanya lakukan sekali per user per load halaman (hindari query ekstra
// saat refreshProfile dipanggil berulang dari berbagai aksi).
const duplicateCheckedUsers = new Set<string>();

/**
 * Deteksi pasif baris profil ganda per auth_user_id (akibat bug lama yang
 * membuat BANYAK baris profil untuk satu akun). Tidak butuh akses dashboard:
 * saat login normal, hasilnya muncul di console browser. Aman (try/catch).
 */
async function detectDuplicateProfiles(userId: string): Promise<void> {
  try {
    if (duplicateCheckedUsers.has(userId)) return;
    duplicateCheckedUsers.add(userId);
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", userId);
    if (error) {
      console.debug("[Auth] Duplicate-profile check skipped:", error.message);
      return;
    }
    const count = data?.length ?? 0;
    if (count > 1) {
      console.warn(
        `[Auth] DUPLICATE PROFILES: ${count} rows untuk auth_user_id ${userId}. ` +
          "Semua lookup profil kini deterministik (.order(id).limit(1)), tapi " +
          "disarankan migration dedupe + unique index."
      );
    }
  } catch {
    /* best-effort: jangan ganggu flow login */
  }
}

/**
 * Bersihkan varian cookie sesi HOST-ONLY tiap boot — dijalankan SETIAP load,
 * bukan one-shot, karena varian basi bisa muncul kapan saja (path yang pernah
 * menulis host-only, token-refresh yang men-tulis scope lain, dll). Di mode
 * shared-domain, varian host-only selalu artefak basi: scope kanonik adalah
 * Domain=.apex.
 *
 * Aman tanpa aksi yang salah (berbeda dari versi lama yang mempromosikan dulu):
 * 1. snapshot sesi yang terbaca prioritas browser;
 * 2. hapus varian host-only via document.cookie (tidak collapse, tidak menyentuh
 *    varian domain);
 * 3. baca ulang document.cookie LANGSUNG (bukan getSession, agar cache in-memory
 *    auth-js tidak mengaburkan) — bila tidak ada cookie tersisa padahal tadi ada
 *    sesi, berarti sesi itu satu-satunya di varian host-only → tulis ulang via
 *    setSession ke scope kanonik. Setelah purge tidak ada kandidat bersaing,
 *    jadi promosi ini deterministik.
 *
 * Melewati *-code-verifier (masih dibutuhkan bila OAuth sedang berjalan).
 * Saat flag auth_flow_active menyala (callback memproses), varian host-only
 * tetap dihapus, tapi TANPA langkah promosi (setSession): sesi lama yang
 * terbaca saat callback sedang berjalan bisa jadi sesi basi akun lain —
 * mempromosikannya ke scope kanonik justru menghidupkan akun salah.
 * Callback sendiri menetapkan sesi barunya via setSession + purge sendiri.
 * No-op di localhost/dev karena di sana host-only adalah scope kanonik.
 */
async function purgeHostOnlyAuthCookies(): Promise<void> {
  try {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    if (!getSharedCookieDomain(window.location.hostname)) return;

    const names = new Set<string>();
    for (const part of document.cookie.split(";")) {
      const eq = part.indexOf("=");
      const n = (eq === -1 ? part : part.slice(0, eq)).trim();
      if (!n || n.endsWith("-code-verifier")) continue;
      if (isSupabaseAuthCookieName(n)) names.add(n);
    }
    if (names.size === 0) return;

    for (const n of names) {
      // Tanpa atribut Domain = hanya menghapus varian host-only.
      document.cookie = `${n}=; Path=/; Max-Age=0; SameSite=Lax`;
    }

    if (sessionStorage.getItem("auth_flow_active") === "true") return;

    const {
      data: { session }
    } = await supabase.auth.getSession();

    // Re-baca langsung dari document.cookie agar hasil tidak disamarkan
    // cache sesi in-memory auth-js.
    const remaining = document.cookie
      .split(";")
      .map((p) => {
        const eq = p.indexOf("=");
        return (eq === -1 ? p : p.slice(0, eq)).trim();
      })
      .filter((n) => isSupabaseAuthCookieName(n)).length;

    if (session && remaining === 0) {
      const { error } = await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      });
      if (error) {
        console.warn("[Auth] Gagal memulihkan sesi ke scope kanonik:", error.message);
      }
    }
  } catch {
    /* best-effort: jangan ganggu flow login */
  }
}

/**
 * Total byte cookie sesi Supabase yang terlihat di document.cookie
 * (cookie auth ditulis tanpa httpOnly → accessible). Dipakai size guard:
 * header Cookie request = gabungan SEMUA cookie, dan nginx (default 8k) /
 * Node (16KB) akan menolak request dengan halaman putih kalau lewat batas —
 * halaman gagal → JS tidak jalan → purge tidak sempat → harus clear manual.
 */
const COOKIE_REBUILD_BYTES = 6144;

function authCookieBytes(): number {
  if (typeof document === "undefined") return 0;
  let total = 0;
  for (const part of document.cookie.split(";")) {
    const eq = part.indexOf("=");
    const name = (eq === -1 ? part : part.slice(0, eq)).trim();
    if (!name || !isSupabaseAuthCookieName(name)) continue;
    total += part.length + 1;
  }
  return total;
}

// OPTIMIZED: Centralized profile data - single source of truth
export interface ProfileData {
  id: string;
  auth_user_id: string;
  username: string;
  fullname: string | null;
  nickname: string | null;
  avatar_url: string | null;
  role: string | null;
  language: string | null;
  country_id: number | null;
  state_id: number | null;
  city_id: number | null;
  countries?: { iso2: string; name: string } | null;
  is_blocked: boolean;
  blocked_at: string | null;
  email: string | null;
  phone: string | null;
  birthdate: string | null;
  grade: string | null;
  organization: string | null;
  gender: string | null;
  favorite_quiz: { favorites: string[] } | null;
  notifications: any[] | null;
  timezone: string | null;
  gmt_offset: number | null;
  location: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: ProfileData | null;
  profileId: string | null;
  loading: boolean;
  profileLoading: boolean;
  authReady: boolean;
  refreshProfile: (userId?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    username: string,
    fullname: string,
    nickname: string,
    grade: string,
    countryId?: number | null,
    stateId?: number | null,
    cityId?: number | null,
    phone?: string | null,
    captchaToken?: string | null
  ) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // Guard: coordinate concurrent fetchProfile calls for the same user.
  // Holds the in-flight promise so a second call awaits it instead of being
  // silently dropped (prevents /required staying stuck on the profile spinner
  // when the profile row is still being created right after Google OAuth).
  const fetchingForRef = useRef<{ userId: string; promise: Promise<boolean> } | null>(null);

  // OPTIMIZED: Fetch complete profile data in ONE query
  const fetchProfile = async (userId: string) => {
    const inFlight = fetchingForRef.current;
    if (inFlight && inFlight.userId === userId) {
      // Tunggu fetch yang sedang berjalan. Keluar hanya jika fetch tadi
      // benar-benar berhasil memuat profil; jika tidak, lanjut coba lagi
      // (profil mungkin masih dalam proses pembuatan tepat setelah OAuth).
      if ((await inFlight.promise) === true) {
        return;
      }
    }

    const run = async (): Promise<boolean> => {
      let data: any = null;
      let fetchError: any = null;

      // Retry ringan untuk koneksi lambat/tidak stabil, termasuk balapan
      // pembuatan profil (PGRST116) tepat setelah OAuth membuat baris baru.
      const maxAttempts = 4;
      const baseDelayMs = 350;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const result = await supabase
            .from("profiles")
            .select(
              `
          id,
          auth_user_id,
          username,
          fullname,
          nickname,
          avatar_url,
          role,
          language,
          country_id,
          state_id,
          city_id,
          countries (iso2, name),
          is_blocked,
          blocked_at,
          email,
          phone,
          birthdate,
          grade,
          organization,
          gender,
          favorite_quiz,
          notifications,
          timezone,
          gmt_offset,
          location
        `
            )
            .eq("auth_user_id", userId)
            .order("id", { ascending: true })
            .limit(1)
            .maybeSingle();
          data = result.data;
          fetchError = result.error;
          if (!fetchError && data) break;
        } catch (err) {
          fetchError = err;
        }
        if (attempt < maxAttempts - 1) {
          await new Promise((r) => setTimeout(r, baseDelayMs * (attempt + 1)));
        }
      }

      if (fetchError) {
        console.error("Error fetching profile:", fetchError);
        // Jangan biarkan identitas lama (akun lain) menempel tanpa disadari.
        localStorage.removeItem("user_id");
        localStorage.removeItem("current_profile_id");
        return false;
      }

      if (!data) {
        localStorage.removeItem("user_id");
        localStorage.removeItem("current_profile_id");
        return false;
      }

      // Type assertion needed because query result type inference might be truncated
      const safeData = data as unknown as ProfileData;

      // Store PROFILE ID (not auth_user_id) to localStorage as requested
      localStorage.setItem("user_id", safeData.id);

      setProfile(safeData);
      setProfileId(safeData.id);

      // Deteksi pasif baris profil ganda untuk user ini (log ke console).
      void detectDuplicateProfiles(userId);

      // Detect and sync timezone/gmt_offset silently if mismatched
      let deviceTimezone = "UTC";
      try {
        deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      } catch (tzErr) {
        console.warn("[Timezone Detection] Browser failed to resolve timeZone:", tzErr);
      }

      const deviceGmtOffset = -(new Date().getTimezoneOffset() / 60);

      if (
        !safeData.timezone ||
        safeData.gmt_offset === null ||
        safeData.timezone !== deviceTimezone ||
        Number(safeData.gmt_offset) !== deviceGmtOffset
      ) {
        console.log(
          `[Timezone Sync] Mismatch detected. Updating profile to timezone: ${deviceTimezone}, gmt_offset: ${deviceGmtOffset}...`
        );
        supabase
          .from("countries")
          .select("id")
          .contains("timezones", [{ zoneName: deviceTimezone }])
          .maybeSingle()
          .then(async ({ data: countryData }) => {
            let matchedCountryId = safeData.country_id || null;
            const updatePayload: any = {
              timezone: deviceTimezone,
              gmt_offset: deviceGmtOffset
            };

            if (countryData) {
              const newCountryId = countryData.id;
              if (safeData.country_id && safeData.country_id !== newCountryId) {
                updatePayload.state_id = null;
                updatePayload.city_id = null;
              }
              matchedCountryId = newCountryId;
            }

            updatePayload.country_id = matchedCountryId;

            const { error: updateErr } = await supabase
              .from("profiles")
              .update(updatePayload)
              .eq("id", safeData.id);

            if (updateErr) {
              console.error(
                "[Timezone Sync] Failed to update timezone/location:",
                updateErr.message
              );
            } else {
              console.log("[Timezone Sync] Timezone/location updated successfully in database.");
              // Update local state too so we don't fetch again
              setProfile((prev) =>
                prev
                  ? {
                      ...prev,
                      timezone: deviceTimezone,
                      gmt_offset: deviceGmtOffset,
                      country_id: matchedCountryId
                    }
                  : null
              );
            }
          });
      }

      return true;
    };

    const promise = run().finally(() => {
      if (fetchingForRef.current?.promise === promise) {
        fetchingForRef.current = null;
      }
    });
    fetchingForRef.current = { userId, promise };
    await promise;
  };

  const refreshProfile = async (userId?: string) => {
    const targetUserId = userId ?? user?.id;
    if (targetUserId) {
      // Hanya set loading jika profil belum pernah dimuat (initial)
      if (!profile) setProfileLoading(true);
      await fetchProfile(targetUserId);
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    // Keep Supabase auth cookies intact so the session can be restored correctly
    // after refreshes, tab switches, and visibility changes.
    let currentUserId: string | null | undefined = undefined;

    // Guard: prevent reload loop right after setSession() in OAuth callback.
    // The callback page sets sessionStorage "auth_flow_active" before navigation,
    // and checkSession() honours a 2-second cooldown after it.
    let justSetSessionTimestamp = 0;
    const SESSION_COOLDOWN_MS = 2_000;

    // Get initial session
    const initSession = async () => {
      // Bersihkan varian host-only basi di tiap load. Server TIDAK bisa
      // melakukannya (store Next collapse by-name: clear+set nama-sama hanya
      // mengirim write terakhir), tapi document.cookie tidak collapse — tiap
      // assignment adalah 1 cookie. Tanpa Domain = tepat menghapus varian
      // host-only, varian .apex tidak tersentuh.
      await purgeHostOnlyAuthCookies();

      // Size guard: purge di atas hanya menghapus varian host-only. Chunk
      // basi/varian domain yang menumpuk (mis. dari penulis lama) tetap ada
      // dan ikut terkirim tiap request → header bisa melewati batas
      // nginx/Node → halaman putih yang tidak bisa sembuh sendiri.
      // refreshSession menulis ulang session lewat lib: chunk basi dibersihkan
      // (removeChunks) dan ukuran kembali normal. Sekali per load, hanya bila
      // melewati ambang.
      const cookieBytes = authCookieBytes();
      if (cookieBytes > COOKIE_REBUILD_BYTES) {
        console.warn(
          `[Auth] cookie sesi ${cookieBytes}B > ${COOKIE_REBUILD_BYTES}B — refresh paksa untuk menulis ulang`
        );
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.warn("[Auth] Refresh paksa gagal:", refreshError.message);
        }
      }

      const {
        data: { session }
      } = await supabase.auth.getSession();
      currentUserId = session?.user?.id || null;
      setUser(session?.user ?? null);
      if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
        const lastAuthUid = localStorage.getItem("last_auth_user_id");
        if (session?.user) {
          if (lastAuthUid && lastAuthUid !== session.user.id) {
            console.log("[Auth] Different user detected on initSession. Purging stale game identity keys...");
            clearIdentityStorageKeys();
          }
          localStorage.setItem("last_auth_user_id", session.user.id);
        } else if (lastAuthUid) {
          clearIdentityStorageKeys();
          localStorage.removeItem("last_auth_user_id");
        }
      }

      // Log diagnostik sinkronisasi sesi (lihat via console browser).
      if (typeof document !== "undefined") {
        const authCookieCount = document.cookie
          .split(";")
          .map((p) => {
            const eq = p.indexOf("=");
            return (eq === -1 ? p : p.slice(0, eq)).trim();
          })
          .filter((n) => isSupabaseAuthCookieName(n)).length;
        console.log(
          `[Auth] initSession user=${session?.user?.email ?? "(guest)"} ` +
            `authCookies=${authCookieCount}`
        );
      }

      // Mark auth as ready immediately so NavUser can render
      // profile as soon as ANY fetchProfile call succeeds
      setLoading(false);
      setAuthReady(true);
      setInitialLoad(false);

      if (session?.user) {
        setProfileLoading(true);
        await fetchProfile(session.user.id);
        setProfileLoading(false);

        // SSO REDIRECT: Jika sudah login tapi ada di /login atau /register, lempar ke /callback
        // SKIP jika OAuth flow sedang aktif (callback page sedang memproses)
        const authFlowActive = sessionStorage.getItem("auth_flow_active") === "true";
        const pathname = window.location.pathname;
        if (!authFlowActive && pathname === "/login") {
          console.log("[SSO] User sudah login, mengalihkan dari halaman auth ke /callback...");
          window.location.href = "/callback";
        }

        // Clear the flag once we reach here (session is established)
        if (authFlowActive) {
          sessionStorage.removeItem("auth_flow_active");
        }
      } else {
        setProfileLoading(false);
      }
    };

    initSession();

    // Called by callback page right after setSession() to suppress the cooldown
    const markSessionJustSet = () => {
      justSetSessionTimestamp = Date.now();
    };

    // Expose globally so callback page can call it
    (window as any).__authMarkSessionJustSet = markSessionJustSet;

    // Check if there is a session change (across subdomains)
    let lastCheckSessionTime = 0;
    const CHECK_COOLDOWN_MS = 5_000; // Minimal jeda antar checkSession (5 detik)

    const checkSession = async () => {
      try {
        // Skip reload if setSession() was called very recently (OAuth callback flow)
        if (Date.now() - justSetSessionTimestamp < SESSION_COOLDOWN_MS) {
          return;
        }

        // Cooldown: cegah checkSession dipanggil > 1x dalam 5 detik
        // (focus + visibilitychange keduanya fire saat balik tab, tanpa ini double-check)
        const now = Date.now();
        if (now - lastCheckSessionTime < CHECK_COOLDOWN_MS) {
          return;
        }
        lastCheckSessionTime = now;

        // FIX #1: Gunakan getSession() dulu (in-memory, tanpa network).
        // Hanya panggil getUser() (network) jika ada sesi aktif.
        // Ini mencegah false-positive null saat token sedang di-refresh otomatis.
        const getUser = async (): Promise<string | null> => {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return null;
          const { data } = await supabase.auth.getUser();
          return data?.user?.id || null;
        };

        let newUserId = await getUser();

        // Skip reload on active gameplay routes — a reload there kicks the
        // player out mid-game (tryout play screen). Just adopt the change.
        const pathname = window.location.pathname;
        const isGameplayRoute =
          pathname.startsWith("/player") || pathname.startsWith("/play");

        // FIX #2: getUser() bisa transiently null saat token-refresh race.
        // Retry dengan delay lebih lama (1500ms) + retry kedua sebagai safety net.
        if (
          !isGameplayRoute &&
          currentUserId !== undefined &&
          newUserId !== currentUserId &&
          !newUserId
        ) {
          await new Promise((r) => setTimeout(r, 1500));
          newUserId = await getUser();

          // Safety net: retry kedua jika masih null
          if (!newUserId) {
            await new Promise((r) => setTimeout(r, 1000));
            newUserId = await getUser();
          }
        }

        // FIX #3: Jika currentUserId ada tapi newUserId masih null setelah retry
        // → ini hampir pasti race condition token-refresh, BUKAN genuine session change.
        // Skip reload untuk mencegah dashboard reload sia-sia saat pindah tab.
        if (currentUserId && !newUserId) {
          console.log(
            "[AuthContext] getUser null while session exists — skipping reload (token refresh race)"
          );
          return;
        }

        if (currentUserId === undefined || newUserId === currentUserId) {
          // Tidak perlu fetchProfile di sini — profile sudah dimuat saat init / SIGNED_IN.
          // Memanggilnya lagi setiap tab-switch hanya menyebabkan skeleton flash sia-sia.
          return;
        }

        if (isGameplayRoute) {
          currentUserId = newUserId;
          if (newUserId) fetchProfile(newUserId);
          return;
        }

        // Reload hanya untuk genuine session change: user ganti akun atau logout di tab lain
        console.warn("[AuthContext] Session change detected across tabs:", { from: currentUserId, to: newUserId });
        currentUserId = newUserId;
        if (!newUserId) {
          // User logout di tab lain: bersihkan state dan arahkan ke login
          setUser(null);
          setProfile(null);
          setProfileId(null);
          const pathname = window.location.pathname;
          const isProtected = [
            "/dashboard",
            "/host",
            "/quiz",
            "/learn",
            "/tryout",
            "/join",
            "/stat",
            "/friends",
            "/groups",
            "/evaluation",
            "/history"
          ].some((p) => pathname.startsWith(p));
          if (isProtected) {
            window.location.href = "/login";
          }
        } else {
          // User ganti akun di tab lain: update sesi dan muat profil baru secara halus
          supabase.auth.getUser().then(({ data }) => {
            if (data?.user) {
              setUser(data.user);
              fetchProfile(data.user.id);
            }
          });
        }
      } catch (err) {
        console.error("[AuthContext] Error checking session:", err);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkSession();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    // Tidak pakai event 'focus' — terlalu sensitif, menyala di setiap klik browser.
    // visibilitychange sudah cukup untuk deteksi user balik ke tab.

    // Listen for auth changes in current tab
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (event === "SIGNED_IN" && currentUser) {
        // FIX E: Supabase mengirim SIGNED_IN setiap token refresh (~tiap jam),
        // bukan hanya saat login baru. Jika user sudah login dengan akun SAMA,
        // jangan reset state (setProfile null) — ini yang menyebabkan skeleton
        // flash / 'reload' setiap balik tab setelah token di-refresh.
        const isSameUser = currentUserId === currentUser.id;

        if (!isSameUser) {
          // Akun berbeda (genuine login baru / switch akun) — reset bersih
          setProfile(null);
          setProfileId(null);
          clearIdentityStorageKeys();
        }

        currentUserId = currentUser.id;

        if (!isSameUser) {
          // Hanya load profil baru jika akun berbeda
          setProfileLoading(true);
          fetchProfile(currentUser.id).finally(() => setProfileLoading(false));
        }
        // Jika akun sama (token refresh) — profil sudah ada di state, tidak perlu apa-apa
      } else if (event === "SIGNED_OUT") {
        currentUserId = null;
        localStorage.removeItem("user_id"); // Clear from localStorage
        localStorage.removeItem("last_auth_user_id");
        clearIdentityStorageKeys();
        setUser(null);
        setProfile(null);
        setProfileId(null);
        setProfileLoading(false);
        checkSession();

        // FORCE REDIRECT: Jika sedang di dashboard/protected, tendang ke login
        if (typeof window !== "undefined") {
          const pathname = window.location.pathname;
          const isProtected = [
            "/dashboard",
            "/host",
            "/quiz",
            "/learn",
            "/tryout",
            "/join",
            "/stat"
          ].some((p) => pathname.startsWith(p));
          if (isProtected) {
            window.location.href = "/login";
          }
        }
      }

      if (!initialLoad) {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      delete (window as any).__authMarkSessionJustSet;
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
  };

  // const signUp = async (
  //   email: string,
  //   password: string,
  //   username: string,
  //   nickname: string,
  //   fullname: string,
  //   countryId?: number | null,
  //   stateId?: number | null,
  //   cityId?: number | null,
  //   phone?: string | null
  // ) => {
  //   console.log("🔵 Starting signUp process...");

  //   const { data, error } = await supabase.auth.signUp({
  //     email,
  //     password
  //   });

  //   if (error) {
  //     console.error("❌ Auth signUp error:", error);
  //     throw error;
  //   }

  //   console.log("✅ Auth user created:", data.user?.id);

  //   if (data.user) {
  //     // Wait a bit to ensure auth user is committed to database
  //     await new Promise((resolve) => setTimeout(resolve, 500));

  //     // Create profile with all required fields
  //     // NOTE: Don't pass 'id' - the trigger will auto-generate XID
  //     // Pass 'auth_user_id' to link with auth.users table
  //     const profileData: any = {
  //       auth_user_id: data.user.id,
  //       username,
  //       email,
  //       nickname,
  //       fullname: fullname || null,
  //       country_id: countryId || null,
  //       state_id: stateId || null,
  //       city_id: cityId || null,
  //       phone: phone || null,
  //       avatar_url: null
  //     };

  //     console.log("🔵 Creating profile with data:", profileData);

  //     // Retry logic for profile creation (max 3 attempts)
  //     let attempts = 0;
  //     let insertedProfile = null;
  //     let profileError = null;

  //     while (attempts < 3) {
  //       attempts++;
  //       console.log(`🔄 Profile creation attempt ${attempts}/3`);

  //       const result = await supabase.from("profiles").insert(profileData).select();

  //       insertedProfile = result.data;
  //       profileError = result.error;

  //       if (!profileError) {
  //         console.log("✅ Profile created successfully:", insertedProfile);
  //         break;
  //       }

  //       console.warn(`⚠️ Attempt ${attempts} failed:`, profileError);

  //       // Wait before retry (exponential backoff)
  //       if (attempts < 3) {
  //         await new Promise((resolve) => setTimeout(resolve, 500 * attempts));
  //       }
  //     }

  //     if (profileError) {
  //       console.error("❌ Profile creation failed after 3 attempts:", profileError);
  //       throw new Error(`Failed to create profile: ${profileError.message || "Unknown error"}`);
  //     }
  //   } else {
  //     console.error("❌ No user data returned from signUp");
  //     throw new Error("No user data returned from signUp");
  //   }
  // };

  const signUp = async (
    email: string,
    password: string,
    username: string,
    nickname: string,
    fullname: string,
    grade: string,
    countryId?: number | null,
    stateId?: number | null,
    cityId?: number | null,
    phone?: string | null,
    captchaToken?: string | null
  ) => {
    console.log("🔵 Starting signUp process...");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/callback`,
        captchaToken: captchaToken || undefined,
        data: {
          username,
          full_name: fullname
        }
      }
    });

    if (error) {
      console.error("❌ Auth signUp error:", error);
      throw error;
    }

    console.log("✅ Auth user created:", data.user);

    // SAFETY NET: Check if profile was created by trigger
    if (data.user) {
      console.log("🔍 Checking if profile exists...");

      // Wait a bit for trigger to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { data: profileCheck, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', data.user.id)
        .order('id', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (profileError || !profileCheck) {
        console.warn("⚠️ Profile not found, creating manually as fallback...");

        // Manual profile creation as fallback
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            auth_user_id: data.user.id,
            username,
            email,
            fullname,
            nickname,
            grade,
            phone,
            country_id: countryId,
            state_id: stateId,
            city_id: cityId,
            language: 'en',
            is_blocked: false
          });

        if (insertError) {
          console.error("❌ Manual profile creation failed:", insertError);
        } else {
          console.log("✅ Profile created manually");
        }
      } else {
        console.log("✅ Profile exists (created by trigger)");
      }
    }

    // Jika Email Confirmation aktif dan tidak ada session
    if (!data.session) {
      console.log("📧 Email confirmation required. Verification email sent.");
      return;
    }

    // Jika auto-confirm atau session tersedia, fetch profile
    if (data.session && data.user) {
      console.log("✅ Session created, fetching profile...");
      await fetchProfile(data.user.id);
    }
  };

  const signOut = async () => {
    // Jangan menyerah sebelum cleanup: kegagalan jaringan di signOut() tidak
    // boleh menyisakan sesi basi/kunci identitas akun sebelumnya. Catat error
    // lalu selalu jalankan pembersihan lokal — caller boleh redirect setelahnya.
    try {
      // Gunakan scope "local" agar hanya mengeluarkan perangkat saat ini.
      // Sesi akun yang sama di perangkat lain tetap aktif dan tidak ikut terlogout.
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) {
        console.warn("[Auth] signOut() mengembalikan error:", error.message);
      }
    } catch (err) {
      console.warn("[Auth] signOut() gagal:", err);
    }

    if (typeof document !== "undefined") {
      // Clear role cookie (host-only + varian shared-domain bila ada).
      const sharedDomain = getSharedCookieDomain(window.location.hostname);
      document.cookie = "role=; path=/; max-age=0; SameSite=Lax";
      document.cookie = "auth-redirect=; path=/; max-age=0; SameSite=Lax";
      document.cookie = "external-redirect=; path=/; max-age=0; SameSite=Lax";
      // Cookie redirect di-set dengan domain bersama (sharedCookieFlags di
      // login/register form) — tanpa ini varian .apex tidak pernah terhapus
      // dan memicu ghost redirect setelah logout.
      if (sharedDomain) {
        document.cookie = `role=; path=/; max-age=0; SameSite=Lax; Secure; domain=${sharedDomain}`;
        document.cookie = `auth-redirect=; path=/; max-age=0; SameSite=Lax; Secure; domain=${sharedDomain}`;
        document.cookie = `external-redirect=; path=/; max-age=0; SameSite=Lax; Secure; domain=${sharedDomain}`;
      }
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("pending_external_redirect");
      localStorage.removeItem("oauth_redirect_path");
      localStorage.removeItem("oauth_game_pin");
      // clearIdentityStorageKeys kini juga membersihkan user_id dan pin.
      localStorage.removeItem("last_auth_user_id");
      clearIdentityStorageKeys();
      sessionStorage.removeItem("auth_flow_active");
    }

    // Remove the force redirect - let the component handle navigation
    // window.location.href = "/"
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, profileId, loading, profileLoading, authReady, refreshProfile, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
