import { LayoutDashboard, Package, ShoppingCart, Users, BarChart3, Settings, Pill, Stethoscope, FileText, Wallet } from "lucide-react";

export const pharmacySidebarConfig = [
  { 
    label: "Intelligence", 
    items: [
      { title: "Overview", url: "/dashboard", icon: LayoutDashboard, permission: "menu:overview" }, 
      { title: "Low Stock Alerts", url: "/dashboard/inventory/expiry", icon: Pill, permission: "menu:inventory" }
    ] 
  },
  { 
    label: "Pharmacy Ops", 
    items: [
      { title: "POS", url: "/dashboard/pos", icon: ShoppingCart, permission: "menu:sales" }, 
      { title: "Prescriptions", url: "/dashboard/prescriptions", icon: FileText, permission: "menu:prescriptions" }, 
      { title: "Patients", url: "/dashboard/patients", icon: Users, permission: "menu:patients" }
    ] 
  },
  { 
    label: "Inventory", 
    items: [
      { title: "Medications", url: "/dashboard/inventory/products", icon: Pill, permission: "menu:inventory" }, 
      { title: "Suppliers", url: "/dashboard/purchases/suppliers", icon: Users, permission: "menu:purchases:suppliers" }, 
      { title: "Expiry Tracking", url: "/dashboard/inventory/expiry", icon: Stethoscope, permission: "menu:inventory:expiry" }
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
