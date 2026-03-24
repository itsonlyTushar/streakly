import type { Metadata } from "next";
import { Gravitas_One, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { ThemeProvider } from "next-themes";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${gravitasOne.variable} ${outfit.variable} ${gravitasOne.className} ${outfit.className}`}
      suppressHydrationWarning
    >
      <body
        className={`${outfit.className} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
