import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AnalyticsAuthProvider } from "@/contexts/analytics-auth-context"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GameForSmart - Educational Intelligence & Analytics Dashboard",
  description: "Platform analitik kemampuan siswa, estimasi skor ujian, dan deteksi learning gap."
};

const geist = Geist({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", geist.variable)}
    >
      <body>
        <ThemeProvider>
          <AnalyticsAuthProvider>
            {children}
            <Toaster position="top-right" richColors />
          </AnalyticsAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
