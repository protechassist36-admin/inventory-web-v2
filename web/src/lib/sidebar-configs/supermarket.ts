import { LayoutDashboard, Package, ShoppingCart, Users, BarChart3, Settings, Wallet } from "lucide-react";

export const supermarketSidebarConfig = [
  { 
    label: "Intelligence", 
    items: [
      { title: "Overview", url: "/dashboard", icon: LayoutDashboard, permission: "menu:overview" }, 
      { title: "Sales Analytics", url: "/dashboard/analytics", icon: BarChart3, permission: "menu:intelligence:analytics" }
    ] 
  },
  { 
    label: "Operations", 
    items: [
      { title: "POS", url: "/dashboard/pos", icon: ShoppingCart, permission: "menu:sales" }, 
      { title: "Stock Management", url: "/dashboard/inventory", icon: Package, permission: "menu:inventory" }
    ] 
  },
  { 
    label: "Inventory", 
    items: [
      { title: "Products", url: "/dashboard/inventory/products", icon: Package, permission: "menu:inventory" }, 
      { title: "Suppliers", url: "/dashboard/purchases/suppliers", icon: Users, permission: "menu:purchases:suppliers" }, 
      { title: "Purchases", url: "/dashboard/purchases", icon: Package, permission: "menu:purchases" }
    ] 
  },
  { 
    label: "Finance", 
    items: [
      { title: "Expenses", url: "/dashboard/accounting/expenses", icon: Wallet, permission: "menu:accounting:expenses" }, 
      { title: "Profit & Loss", url: "/dashboard/accounting/pl", icon: BarChart3, permission: "menu:accounting:pl" }
    ] 
  },
  { 
    label: "Settings", 
    items: [
      { title: "Business Settings", url: "/dashboard/system/settings", icon: Settings, permission: "menu:system:settings" }
    ] 
  }
];
