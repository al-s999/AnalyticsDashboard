import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { clientEnv } from "./env-config";
import { resolveCookieScope } from "./auth-redirect";
import type { Database } from "./database.types";

export const createClient = async () => {
  const cookieStore = await cookies();

  // Wajib sama dengan login route / OAuth callback / proxy. Host mentah di
  // balik reverse proxy bisa berisi alamat upstream sehingga scope cookie
  // RSC berbeda dari browser client -> menimbulkan cookie sesi ganda.
  const { sharedDomain, isSecureContext } = resolveCookieScope(await headers());

  return createServerClient<Database>(
    clientEnv.supabase.url || "",
    clientEnv.supabase.anonKey || "",
    {
      cookieEncoding: "raw",
      cookies: {
        encode: "tokens-only",
        getAll() {
          return cookieStore.getAll();
        },

        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const cookieOptions = {
                ...options,
                // Jangan paksa httpOnly: true pada cookie auth Supabase,
                // karena @supabase/ssr membutuhkan akses ke document.cookie di browser client
                httpOnly: options.httpOnly ?? false,
                secure: isSecureContext,
                sameSite: "lax" as const,
                ...(sharedDomain && { domain: sharedDomain })
              };
              cookieStore.set(name, value, cookieOptions);
            });
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        }

      }
    }
  );
};
