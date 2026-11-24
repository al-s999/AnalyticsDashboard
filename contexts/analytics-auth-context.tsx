"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";
import {
  AnalyticsUser,
  UserRole,
  normalizeAnalyticsRole,
  ROLE_LABELS,
  DEMO_USERS
} from "@/types/auth-roles";

interface AnalyticsAuthContextType {
  user: AnalyticsUser | null;
  role: UserRole;
  isLoading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  switchRole?: (role: UserRole) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AnalyticsAuthContext = createContext<AnalyticsAuthContextType | undefined>(undefined);

const STORAGE_KEY = "gfs_analytics_user";

export function AnalyticsAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AnalyticsUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Helper untuk membangun objek AnalyticsUser dari record profil Supabase
  const buildAnalyticsUser = (profile: any, authUserId?: string, authEmail?: string): AnalyticsUser | null => {
    const role = normalizeAnalyticsRole(profile?.role);
    if (!role) return null;

    return {
      id: profile.id,
      authUserId: profile.auth_user_id || authUserId,
      username: profile.username || "pengguna",
      fullname: profile.fullname || profile.nickname || profile.username || "Pengguna Analitik",
      email: profile.email || authEmail || "",
      avatarUrl: profile.avatar_url || null,
      role,
      scope: {
        schoolName: profile.organization || undefined,
        city: undefined,
        province: undefined,
        assignedGroupIds: []
      }
    };
  };

  // Sinkronisasi sesi aktif Supabase
  const refreshUser = useCallback(async () => {
    try {
      const {
        data: { session },
        error: sessionError
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        // Cek localStorage jika ada sesi demo aktif
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          try {
            const parsed = JSON.parse(cached) as AnalyticsUser;
            if (parsed && parsed.role) {
              setUser(parsed);
              return;
            }
          } catch {}
        }
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select(
          "id, auth_user_id, username, fullname, nickname, email, avatar_url, role, organization, city_id, state_id, country_id"
        )
        .eq("auth_user_id", session.user.id)
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (profileError || !profile) {
        console.warn("[AnalyticsAuth] Gagal memuat data profil:", profileError?.message);
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      const analyticsUser = buildAnalyticsUser(profile, session.user.id, session.user.email);
      if (!analyticsUser) {
        console.warn(
          `[AnalyticsAuth] User role '${profile.role}' tidak memiliki izin untuk Analytics Dashboard. Menghapus sesi.`
        );
        await supabase.auth.signOut();
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      setUser(analyticsUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(analyticsUser));
    } catch (err) {
      console.error("[AnalyticsAuth] Refresh user error:", err);
      setUser(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Inisialisasi saat komponen dipasang
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        // Cek cache lokal terlebih dahulu untuk menghindari jeda tampilan
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          try {
            const parsed = JSON.parse(cached) as AnalyticsUser;
            if (parsed && parsed.role) {
              if (isMounted) setUser(parsed);
            }
          } catch {
            localStorage.removeItem(STORAGE_KEY);
          }
        }

        // Validasi ke Supabase Auth
        const {
          data: { session }
        } = await supabase.auth.getSession();

        if (!session?.user) {
          if (isMounted) {
            // Jika ada cache demo user di dev, pertahankan
            const cachedUser = localStorage.getItem(STORAGE_KEY);
            if (!cachedUser) {
              setUser(null);
            }
            setIsLoading(false);
          }
          return;
        }

        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select(
            "id, auth_user_id, username, fullname, nickname, email, avatar_url, role, organization, city_id, state_id, country_id"
          )
          .eq("auth_user_id", session.user.id)
          .order("id", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (profileErr || !profile) {
          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }

        const analyticsUser = buildAnalyticsUser(profile, session.user.id, session.user.email);
        if (!analyticsUser) {
          console.warn(`[AnalyticsAuth] Sesi login dengan role '${profile.role}' tidak berhak akses analitik.`);
          await supabase.auth.signOut();
          if (isMounted) {
            setUser(null);
            localStorage.removeItem(STORAGE_KEY);
            setIsLoading(false);
          }
          return;
        }

        if (isMounted) {
          setUser(analyticsUser);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(analyticsUser));
          setIsLoading(false);
        }
      } catch (e) {
        console.error("[AnalyticsAuth] Init auth error:", e);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // Dengarkan perubahan state auth Supabase (login, logout, token refresh)
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        if (isMounted) {
          // Hanya clear jika bukan demo session aktif di localStorage
          const cached = localStorage.getItem(STORAGE_KEY);
          if (!cached) {
            setUser(null);
          }
          setIsLoading(false);
        }
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (isMounted) {
          await refreshUser();
          setIsLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [refreshUser]);

  // Login dengan Email/Username & Password melalui Route API /api/auth/login
  const login = async (emailOrUsername: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrUsername, password })
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Gagal masuk.");
      }

      // Sinkronkan sesi ke Supabase Browser Client bila accessToken tersedia
      if (result.accessToken && result.refreshToken) {
        await supabase.auth
          .setSession({
            access_token: result.accessToken,
            refresh_token: result.refreshToken
          })
          .catch(() => {});
      }

      setUser(result.user);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result.user));

      // Arahkan ke rute dashboard sesuai role
      router.push(result.homePath || ROLE_LABELS[result.role as UserRole]?.homePath || "/dashboard/teacher");
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  // Login dengan Google OAuth
  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const directCallbackUrl = `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: directCallbackUrl,
          queryParams: {
            access_type: "offline",
            prompt: "select_account"
          }
        }
      });

      if (error) throw error;
    } catch (err: any) {
      setIsLoading(false);
      throw err;
    }
  };

  // Kompatibilitas switchRole jika dipanggil
  const switchRole = (newRole: UserRole) => {
    if (user && user.role === newRole) return;
    if (user) {
      const updated = { ...user, role: newRole };
      setUser(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      document.cookie = `user-role=${newRole}; path=/; max-age=604800; samesite=lax`;
      router.push(ROLE_LABELS[newRole].homePath);
    }
  };

  // Logout - Memanggil /api/auth/logout untuk membersihkan semua cookies
  const logout = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
      await supabase.auth.signOut({ scope: "local" }).catch(() => {});
    } catch (err) {
      console.warn("[AnalyticsAuth] Logout error:", err);
    } finally {
      setUser(null);
      localStorage.removeItem(STORAGE_KEY);
      // Hapus cookie langsung dari document.cookie
      document.cookie = "auth-token=; path=/; max-age=0; samesite=lax";
      document.cookie = "sb-access-token=; path=/; max-age=0; samesite=lax";
      document.cookie = "user-role=; path=/; max-age=0; samesite=lax";
      setIsLoading(false);
      router.push("/login");
    }
  };

  const activeRole: UserRole = user?.role || "teacher";

  return (
    <AnalyticsAuthContext.Provider
      value={{
        user,
        role: activeRole,
        isLoading,
        login,
        loginWithGoogle,
        switchRole,
        logout,
        refreshUser
      }}
    >
      {children}
    </AnalyticsAuthContext.Provider>
  );
}

export function useAnalyticsAuth() {
  const context = useContext(AnalyticsAuthContext);
  if (!context) {
    throw new Error("useAnalyticsAuth must be used within an AnalyticsAuthProvider");
  }
  return context;
}
