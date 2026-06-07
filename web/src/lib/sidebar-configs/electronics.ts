import { LayoutDashboard, Package, ShoppingCart, Users, BarChart3, Settings, Cpu, Wallet, FileText } from "lucide-react";

export const electronicsSidebarConfig = [
  {
    label: "Intelligence",
    items: [
      { title: "Overview", url: "/dashboard", icon: LayoutDashboard, permission: "menu:overview" },
      { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3, permission: "menu:intelligence:analytics" },
    ]
  },
  {
    label: "Inventory",
    items: [
      { title: "Products", url: "/dashboard/inventory/products", icon: Cpu, permission: "menu:inventory" },
      { title: "Purchases", url: "/dashboard/purchases", icon: Package, permission: "menu:purchases" },
    ]
  },
  {
    label: "Commerce",
    items: [
      { title: "POS", url: "/dashboard/pos", icon: ShoppingCart, permission: "menu:sales" },
      { title: "Sales History", url: "/dashboard/sales/history", icon: FileText, permission: "menu:sales:history" },
    ]
  },
  {
    label: "Settings",
    items: [
      { title: "Business Settings", url: "/dashboard/system/settings", icon: Settings, permission: "menu:system:settings" },
    ]
  }
];
