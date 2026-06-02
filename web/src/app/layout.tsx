import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { LoadingProvider } from "@/components/providers/loading-provider";
import { Suspense } from "react";
import { GlobalThemeToggle } from "@/components/shared/global-theme-toggle";
import { InstallPWA } from "@/components/shared/install-pwa";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Protech Assist | Enterprise OS",
  description: "Advanced Retail Intelligence and Inventory Management System.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Protech Assist",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content="#4f46e5" />
        <link rel="apple-touch-icon" href="/images/logo2.jpeg" />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
          <AuthProvider>
            <Suspense>
              <LoadingProvider>
                {children}
              </LoadingProvider>
            </Suspense>
            <GlobalThemeToggle />
            <InstallPWA />
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
