import type { Metadata } from "next";
import { Gravitas_One, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@vercel/analytics/next";

const gravitasOne = Gravitas_One({
  weight: "400",
  variable: "--font-gravitas-one",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Streakly",
  description: "Minimalist goal tracker and revision system.",
  metadataBase: new URL("https://streakly.online"),
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-32x32.png",
    apple: "/apple-touch-icon.png",
  },
};

import { ToastProvider } from "@/components/ui/toast";
import { SoundProvider } from "@/components/sound-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import NextTopLoader from "nextjs-toploader";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${gravitasOne.variable} ${outfit.variable}`}
      suppressHydrationWarning
    >
      <body
        className={`${outfit.className} antialiased bg-background text-foreground`}
      >
        <NextTopLoader color="var(--color-primary)" showSpinner={false} />
        <QueryProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <ToastProvider>
              <AuthProvider>
                <SoundProvider>{children}</SoundProvider>
                <Analytics />
              </AuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
