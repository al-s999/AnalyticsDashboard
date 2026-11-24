"use client";

import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_THEME, ThemeType } from "@/lib/themes";

function serializeTheme(theme: ThemeType): string {
  return `${theme.preset}:${theme.scale}:${theme.radius}:${theme.contentLayout}`;
}

type ThemeContextType = {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ActiveThemeProvider({
  children,
  initialTheme
}: {
  children: ReactNode;
  initialTheme?: ThemeType;
}) {
  const [theme, setTheme] = useState<ThemeType>(() =>
    initialTheme ? initialTheme : DEFAULT_THEME
  );

  useEffect(() => {
    const body = document.body;
    const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
    const secureFlag = isHttps ? "Secure;" : "";

    // 1. Terapkan data-attribute pada DOM
    body.setAttribute("data-theme-radius", theme.radius);
    body.setAttribute("data-theme-preset", theme.preset);
    body.setAttribute("data-theme-scale", theme.scale);
    body.setAttribute("data-theme-content-layout", theme.contentLayout);

    // 2. Tulis 1 cookie konsolidasi ringkas gfs_theme
    const themeValue = serializeTheme(theme);
    document.cookie = `gfs_theme=${encodeURIComponent(themeValue)}; path=/; max-age=31536000; SameSite=Lax; ${secureFlag}`;

    // 3. Bersihkan 4 cookie terpisah lama (self-healing migration untuk memotong ukuran cookie header)
    const oldKeys = ["theme_preset", "theme_radius", "theme_scale", "theme_content_layout"];
    oldKeys.forEach((key) => {
      document.cookie = `${key}=; path=/; max-age=0; SameSite=Lax; ${secureFlag}`;
    });
  }, [theme.preset, theme.radius, theme.scale, theme.contentLayout]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useThemeConfig() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useThemeConfig must be used within an ActiveThemeProvider");
  }
  return context;
}
