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
  Bell,
  ShieldCheck,
  Activity as ActivityIcon,
  CreditCard,
  Wallet,
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
import { getBusinessContext } from "@/lib/actions/auth";
import { motion } from "framer-motion";

import { barSidebarConfig } from "@/lib/sidebar-configs/bar";
import { restaurantSidebarConfig } from "@/lib/sidebar-configs/restaurant";
import { pharmacySidebarConfig } from "@/lib/sidebar-configs/pharmacy";
import { supermarketSidebarConfig } from "@/lib/sidebar-configs/supermarket";
import { shopSidebarConfig } from "@/lib/sidebar-configs/shop";
import { boutiqueSidebarConfig } from "@/lib/sidebar-configs/boutique";
import { electronicsSidebarConfig } from "@/lib/sidebar-configs/electronics";
import { warehouseSidebarConfig } from "@/lib/sidebar-configs/warehouse";

// Helper to get config
const getSidebarConfig = (type: string) => {
  switch (type) {
    case "BAR": return barSidebarConfig;
    case "RESTAURANT": return restaurantSidebarConfig;
    case "PHARMACY": return pharmacySidebarConfig;
    case "SUPERMARKET": return supermarketSidebarConfig;
    case "SHOP": return shopSidebarConfig;
    case "BOUTIQUE": return boutiqueSidebarConfig;
    case "ELECTRONICS": return electronicsSidebarConfig;
    case "WAREHOUSE": return warehouseSidebarConfig;
    default: return null; 
  }
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const [businessContext, setBusinessContext] = React.useState({ name: "Loading...", logoUrl: null as string | null });
  const [mounted, setMounted] = React.useState(false);
  const pathname = usePathname();
  const businessTypesString = session?.user?.businessType || "SHOP";
  const businessTypes = businessTypesString.split(',').filter(t => t !== "");
  const businessType = businessTypes[0] || "SHOP"; // Use the first type for display
  
  console.log("DEBUG Sidebar: types:", businessTypesString, "Detected:", businessTypes, "First:", businessType);

  // Use dynamic configuration: Merge items from all applicable types
  const navGroups = React.useMemo(() => {
    const configs = businessTypes.map(getSidebarConfig).filter(Boolean);
    console.log("DEBUG Sidebar: configs to merge:", configs);
    
    if (configs.length === 0) return [];
    
    // Merge all configurations
    const merged: any[] = [];
    configs.forEach(config => {
        config?.forEach(group => {
            const existingGroup = merged.find(g => g.label === group.label);
            if (existingGroup) {
                // Merge items, avoiding duplicates by title
                group.items.forEach(item => {
                    if (!existingGroup.items.find((i: any) => i.title === item.title)) {
                        existingGroup.items.push(item);
                    }
                });
            } else {
                merged.push({...group, items: [...group.items]});
            }
        });
    });
    console.log("DEBUG Sidebar: merged groups:", merged);
    return merged;
  }, [businessTypesString]);
  
  // Need to filter groups based on user permissions
  const userRole = session?.user?.role || "STAFF";
  const isAdmin = userRole === "ADMIN" || userRole === "SUPERADMIN";
  const userPermissions = session?.user?.permissions || [];
  
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
    items: NavItem[];
  }

  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    if (isAdmin) return true;
    return userPermissions.includes(permission);
  };

  const filteredNavGroups = (navGroups as NavGroup[]).map(group => ({
    ...group,
    items: group.items.filter((item: NavItem) => hasPermission(item.permission))
  })).filter(group => group.items.length > 0);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (session?.user?.businessId) {
      getBusinessContext(session.user.businessId)
        .then(setBusinessContext)
        .catch(err => console.error("Failed to load business context:", err));
    } else if (mounted) {
      setBusinessContext({ name: "Global Admin", logoUrl: null });
    }
  }, [session?.user?.businessId, mounted]);

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
                  <Image 
                    src={`${businessContext.logoUrl || "/images/logo2.jpeg"}?t=${Date.now()}`} 
                    alt="Logo" 
                    fill 
                    className="object-cover"
                    unoptimized 
                  />
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
           <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-inner group cursor-pointer transition-all hover:border-primary/20 flex items-center gap-3">
              {businessContext.logoUrl && (
                <div className="relative h-8 w-8 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 flex-shrink-0">
                  <Image 
                    src={businessContext.logoUrl} 
                    alt="Logo" 
                    fill 
                    className="object-cover"
                    unoptimized 
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span className="text-xs font-black text-slate-900 dark:text-white truncate block group-hover:text-primary transition-colors">{businessContext.name}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">{businessType} UNIT</span>
              </div>
           </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-3">
        <SidebarMenu className="gap-6 pb-8">
          {filteredNavGroups.map((group) => (
            <div key={group.label} className="space-y-2">
              <div className="px-4 text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em] mb-3">{group.label}</div>
              <div className="space-y-1">
                {group.items.map((item: any) => {
                  const isActive = pathname.startsWith(item.url) && (item.url !== "/dashboard" || pathname === "/dashboard");
                  const Icon = item.icon;

                  // Recursive function to render items and sub-items
                  const renderItem = (navItem: any, isSubItem = false) => {
                     const Icon = navItem.icon;
                     const isActive = pathname.startsWith(navItem.url) && (navItem.url !== "/dashboard" || pathname === "/dashboard");

                     return (
                      <React.Fragment key={navItem.title}>
                        <SidebarMenuItem className={isSubItem ? "pl-4" : ""}>
                          <SidebarMenuButton 
                              tooltip={navItem.title} 
                              isActive={isActive}
                              className={cn(
                              "h-11 rounded-xl transition-all duration-300 font-bold px-4 group/btn",
                              isActive 
                                  ? "bg-slate-900 text-white shadow-xl dark:bg-indigo-600 dark:shadow-indigo-500/20" 
                                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98]"
                              )}
                              render={<Link href={navItem.url} />}
                          >
                              {Icon && <Icon className={cn("size-5 transition-transform duration-300 group-hover/btn:scale-110", isActive ? "text-white" : "text-slate-400 dark:text-slate-500 group-hover/btn:text-primary")} />}
                              <span>{navItem.title}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        {navItem.items && navItem.items.map((subItem: any) => renderItem(subItem, true))}
                      </React.Fragment>
                     );
                  };

                  return renderItem(item);
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
