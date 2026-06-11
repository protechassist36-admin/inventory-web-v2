import { SplashScreenWrapper } from "@/components/shared/splash-screen-wrapper";
import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { LoadingProvider } from "@/components/providers/loading-provider";
import { Suspense } from "react";
import { GlobalThemeToggle } from "@/components/shared/global-theme-toggle";
import { InstallPWA } from "@/components/shared/install-pwa";
import { Toaster } from "@/components/ui/sonner";

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
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content="#4f46e5" />
        <link rel="apple-touch-icon" href="/images/logo2.png" />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
          <AuthProvider>
            <Suspense>
              {/* <LoadingProvider>
                <SplashScreenWrapper> */}
                  {children}
                {/* </SplashScreenWrapper>
              </LoadingProvider> */}
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
