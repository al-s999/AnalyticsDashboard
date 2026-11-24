import { useState, useEffect, useCallback, useRef } from "react";
import {
  Language,
  setLanguage,
  getCurrentLanguage,
  initializeI18n,
  supportedLanguages,
} from "@/lib/i18n";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";

export const useI18n = () => {
  const { t, i18n } = useTranslation();
  // ✅ FIX HYDRATION: Gunakan 'en' sebagai default awal (sama dengan SSR).
  // Nilai sebenarnya (dari localStorage/profile) akan diset di useEffect setelah mount.
  // Ini mencegah mismatch antara HTML yang dirender server vs client.
  const [currentLanguage, setCurrentLanguage] = useState<Language>('id');
  const [isLoading, setIsLoading] = useState(true);
  // OPTIMIZED: Use profile from AuthContext instead of separate query
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const initialized = useRef(false);

  // OPTIMIZED: Initialize i18n using profile from context
  useEffect(() => {
    const initialize = async () => {
      // Wait for auth to finish loading
      if (authLoading) return;
      
      setIsLoading(true);
      try {
        if (user && profile?.language) {
          // User is logged in and profile has language → always apply it
          const rawLang = profile.language;
          const userLanguage = (rawLang.replace(/['\"]/g, "") || "en") as Language;
          await initializeI18n(userLanguage);
          setCurrentLanguage(getCurrentLanguage());
          initialized.current = true;
        } else if (!user) {
          // Not logged in → use localStorage or default (only once)
          if (!initialized.current) {
            await initializeI18n();
            setCurrentLanguage(getCurrentLanguage());
            initialized.current = true;
          }
        } else {
          // User logged in but profile not loaded yet → use localStorage/default temporarily
          if (!initialized.current) {
            await initializeI18n();
            setCurrentLanguage(getCurrentLanguage());
          }
        }
      } catch (error) {
        console.error("Failed to initialize i18n:", error);
        await initializeI18n();
        setCurrentLanguage(getCurrentLanguage());
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [user, profile?.language, authLoading]);

  // Update current language state when i18n changes
  useEffect(() => {
    if (i18n.language) {
      setCurrentLanguage(getCurrentLanguage());
    }
  }, [i18n.language]);

  // Set document direction for RTL support
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dir = currentLanguage === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = currentLanguage;
    }
  }, [currentLanguage]);

  // Change language function
  const changeLanguage = useCallback(
    async (language: Language) => {
      setIsLoading(true);
      try {
        await setLanguage(language);
        setCurrentLanguage(language);

        // Update user profile if logged in
        if (user) {
          console.log('[useI18n] Updating profile language to:', language, 'for user:', user.id);
          const profileIdToUpdate = profile?.id;
          const query = supabase.from("profiles").update({ language });
          
          const { error } = profileIdToUpdate
            ? await query.eq("id", profileIdToUpdate)
            : await query.eq("auth_user_id", user.id);

          if (error) {
            console.error("[useI18n] Failed to update language in profile:", error);
          } else {
            console.log("[useI18n] Profile language updated successfully");
            // Wait for refresh to complete so memory state matches DB
            await refreshProfile();
          }
        } else {
          console.log('[useI18n] No user logged in, skipping profile update');
        }

        // Note: localStorage is already saved by setLanguage() function
        console.log('[useI18n] Language change completed:', language);
      } catch (error) {
        console.error("Failed to change language:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [user, profile?.id, refreshProfile]
  );

  return {
    currentLanguage,
    changeLanguage,
    t,
    isLoading,
    supportedLanguages,
  };
};
