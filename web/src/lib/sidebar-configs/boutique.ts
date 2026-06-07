import { LayoutDashboard, Package, ShoppingCart, Users, BarChart3, Settings, Wallet, Tag } from "lucide-react";

export const boutiqueSidebarConfig = [
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
      { title: "Collection", url: "/dashboard/inventory/products", icon: Package, permission: "menu:inventory" },
      { title: "Categories", url: "/dashboard/inventory/categories", icon: Tag, permission: "menu:inventory:categories" },
    ]
  },
  {
    label: "Commerce",
    items: [
      { title: "POS", url: "/dashboard/pos", icon: ShoppingCart, permission: "menu:sales" },
      { title: "Sales History", url: "/dashboard/sales/history", icon: BarChart3, permission: "menu:sales:history" },
    ]
  },
  {
    label: "Customers",
    items: [
      { title: "Customer Registry", url: "/dashboard/customers", icon: Users, permission: "menu:customers" },
      { title: "Loyalty Program", url: "/dashboard/customers/loyalty", icon: Users, permission: "menu:customers:loyalty" },
    ]
  },
  {
    label: "Settings",
    items: [
      { title: "Business Settings", url: "/dashboard/system/settings", icon: Settings, permission: "menu:system:settings" },
    ]
  }
];
