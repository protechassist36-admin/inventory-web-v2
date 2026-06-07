import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Beer,
  Clock,
  ClipboardList,
  CalendarCheck,
  Wallet,
  UserCheck,
  FileText
} from "lucide-react";

export const barSidebarConfig = [
  {
    label: "Intelligence",
    items: [
      { title: "Overview", url: "/dashboard", icon: LayoutDashboard, permission: "menu:overview" },
      { title: "Today's Sales", url: "/dashboard/analytics", icon: BarChart3, permission: "menu:sales" },
      { title: "Revenue Summary", url: "/dashboard/analytics/revenue", icon: Wallet, permission: "menu:intelligence:analytics" },
      { title: "Low Stock Alerts", url: "/dashboard/inventory/alerts", icon: ClipboardList, permission: "menu:inventory" },
    ]
  },
  {
    label: "Bar Operations",
    items: [
      { title: "POS", url: "/dashboard/pos", icon: ShoppingCart, permission: "menu:sales" },
      { title: "Open Tabs", url: "/dashboard/bar/tabs", icon: ClipboardList, permission: "menu:bar:tabs" },
      { title: "Table Management", url: "/dashboard/bar/tables", icon: LayoutDashboard, permission: "menu:bar:tables" },
      { title: "Reservations", url: "/dashboard/bar/reservations", icon: CalendarCheck, permission: "menu:bar:reservations" },
      { title: "Happy Hour", url: "/dashboard/bar/happy-hour", icon: Beer, permission: "menu:bar:happy-hour" },
      { title: "Bar Orders", url: "/dashboard/bar/orders", icon: ShoppingCart, permission: "menu:bar:orders" },
    ]
  },
  {
    label: "Inventory",
    items: [
      { title: "Drinks", url: "/dashboard/inventory/products", icon: Package, permission: "menu:inventory" },
      { title: "Categories", url: "/dashboard/inventory/categories", icon: Package, permission: "menu:inventory:categories" },
      { title: "Suppliers", url: "/dashboard/purchases/suppliers", icon: Users, permission: "menu:purchases:suppliers" },
      { title: "Purchases", url: "/dashboard/purchases", icon: Package, permission: "menu:purchases" },
      { title: "Stock Levels", url: "/dashboard/inventory/stock", icon: Package, permission: "menu:inventory" },
      { title: "Stock Adjustments", url: "/dashboard/inventory/adjustments", icon: Package, permission: "menu:inventory:adjustments" },
      { title: "Expiry Tracking", url: "/dashboard/inventory/expiry", icon: Package, permission: "menu:inventory:expiry" },
    ]
  },
  {
    label: "Sales",
    items: [
      { title: "Sales History", url: "/dashboard/sales/history", icon: FileText, permission: "menu:sales:history" },
      { title: "Credit Sales", url: "/dashboard/sales/credit", icon: Wallet, permission: "menu:sales:credit" },
      { title: "Returns", url: "/dashboard/sales/returns", icon: ShoppingCart, permission: "menu:sales:returns" },
      { title: "Receipts", url: "/dashboard/sales/receipts", icon: FileText, permission: "menu:sales:receipts" },
    ]
  },
  {
    label: "Customers",
    items: [
      { title: "Customer Registry", url: "/dashboard/customers", icon: Users, permission: "menu:customers" },
      { title: "Loyalty Program", url: "/dashboard/customers/loyalty", icon: Users, permission: "menu:customers:loyalty" },
      { title: "VIP Customers", url: "/dashboard/customers/vip", icon: Users, permission: "menu:customers:vip" },
    ]
  },
  {
    label: "Finance",
    items: [
      { title: "Expenses", url: "/dashboard/accounting/expenses", icon: Wallet, permission: "menu:accounting:expenses" },
      { title: "Cash Flow", url: "/dashboard/accounting/cashflow", icon: Wallet, permission: "menu:accounting:cashflow" },
      { title: "Profit & Loss", url: "/dashboard/accounting/pl", icon: BarChart3, permission: "menu:accounting:pl" },
      { title: "Daily Reconciliation", url: "/dashboard/accounting/reconciliation", icon: Wallet, permission: "menu:accounting:reconciliation" },
    ]
  },
  {
    label: "Staff",
    items: [
      { title: "Employees", url: "/dashboard/staff/employees", icon: Users, permission: "menu:staff" },
      { title: "Shifts", url: "/dashboard/staff/shifts", icon: Clock, permission: "menu:staff:shifts" },
      { title: "Attendance", url: "/dashboard/staff/attendance", icon: UserCheck, permission: "menu:staff:attendance" },
    ]
  },
  {
    label: "Reports",
    items: [
      { title: "Sales Reports", url: "/dashboard/reports/sales", icon: BarChart3, permission: "menu:intelligence:reports" },
      { title: "Inventory Reports", url: "/dashboard/reports/inventory", icon: Package, permission: "menu:intelligence:reports" },
      { title: "Profit Reports", url: "/dashboard/reports/profit", icon: BarChart3, permission: "menu:intelligence:reports" },
    ]
  },
  {
    label: "Settings",
    items: [
      { title: "Business Settings", url: "/dashboard/system/settings", icon: Settings, permission: "menu:system:settings" },
      { title: "Users & Permissions", url: "/dashboard/system/permissions", icon: Users, permission: "menu:system:permissions" },
      { title: "Integrations", url: "/dashboard/system/integrations", icon: Settings, permission: "menu:system:integrations" },
    ]
  }
];
