import { createBrowserClient } from "@supabase/ssr";
import { clientEnv, validateClientEnv } from "./env-config";
import { getSharedCookieDomain, isSecureAuthHost } from "./auth-redirect";
import type { Database } from "./database.types";

// Validate environment configuration
const envValidation = validateClientEnv();
if (!envValidation.isValid) {
  console.error("❌ Supabase configuration errors:");
  envValidation.errors.forEach((error) => console.error(`  - ${error}`));

  if (process.env.NODE_ENV === "production") {
    console.error("⚠️ Supabase config invalid in production - app may not function correctly");
  }
}

const supabaseUrl = clientEnv.supabase.url || "https://placeholder.supabase.co";
const supabaseAnonKey = clientEnv.supabase.anonKey || "placeholder-key";

if (supabaseUrl === "https://placeholder.supabase.co" || supabaseAnonKey === "placeholder-key") {
  console.warn("⚠️ Supabase credentials not configured. Using placeholder values.");
}

// Sharing cookie per-apex (gameforsmart.com / ubig.my.id / ubigdev.com),
// satu sumber kebenaran di lib/auth-redirect.ts
const getSharedDomain = () => {
  if (typeof window === "undefined") return undefined;
  return getSharedCookieDomain(window.location.hostname);
};

const isSecureHost = () => {
  if (typeof window === "undefined") return false;
  return isSecureAuthHost(window.location.hostname);
};

const isProd = typeof window !== "undefined" && isSecureHost();

export const supabase = typeof window !== "undefined"
  ? createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
      realtime: { params: { eventsPerSecond: 10 } },
      cookieOptions: {
        domain: getSharedDomain(),
        path: "/",
        sameSite: "lax",
        secure: isProd,
      },
      cookieEncoding: "raw",
      cookies: {
        encode: "tokens-only"
      }
    })
  : createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
      realtime: { params: { eventsPerSecond: 10 } },
      cookieOptions: {
        path: "/",
        sameSite: "lax",
        secure: false,
      },
      cookieEncoding: "raw",
    });
