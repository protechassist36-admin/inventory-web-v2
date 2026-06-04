"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  ChevronRight,
  LogOut,
  Utensils,
  Bell,
  ShieldCheck,
  Activity as ActivityIcon,
  CreditCard,
  Moon,
  Sun,
  Stethoscope,
  Pill,
  History,
  FileText,
  Heart,
  Truck,
  PlusSquare,
  Building2,
  Wallet,
  Calculator,
  UserCheck,
  Book,
  DollarSign
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { getBusinessName } from "@/lib/actions/auth";
import { motion } from "framer-motion";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const [businessName, setBusinessName] = React.useState("Loading...");
  const [mounted, setMounted] = React.useState(false);
  const pathname = usePathname();
  const businessType = session?.user?.businessType || "SHOP";

  React.useEffect(() => {
    setMounted(true);
    if (session?.user?.businessId) {
      getBusinessName(session.user.businessId).then(setBusinessName);
    } else {
      setBusinessName("Global Admin");
    }
  }, [session]);

  const getRelationshipsConfig = () => {
    switch(businessType) {
      case "PHARMACY":
        return {
          title: "Patients/CRM",
          icon: Users,
          items: [
            { title: "Registry", url: "/dashboard/patients" },
            { title: "Prescriptions", url: "/dashboard/patients/prescriptions" },
            { title: "Insurance", url: "/dashboard/patients/insurance" },
          ],
        };
      case "RESTAURANT":
      case "BAR":
        return {
          title: "Guests/CRM",
          icon: Users,
          items: [
            { title: "Guest List", url: "/dashboard/customers" },
            { title: "Reservations", url: "/dashboard/customers/reservations" },
            { title: "Preferences", url: "/dashboard/customers/preferences" },
          ],
        };
      default: // SHOP / RETAIL
        return {
          title: "Customers/CRM",
          icon: Users,
          items: [
            { title: "Customer Registry", url: "/dashboard/customers" },
            { title: "Loyalty Program", url: "/dashboard/customers/loyalty" },
            { title: "Purchase Profiles", url: "/dashboard/customers/profiles" },
          ],
        };
    }
  };

  const relConfig = getRelationshipsConfig();

  const userRole = session?.user?.role || "STAFF";

  const isSuperAdmin = userRole === "SUPERADMIN";
  const isAdmin = userRole === "ADMIN" || isSuperAdmin;

  interface NavItem {
    title: string;
    url: string;
    icon?: any;
    hidden?: boolean;
    permission?: string;
    items?: NavItem[];
  }

  interface NavGroup {
    label: string;
    hidden?: boolean;
    items: NavItem[];
  }

  const userPermissions = session?.user?.permissions || [];
  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    if (isAdmin) return true;
    return userPermissions.includes(permission);
  };

  const navGroups: NavGroup[] = [
    {
      label: "Intelligence",
      items: [
        { title: "Overview", url: "/dashboard", icon: LayoutDashboard, permission: "menu:overview" },
        { title: "Intelligence Hub", url: "/dashboard/registry", icon: ShieldCheck, permission: "menu:intelligence:hub" },
        { title: "Analytics", url: "/dashboard/analytics", icon: ActivityIcon, permission: "menu:intelligence:analytics" },
        { title: "Reports", url: "/dashboard/reports", icon: BarChart3, permission: "menu:intelligence:reports" },
      ]
    },
    {
      label: "Supply Chain",
      items: [
        {
          title: "Inventory",
          url: "/dashboard/inventory",
          icon: Package,
          permission: "menu:inventory",
          items: [
            { title: "Products", url: "/dashboard/inventory/products" },
            { title: "Network Exchange", url: "/dashboard/inventory/network" },
            { title: "Categories", url: "/dashboard/inventory/categories" },
            { title: "Batches", url: "/dashboard/inventory/batches" },
            { title: "Stock History", url: "/dashboard/inventory/history" },
            { title: "Expiry Tracking", url: "/dashboard/inventory/expiry" },
          ],
        },
        {
          title: "Purchases",
          url: "/dashboard/purchases",
          icon: Truck,
          permission: "menu:purchases",
          items: [
            { title: "Suppliers", url: "/dashboard/purchases/suppliers" },
            { title: "Purchase Orders", url: "/dashboard/purchases" },
            { title: "Returns", url: "/dashboard/purchases/returns" },
          ],
        },
      ]
    },
    {
      label: "Commerce",
      items: [
        {
          title: "Sales",
          url: "/dashboard/sales",
          icon: ShoppingCart,
          permission: "menu:sales",
          items: [
            { title: "Launch POS", url: "/dashboard/pos" },
            { title: "Sales History", url: "/dashboard/sales/history" },
            { title: "Sales Orders", url: "/dashboard/sales/orders" },
            { title: "Credit Sales", url: "/dashboard/sales/credit" },
            { title: "Returns", url: "/dashboard/sales/returns" },
          ],
        },
      ],
    },
    {
      label: "Relationships",
      items: [
        {
          title: relConfig.title,
          url: "/dashboard/customers",
          icon: relConfig.icon,
          permission: "menu:customers",
          items: relConfig.items,
        },
      ]
    },
    {
      label: "Finance",
      items: [
        {
          title: "Accounting",
          url: "/dashboard/accounting",
          icon: Wallet,
          permission: "menu:accounting",
          items: [
            { title: "Expenses", url: "/dashboard/accounting/expenses" },
            { title: "Profit & Loss", url: "/dashboard/accounting/pl" },
            { title: "Cash Flow", url: "/dashboard/accounting/cashflow" },
          ],
        },
        { title: "Billing", url: "/dashboard/billing", icon: CreditCard, permission: "menu:accounting:billing" },
      ]
    },
    {
      label: "Administrative",
      items: [
        {
          title: "Team / HR",
          url: "/dashboard/staff",
          icon: UserCheck,
          permission: "menu:staff",
          items: [
            { title: "Employees", url: "/dashboard/staff/employees" },
            { title: "Attendance", url: "/dashboard/staff/attendance" },
            { title: "Payroll", url: "/dashboard/staff/payroll" },
          ],
        },
        {
          title: "System",
          url: "/dashboard/system",
          icon: Settings,
          permission: "menu:system",
          items: [
            { title: "Audit Logs", url: "/dashboard/system/logs" },
            { title: "Notifications", url: "/dashboard/system/notifications" },
            { title: "Settings", url: "/dashboard/system/settings" },
          ],
        },
      ]
    },
    {
      label: "Support",
      items: [
        { title: "System Manual", url: "/dashboard/manual", icon: Book, permission: "menu:support:manual" },
        { title: "Pricing Plans", url: "/pricing", icon: DollarSign, permission: "menu:support:pricing" },
      ]
    }
  ].filter(group => {
    // Filter items within group
    group.items = group.items.filter(item => ((item as any).hidden !== true) && hasPermission(item.permission));
    // Filter group if no items left
    return group.items.length > 0;
  });

  if (!mounted) {
    return <Sidebar collapsible="icon" className="border-r border-slate-100 dark:border-slate-800 shadow-sm" {...props} />;
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-100 dark:border-slate-800 shadow-sm" {...props}>
      <SidebarHeader className="pt-8 px-4 pb-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              size="lg" 
              className="hover:bg-transparent px-0"
              render={<Link href="/dashboard" className="flex items-center gap-3" />}
            >
                <div className="relative flex aspect-square size-10 items-center justify-center overflow-hidden rounded-2xl shadow-xl shadow-primary/20 ring-4 ring-primary/5">
                  <Image src="/images/logo2.jpeg" alt="Logo" fill className="object-cover" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-black text-lg text-slate-900 dark:text-white tracking-tighter">Protech <span className="text-primary italic">Assist</span></span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-[0.25em]">Enterprise OS</span>
                </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        <div className="mt-8 mb-6 px-2">
           <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">Context</div>
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
           </div>
           <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-inner group cursor-pointer transition-all hover:border-primary/20">
              <span className="text-xs font-black text-slate-900 dark:text-white truncate block group-hover:text-primary transition-colors">{businessName}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">{businessType} UNIT</span>
           </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-3">
        <SidebarMenu className="gap-6 pb-8">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-2">
              <div className="px-4 text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em] mb-3">{group.label}</div>
              <div className="space-y-1">
                {group.items.filter(item => !item.hidden).map((item: any) => {
                  const isActive = pathname.startsWith(item.url) && (item.url !== "/dashboard" || pathname === "/dashboard");
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.title} className="relative" id={item.title === "Inventory" ? "sidebar-inventory" : item.title === "Sales" ? "sidebar-pos" : undefined}>
                      {isActive && (
                        <motion.div 
                          layoutId="active-pill"
                          className="absolute left-[-12px] top-2 bottom-2 w-1.5 bg-primary rounded-r-full shadow-[4px_0_12px_rgba(79,70,229,0.3)] z-10"
                        />
                      )}
                      {item.items ? (
                        <>
                          <SidebarMenuButton 
                            tooltip={item.title} 
                            isActive={isActive}
                            className={cn(
                              "h-11 rounded-xl transition-all duration-300 font-bold px-4 group/btn",
                              isActive 
                                ? "bg-slate-900 text-white shadow-xl dark:bg-indigo-600 dark:shadow-indigo-500/20" 
                                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98]"
                            )}
                          >
                            <Icon className={cn("size-5 transition-transform duration-300 group-hover/btn:scale-110", isActive ? "text-white" : "text-slate-400 dark:text-slate-500 group-hover/btn:text-primary")} />
                            <span>{item.title}</span>
                            <ChevronRight className={cn("ml-auto size-3.5 transition-transform duration-300 group-data-[state=open]/menu-item:rotate-90", isActive ? "text-white/50" : "text-slate-300 dark:text-slate-700")} />
                          </SidebarMenuButton>
                          <SidebarMenuSub className="ml-4 border-l-2 border-slate-100 dark:border-slate-800 mt-1 pl-2 space-y-0.5">
                            {item.items.map((subItem: any) => {
                              const isSubActive = pathname === subItem.url;
                              return (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton 
                                    isActive={isSubActive} 
                                    className="h-9 rounded-lg font-bold text-[11px] transition-all"
                                    render={<Link href={subItem.url} className={cn(isSubActive ? "text-primary bg-primary/5" : "text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white")} />}
                                  >
                                      <span>{subItem.title}</span>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </>
                      ) : (
                        <SidebarMenuButton 
                          tooltip={item.title} 
                          isActive={isActive}
                          className={cn(
                            "h-11 rounded-xl transition-all duration-300 font-bold px-4 group/btn",
                            isActive 
                              ? "bg-slate-900 text-white shadow-xl dark:bg-indigo-600 dark:shadow-indigo-500/20" 
                              : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98]"
                          )}
                          render={<Link href={item.url} />}
                        >
                            <Icon className={cn("size-5 transition-transform duration-300 group-hover/btn:scale-110", isActive ? "text-white" : "text-slate-400 dark:text-slate-500 group-hover/btn:text-primary")} />
                            <span>{item.title}</span>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </div>
            </div>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-slate-100 dark:border-slate-800">
        <SidebarMenu>
          <SidebarMenuItem id="user-profile">
            <DropdownMenu>
              <DropdownMenuTrigger 
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-slate-50 dark:data-[state=open]:bg-slate-900 rounded-2xl transition-all"
                  />
                }
              >
                  <Avatar className="h-9 w-9 rounded-xl border-2 border-white dark:border-slate-800 shadow-md">
                    <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                    <AvatarFallback className="rounded-xl bg-primary text-white font-black text-xs">
                      {session?.user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                    <span className="truncate font-black text-slate-900 dark:text-white tracking-tight">{session?.user?.name}</span>
                    <span className="truncate text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">{session?.user?.role}</span>
                  </div>
                  <ChevronRight className="ml-auto size-4 text-slate-300" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-64 rounded-2xl p-2 shadow-2xl border-slate-100 dark:border-slate-800"
                side="top"
                align="end"
                sideOffset={12}
              >
                <div className="px-4 py-3 border-b border-slate-50 dark:border-slate-800 mb-2">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Node</p>
                   <p className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate mt-0.5">{session?.user?.email}</p>
                </div>
                <DropdownMenuItem render={<Link href="/dashboard/system/settings" className="flex items-center w-full" />}>
                    <Settings className="mr-3 size-4 text-slate-400" />
                    Settings Configuration
                </DropdownMenuItem>
                <DropdownMenuItem render={<ThemeToggle />}>
                </DropdownMenuItem>
                {session?.user?.role === "SUPERADMIN" && (
                   <DropdownMenuItem render={<Link href="/super-admin" className="flex items-center w-full" />}>
                       <ShieldCheck className="mr-3 size-4 text-indigo-600" />
                       Nexus Super Control
                   </DropdownMenuItem>
                )}
                <div className="h-px bg-slate-50 dark:bg-slate-800 my-2" />
                <DropdownMenuItem onClick={() => signOut()} className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/30">
                  <LogOut className="mr-3 size-4" />
                  Terminate Session
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
