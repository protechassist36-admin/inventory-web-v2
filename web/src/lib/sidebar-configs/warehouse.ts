import { LayoutDashboard, Package, Truck, Users, BarChart3, Settings, ClipboardList } from "lucide-react";

export const warehouseSidebarConfig = [
  {
    label: "Intelligence",
    items: [
      { title: "Overview", url: "/dashboard", icon: LayoutDashboard, permission: "menu:overview" },
      { title: "Stock Alerts", url: "/dashboard/inventory/alerts", icon: ClipboardList, permission: "menu:inventory" },
    ]
  },
  {
    label: "Inventory",
    items: [
      { title: "Inventory", url: "/dashboard/inventory", icon: Package, permission: "menu:inventory" },
      { title: "Stock Adjustments", url: "/dashboard/inventory/adjustments", icon: Package, permission: "menu:inventory:adjustments" },
    ]
  },
  {
    label: "Logistics",
    items: [
      { title: "Suppliers", url: "/dashboard/purchases/suppliers", icon: Users, permission: "menu:purchases:suppliers" },
      { title: "Purchases", url: "/dashboard/purchases", icon: Truck, permission: "menu:purchases" },
    ]
  },
  {
    label: "Settings",
    items: [
      { title: "Business Settings", url: "/dashboard/system/settings", icon: Settings, permission: "menu:system:settings" },
    ]
  }
];
