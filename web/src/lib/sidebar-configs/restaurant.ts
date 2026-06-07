import { LayoutDashboard, Package, ShoppingCart, Users, BarChart3, Settings, Utensils, Clock, ClipboardList, Wallet, UserCheck, FileText, CalendarCheck } from "lucide-react";

export const restaurantSidebarConfig = [
  { 
    label: "Intelligence", 
    items: [
      { title: "Overview", url: "/dashboard", icon: LayoutDashboard, permission: "menu:overview" }, 
      { title: "Daily Sales", url: "/dashboard/sales/today", icon: BarChart3, permission: "menu:sales" }
    ] 
  },
  { 
    label: "Kitchen Ops", 
    items: [
      { title: "POS", url: "/dashboard/pos", icon: ShoppingCart, permission: "menu:sales" }, 
      { title: "Kitchen Display", url: "/dashboard/kitchen", icon: ClipboardList, permission: "menu:kitchen" }, 
      { title: "Table Management", url: "/dashboard/tables", icon: LayoutDashboard, permission: "menu:tables" }, 
      { title: "Reservations", url: "/dashboard/reservations", icon: CalendarCheck, permission: "menu:reservations" }
    ] 
  },
  { 
    label: "Inventory", 
    items: [
      { title: "Ingredients", url: "/dashboard/inventory/products", icon: Package, permission: "menu:inventory" }, 
      { title: "Recipes", url: "/dashboard/recipes", icon: FileText, permission: "menu:recipes" }, 
      { title: "Suppliers", url: "/dashboard/purchases/suppliers", icon: Users, permission: "menu:purchases:suppliers" }
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
