import { AppSidebar } from "@/components/shared/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Bell } from "lucide-react";
import { NotificationBell } from "@/components/shared/notification-bell";
import { LogoutButton } from "@/components/shared/logout-button";
import { TrialBanner } from "@/components/shared/trial-banner";
import { RealTimeClock } from "@/components/shared/real-time-clock";
import { QuickActions } from "@/components/shared/quick-actions";
import { OnboardingTrigger } from "@/components/shared/onboarding-trigger";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;
  try {
    session = await auth();
  } catch (error) {
    console.error("DEBUG: DashboardLayout auth() error:", error);
    session = null;
  }

  if (!session) {
      return <>{children}</>;
  }

  // Force Super Admin redirect
  if (session?.user?.role === "SUPERADMIN") {
      redirect("/super-admin");
  }

  if (session?.user?.businessId && session?.user?.role !== "SUPERADMIN") {
    // ... existing logic ...
    const businessExists = await prisma.business.findUnique({
      where: { id: session.user.businessId },
      select: { id: true }
    });

    if (!businessExists) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="text-center space-y-4 p-8 bg-white rounded-[2rem] shadow-xl border border-slate-100">
             <div className="h-12 w-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bell className="h-6 w-6" />
             </div>
             <h2 className="text-xl font-black text-slate-900">Session Expired</h2>
             <p className="text-slate-500 font-medium max-w-xs">Your business profile was not found. This usually happens after a system reset.</p>
             <form action={async () => {
               "use server";
               await signOut({ redirectTo: "/register" });
             }}>
               <button className="w-full h-12 bg-slate-900 text-white font-bold rounded-xl">
                 Register New Business
               </button>
             </form>
          </div>
        </div>
      );
    }
  }

  return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <OnboardingTrigger />
          <div id="welcome-center" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 pointer-events-none opacity-0" />
          <TrialBanner />
          <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-slate-50 bg-white/50 backdrop-blur-md sticky top-0 z-40 px-6 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/dashboard" className="font-bold text-slate-400">
                      Dashboard
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="font-black text-slate-900">Intelligence Overview</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div className="flex items-center gap-6">
               <div className="hidden lg:block">
                  <RealTimeClock />
               </div>
               <div className="flex items-center gap-4 border-l border-slate-100 pl-6">
                 <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">System Live</span>
                 </div>
                 <NotificationBell />
                 <LogoutButton />
               </div>
            </div>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {children}
          </main>
          <QuickActions />
        </SidebarInset>
      </SidebarProvider>
  );
}
