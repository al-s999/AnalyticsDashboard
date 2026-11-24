"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getSharedCookieDomain } from "./auth-redirect";

import enTranslation from "../locales/en/translation.json";
import idTranslation from "../locales/id/translation.json";
import arTranslation from "../locales/ar/translation.json";

export type Language = 'en' | 'id' | 'ar';

export const supportedLanguages: { code: Language; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: 'us' },
  { code: 'id', name: 'Bahasa Indonesia', flag: 'id' },
  { code: 'ar', name: 'العربية', flag: 'sa' },
];

export const defaultLanguage: Language = 'id';

const resources = {
  en: { translation: enTranslation },
  id: { translation: idTranslation },
  ar: { translation: arTranslation },
};

// Fungsi pembantu untuk membaca localStorage dengan aman
function getStoredLanguage(): Language {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('language');
    if (stored && (stored === 'en' || stored === 'id' || stored === 'ar')) {
      return stored as Language;
    }
  }
  return defaultLanguage;
}

// Tulis cookie bersama 'i18next' agar bisa dibaca lintas subdomain per-apex
// (.gameforsmart.com / .ubig.my.id / .ubigdev.com) — digunakan oleh NitroQuiz
// dan project lain di domain yang sama.
function getSharedLangDomain(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return getSharedCookieDomain(window.location.hostname);
}

function setSharedLanguageCookie(language: Language): void {
  if (typeof document === "undefined") return;
  const sharedDomain = getSharedLangDomain();

  if (sharedDomain) {
    // Hapus cookie host-only (tanpa domain) terlebih dahulu untuk mencegah duplikasi/konflik
    document.cookie = 'i18next=; path=/; max-age=0';

    const maxAge = 60 * 60 * 24 * 365; // 1 tahun
    document.cookie = `i18next=${language}; path=/; max-age=${maxAge}; SameSite=Lax; Secure; domain=${sharedDomain}`;
  } else {
    const maxAge = 60 * 60 * 24 * 365; // 1 tahun
    document.cookie = `i18next=${language}; path=/; max-age=${maxAge}; SameSite=Lax`;
  }
}

// Ambil bahasa tersimpan SEBELUM init dijalankan
// CATATAN: Untuk inisialisasi awal i18n, kita gunakan 'en' (default) secara statis 
// agar server (SSR) dan client merender HTML yang identik pada render pertama.
// Bahasa pengguna dari localStorage/profil akan disinkronkan kemudian di dalam useEffect (hooks/use-i18n.ts).
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", 
    fallbackLng: "en",
    supportedLngs: ["en", "id", "ar"],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

let initialized = false;

export const initializeI18n = async (userLanguage?: Language): Promise<void> => {
  // 1. Jika ada bahasa dari profile user (Supabase/API), prioritaskan ini
  if (userLanguage) {
    if (userLanguage !== i18n.language) {
      await i18n.changeLanguage(userLanguage);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', userLanguage);
      setSharedLanguageCookie(userLanguage); // sync ke NitroQuiz
    }
    initialized = true;
    return;
  }

  // 2. Jika inisialisasi biasa (tanpa data profile), cari dari localStorage
  if (!initialized) {
    const lng = getStoredLanguage();
    if (lng !== i18n.language) {
      await i18n.changeLanguage(lng);
    }
    initialized = true;
  } else {
    console.log('[i18n] Already initialized, current language:', i18n.language);
  }
};

export const setLanguage = async (language: Language): Promise<void> => {
  if (typeof window !== "undefined") {
    localStorage.setItem("language", language);
    setSharedLanguageCookie(language); // sync ke NitroQuiz via shared cookie
    console.log('[i18n] Language saved to localStorage + cookie:', language);
  }
  if (i18n.isInitialized) {
    await i18n.changeLanguage(language);
  }
};

export const getCurrentLanguage = (): Language => {
  // Selalu cek localStorage terlebih dahulu jika i18n belum siap
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('language');
    if (stored && (stored === 'en' || stored === 'id' || stored === 'ar')) {
      return stored as Language;
    }
  }
  
  if (i18n.isInitialized && i18n.language) {
    const lang = i18n.language.split('-')[0];
    if (lang === 'en' || lang === 'id' || lang === 'ar') return lang;
  }
  return defaultLanguage;
};

export const t = (key: string, params?: Record<string, string | number>): string => {
  if (i18n.isInitialized) {
    return i18n.t(key, params);
  }
  return key;
};

export default i18n;