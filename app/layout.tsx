import type { Metadata } from "next";
import { Gravitas_One, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { ThemeProvider } from "@/components/theme-provider";

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
  description: "Minimalist goal tracker and daily note logger.",
};

import { ToastProvider } from "@/components/ui/toast";

import { SoundProvider } from "@/components/sound-provider";

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
      <body className={`${outfit.className} antialiased bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ToastProvider>
            <AuthProvider>
              <SoundProvider>{children}</SoundProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
