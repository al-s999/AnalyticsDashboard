"use client";

import { ThemeProvider } from "next-themes";
import { ActiveThemeProvider } from "@/components/active-theme";
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "@/components/ui/sonner";
import NextTopLoader from "nextjs-toploader";
import { useEffect } from "react";
import { useI18n } from "@/hooks/use-i18n";

// RTL Direction Manager Component
function RTLDirectionManager() {
  const { currentLanguage } = useI18n();

  useEffect(() => {
    const isRTL = currentLanguage === "ar";
    const htmlElement = document.documentElement;

    if (isRTL) {
      htmlElement.setAttribute("dir", "rtl");
      htmlElement.setAttribute("lang", "ar");
      htmlElement.classList.add("rtl");
    } else {
      htmlElement.removeAttribute("dir");
      htmlElement.setAttribute("lang", currentLanguage === "id" ? "id" : "en");
      htmlElement.classList.remove("rtl");
    }
  }, [currentLanguage]);

  return null;
}

interface ProvidersProps {
  children: React.ReactNode;
  themeSettings: {
    preset: any;
    scale: any;
    radius: any;
    contentLayout: any;
  };
}

export function Providers({ children, themeSettings }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange>
      <ActiveThemeProvider initialTheme={themeSettings}>
        <AuthProvider>
          <RTLDirectionManager />
          {children}
          <Toaster position="top-center" richColors />
          <NextTopLoader
            color="linear-gradient(to right, #fb923c 0%, #fb923c 60%, #facc15 95%, #a3e635 100%)"
            showSpinner={false}
            height={3}
            shadow={false}
          />
        </AuthProvider>
      </ActiveThemeProvider>
    </ThemeProvider>
  );
}
