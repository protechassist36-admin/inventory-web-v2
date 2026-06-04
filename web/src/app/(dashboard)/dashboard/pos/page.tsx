"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { usePOSStore } from "@/store/use-pos-store";
import { useOfflineSync } from "@/hooks/use-offline-sync";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ShoppingCart, 
  Trash2, 
  X,
  Plus, 
  Minus, 
  Search, 
  RefreshCw,
  LayoutGrid,
  List,
  Package,
  CheckCircle2,
  Printer,
  Download,
  Zap,
  ChevronRight,
  Info,
  TrendingUp,
  BarChart3,
  Calculator,
  ShieldCheck,
  User,
  Banknote,
  Receipt,
  AlertCircle,
  Clock,
  Store,
  Wallet,
  Smartphone,
  CreditCard as CardIcon,
  ArrowRight,
  ChevronDown,
  History,
  Activity
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { createSale } from "@/lib/actions/sale";
import { getCustomers } from "@/lib/actions/customer";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Tabs, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { 
  LineChart, 
  Line, 
  ResponsiveContainer, 
  YAxis, 
  XAxis, 
  Tooltip as ChartTooltip 
} from "recharts";
import { Badge } from "@/components/ui/badge";

// Mock data for analytics intelligence
const salesData = [
  { time: '08:00', amount: 450 },
  { time: '10:00', amount: 890 },
  { time: '12:00', amount: 1200 },
  { time: '14:00', amount: 760 },
  { time: '16:00', amount: 1450 },
  { time: '18:00', amount: 980 },
];

export default function POSPage() {
  const router = useRouter();
  const { cart, addItem, removeItem, updateQuantity, clearCart } = usePOSStore();
  const { isOnline, isSyncing, initialSync } = useOfflineSync();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Checkout State
  const [selectedCustomer, setSelectedCustomer] = useState<string | "WALKIN">("WALKIN");
  const [paymentStatus, setPaymentStatus] = useState<"PAID" | "UNPAID" | "PARTIAL">("PAID");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "MOBILE_MONEY" | "CARD">("CASH");
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Receipt State
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);

  // Quick Source State
  const [isQuickSourceOpen, setIsQuickSourceOpen] = useState(false);
  const [quickSourceData, setQuickSourceData] = useState({
    name: "",
    salePrice: "",
    costPrice: "",
    sourceName: "",
  });

  // Time & Shift State
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchCustomers();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function fetchCustomers() {
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error("Failed to load customers:", error);
    }
  }

  const products = useLiveQuery(
    () => {
      let collection = db.products;
      if (selectedCategory) {
        return collection.where("categoryId").equals(selectedCategory).toArray();
      }
      return collection.toArray();
    },
    [selectedCategory]
  );

  const categories = useLiveQuery(() => db.categories.toArray());

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
    ((p as any).barcode && (p as any).barcode.includes(searchQuery))
  );

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const tax = total * 0.15; // 15% GST example
  const grandTotal = total + tax;

// Live Analytics Logic
  const pendingSales = useLiveQuery(() => db.pendingSales.toArray());
  
  const analytics = useMemo(() => {
    if (!pendingSales) return { todayTotal: 0, chartData: [] };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysPending = pendingSales.filter(s => new Date(s.createdAt).getTime() >= today.getTime());
    const total = todaysPending.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    
    // Group by hour for chart
    const groups: Record<string, number> = {};
    todaysPending.forEach(s => {
      const hour = format(new Date(s.createdAt), "HH:00");
      groups[hour] = (groups[hour] || 0) + (s.totalAmount || 0);
    });
    
    const chartData = Object.entries(groups).map(([time, amount]) => ({ time, amount }))
      .sort((a, b) => a.time.localeCompare(b.time));
      
    return { todayTotal: total, chartData };
  }, [pendingSales]);

  async function handleCheckout() {
    console.log("DEBUG: Checkout button clicked, cart length:", cart.length);
    if (cart.length === 0) {
       toast.error("Cart is empty");
       return;
    }
    
    setLoading(true);
    console.log("DEBUG: Processing checkout...");
    try {
      if ((paymentStatus === "UNPAID" || paymentStatus === "PARTIAL") && selectedCustomer === "WALKIN") {
         toast.error("Customer profile required for credit sales.");
         setLoading(false);
         return;
      }

      const saleData = {
        items: cart.map(item => ({
          productId: item.isExternal ? undefined : item.id,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          total: item.price * item.quantity,
          isExternalSourced: item.isExternal || false,
          externalSourceName: item.externalSourceName,
          externalCostPrice: item.externalCostPrice,
        })),
        totalAmount: grandTotal,
        paymentMethod,
        paymentStatus,
        customerId: selectedCustomer === "WALKIN" ? undefined : selectedCustomer,
        amountPaid: paymentStatus === "PAID" ? grandTotal : amountPaid,
      };

      // Final stock check
      for (const item of cart) {
        if (!item.isExternal) {
          const p = products?.find(prod => prod.id === item.id);
          if (!p || p.stockQuantity < item.quantity) {
             toast.error(`Insufficient stock for ${item.name}!`);
             setLoading(false);
             return;
          }
        }
      }

      console.log("DEBUG: Sale Data Prepared:", saleData);

      const currentCart = [...cart];

      await db.pendingSales.add({
        ...saleData,
        createdAt: Date.now(),
        synced: isOnline,
      });

      if (isOnline) {
        console.log("DEBUG: Attempting cloud sync...");
        const result = await createSale(saleData);
        if (result.success) {
          console.log("DEBUG: Cloud sync successful.");
          toast.success("Transaction finalized. Cloud synced.");
          setLastSale({
            ...result,
            items: currentCart,
            customerName: selectedCustomer === "WALKIN" ? "Walk-in Customer" : customers.find(c => c.id === selectedCustomer)?.name,
            paymentStatus,
            paymentMethod,
            amountPaid: paymentStatus === "PAID" ? grandTotal : amountPaid,
          });
          setIsReceiptOpen(true);
        }
      } else {
        console.log("DEBUG: Offline mode, saving locally.");
        toast.warning("Saved locally. Will sync when back online.");
        setLastSale({
            invoiceNumber: `LOCAL-${Date.now()}`,
            createdAt: new Date().toISOString(),
            totalAmount: grandTotal,
            items: currentCart,
            customerName: selectedCustomer === "WALKIN" ? "Walk-in Customer" : customers.find(c => c.id === selectedCustomer)?.name,
            paymentStatus,
            paymentMethod,
            amountPaid: paymentStatus === "PAID" ? grandTotal : amountPaid,
        });
        setIsReceiptOpen(true);
      }
      
      clearCart();
      setSelectedCustomer("WALKIN");
      setPaymentStatus("PAID");
      setAmountPaid(0);
    } catch (error) {
      console.error("DEBUG: Checkout error:", error);
      toast.error("Checkout failed. Please try again.");
    } finally {
      setLoading(false);
      console.log("DEBUG: Checkout process finished.");
    }
  }

  function handleQuickSourceSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!quickSourceData.name || !quickSourceData.salePrice || !quickSourceData.costPrice) {
      toast.error("Please fill all required fields.");
      return;
    }
    const item = {
      id: `ext-${Date.now()}`,
      name: quickSourceData.name,
      price: parseFloat(quickSourceData.salePrice),
      quantity: 1,
      isExternal: true,
      externalSourceName: quickSourceData.sourceName,
      externalCostPrice: parseFloat(quickSourceData.costPrice),
    };
    addItem(item);
    setIsQuickSourceOpen(false);
    setQuickSourceData({ name: "", salePrice: "", costPrice: "", sourceName: "" });
    toast.success("External asset added to cart.");
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-white text-slate-900 rounded-xl border border-slate-200 overflow-hidden shadow-sm relative">
      
      {/* BACKGROUND DECOR */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      {/* PROFESSIONAL HEADER */}
      <header className="p-4 bg-white border-b border-slate-200 flex flex-col md:flex-row justify-between items-center shrink-0 z-20 gap-4">
        <div className="flex items-center gap-4">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-md cursor-pointer"
          >
            <ShoppingCart className="h-6 w-6 text-white" />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Point of Sale</h1>
              <div className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Enterprise</div>
            </div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-0.5 flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" /> System Synchronized • {format(currentTime, "PPP")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Live Clock & Shift Info */}
          <div className="hidden xl:flex items-center gap-4 pr-4 border-r border-slate-200">
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Active Session</div>
              <div className="text-sm font-bold text-slate-900 mt-1">Morning Shift Alpha</div>
            </div>
            <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-200">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-lg font-bold text-slate-900 tracking-tight tabular-nums">
              {isMounted ? format(currentTime, "HH:mm:ss") : "00:00:00"}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-all group">
              <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                <Store className="h-4 w-4 text-slate-600" />
              </div>
              <div className="text-left">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Branch</div>
                <div className="text-xs font-bold text-slate-900">Main Terminal</div>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400 ml-1" />
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={initialSync} 
                disabled={isSyncing} 
                className="h-10 px-4 rounded-xl border-slate-200 bg-white text-slate-700 font-bold text-[10px] uppercase tracking-wider gap-2 hover:bg-slate-50 transition-all"
              >
                <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
                Sync
              </Button>
              <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-all">
                <User className="h-5 w-5 text-slate-600" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden relative z-10">
        
        {/* LEFT COLUMN: CATALOG & CART (70%) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 min-h-0">
          
          {/* SEARCH & FILTERS - Optimized for mobile */}
          <div className="p-2 sm:p-6 pb-2 space-y-2 sm:space-y-4 shrink-0">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <div className="flex-1 relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-5 sm:w-5 text-slate-400" />
                <Input 
                  placeholder="Search products..." 
                  className="h-9 sm:h-12 pl-9 sm:pl-12 pr-4 rounded-lg sm:rounded-xl border-slate-200 bg-white text-slate-900 shadow-sm focus:ring-blue-500/10 transition-all placeholder:text-slate-400 text-[10px] sm:text-sm" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm"
                  onClick={() => setIsQuickSourceOpen(true)}
                  className="flex-1 sm:flex-none h-9 sm:h-12 px-3 sm:px-6 rounded-lg sm:rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[9px] sm:text-xs uppercase tracking-widest gap-1.5 sm:gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                >
                  <Zap className="h-3 w-3 sm:h-4 sm:w-4" /> Quick Source
                </Button>
                <div className="flex bg-white p-0.5 sm:p-1 rounded-lg sm:rounded-xl border border-slate-200 shadow-sm shrink-0">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className={cn("h-7 w-7 sm:h-10 sm:w-10 rounded-md sm:rounded-lg transition-all", viewMode === 'grid' ? "bg-slate-100 text-slate-900" : "text-slate-500")}
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className={cn("h-7 w-7 sm:h-10 sm:w-10 rounded-md sm:rounded-lg transition-all", viewMode === 'list' ? "bg-slate-100 text-slate-900" : "text-slate-500")}
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 sm:pb-2 no-scrollbar">
              <Button 
                variant="outline"
                size="sm"
                className={cn(
                  "rounded-full px-3 sm:px-6 h-7 sm:h-9 font-bold text-[8px] sm:text-[10px] uppercase tracking-wider transition-all shrink-0",
                  selectedCategory === null ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
                onClick={() => setSelectedCategory(null)}
              >
                All Products
              </Button>
              {categories?.map((cat) => (
                <Button 
                  key={cat.id}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "rounded-full px-3 sm:px-6 h-7 sm:h-9 font-bold text-[8px] sm:text-[10px] uppercase tracking-wider transition-all shrink-0",
                    selectedCategory === cat.id ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  )}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>
          
          {/* CATALOG AREA */}
          <div 
            className="flex-1 w-full overflow-y-auto px-2 sm:px-6 pb-24 custom-scrollbar"
          >
            
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 pb-20 mt-1 sm:mt-2">
                {!products ? (
                  Array.from({ length: 12 }).map((_, i) => <div key={i} className="aspect-square bg-slate-100 animate-pulse rounded-lg sm:rounded-xl" />)
                ) : filteredProducts?.length === 0 ? (
                  <div className="col-span-full text-center py-8 sm:py-12 bg-white rounded-xl sm:rounded-2xl border border-dashed border-slate-200">
                    <Package className="h-8 w-8 sm:h-10 sm:w-10 text-slate-200 mx-auto mb-2 sm:mb-3" />
                    <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 sm:mb-2">No products found</h3>
                    <p className="text-[8px] sm:text-[10px] text-slate-400 px-4 sm:px-6 italic">If you just created a product, please click the "Sync" button in the top header.</p>
                  </div>
                ) : (
                  filteredProducts?.map((p) => (
                    <motion.div 
                      layout
                      key={p.id}
                      className="group"
                    >
                      <div 
                      className="cursor-pointer bg-white rounded-lg sm:rounded-xl border border-slate-200 hover:border-blue-400 transition-all h-full flex flex-col p-1.5 sm:p-3 shadow-sm relative overflow-hidden" 
                      onClick={() => {
                        if (p.stockQuantity <= 0) {
                          toast.error("Product is out of stock!");
                          return;
                        }
                        addItem({ id: p.id, name: p.name, price: p.unitPrice, quantity: 1 });
                      }}
                      >
                        <div className="aspect-square bg-slate-50 rounded-md sm:rounded-lg mb-1.5 sm:mb-2 flex items-center justify-center relative overflow-hidden">
                          <Package className="h-5 w-5 sm:h-8 sm:w-8 text-slate-200 group-hover:text-blue-200 transition-colors" />
                          <div className="absolute top-1 left-1 bg-slate-900 text-white text-[7px] sm:text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">Stock: {p.stockQuantity}</div>
                          {p.stockQuantity <= 5 && (
                             <div className="absolute top-1 right-1 bg-rose-500 text-white text-[7px] sm:text-[8px] font-bold px-1 py-0.5 rounded uppercase">Low</div>
                           )}
                        </div>

                        <div className="flex-1 flex flex-col">
                          <h3 className="font-bold text-[9px] sm:text-[11px] text-slate-900 uppercase tracking-tight line-clamp-2 leading-tight mb-1">{p.name}</h3>
                          <div className="mt-auto">
                            <div className="text-blue-600 font-bold text-[10px] sm:text-sm">Le {Math.round(p.unitPrice).toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-1.5 sm:space-y-2 mt-1 sm:mt-2">
                {filteredProducts?.map((p) => (
                  <motion.div 
                    whileHover={{ x: 4, backgroundColor: 'rgba(248, 250, 252, 1)' }}
                    whileTap={{ scale: 0.99 }}
                    key={p.id} 
                    className="flex items-center gap-2 sm:gap-4 p-1.5 sm:p-3 bg-white rounded-lg sm:rounded-xl border border-slate-200 cursor-pointer group transition-all"
                    onClick={() => addItem({ id: p.id, name: p.name, price: p.unitPrice, quantity: 1 })}
                  >
                     <div className="h-8 w-8 sm:h-12 sm:w-12 bg-slate-50 rounded-md sm:rounded-lg flex items-center justify-center shrink-0 border border-slate-100">
                        <Package className="h-4 w-4 sm:h-6 sm:w-6 text-slate-200" />
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 uppercase text-[9px] sm:text-xs truncate">{p.name}</div>
                     </div>
                     <div className="font-bold text-blue-600 text-[10px] sm:text-sm">Le {Math.round(p.unitPrice).toLocaleString()}</div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: CART & CHECKOUT (30%) */}
        <div className="w-full lg:w-[400px] h-[35vh] sm:h-[40vh] lg:h-auto bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col shrink-0 relative z-20">
          
          {/* SUMMARY MINI-CHART (Simplified) - HIDDEN ON MOBILE */}
          <div className="hidden lg:block p-6 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Live Analytics</h4>
               </div>
               <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => router.push('/dashboard/reports')}
                  className="h-8 text-[10px] font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-700"
               >
                  Full Report
               </Button>
            </div>

            <div className="h-16 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.chartData.length > 0 ? analytics.chartData : [{time: '00:00', amount: 0}, {time: '23:59', amount: 0}]}>
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#4f46e5" 
                    strokeWidth={3} 
                    dot={false} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* CART LIST */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50">
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-slate-400" />
                <h5 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Current Cart</h5>
              </div>
              {cart.length > 0 && (
                <button onClick={clearCart} className="text-[9px] font-bold text-rose-500 uppercase tracking-wider hover:underline flex items-center gap-1.5">
                   <Trash2 size={12} /> Clear Cart
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <div className="h-20 w-20 rounded-full border border-dashed border-slate-200 flex items-center justify-center mb-4">
                  <ShoppingCart className="h-8 w-8 text-slate-200" />
                </div>
                <h6 className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-2">Cart is empty</h6>
                <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider max-w-[200px]">Select products from the catalog to start a sale.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {cart.map((item) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={item.id} 
                      className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3 group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                             <h6 className="font-bold text-slate-900 uppercase tracking-tight text-[11px] leading-tight truncate">{item.name}</h6>
                             {item.isExternal && (
                                <Badge variant="outline" className="h-4 px-1.5 rounded bg-indigo-50 text-indigo-600 border-indigo-100 text-[8px] font-black uppercase tracking-tighter shrink-0">External</Badge>
                             )}
                          </div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                             Le {Math.round(item.price).toLocaleString()} per unit
                          </div>
                        </div>
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-lg font-bold text-slate-900 tracking-tight">
                          Le {Math.round(item.price * item.quantity).toLocaleString()}
                        </div>
                        
                        <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-lg border border-slate-100">
                          <button 
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="h-8 w-8 rounded-md bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50 transition-all active:scale-95"
                          >
                            <Minus size={14} />
                          </button>
                          
                          <div className="w-10 text-center font-bold text-sm text-slate-900">
                            {item.quantity}
                          </div>

                          <button 
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-8 w-8 rounded-md bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-all active:scale-95"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
          
          {/* CHECKOUT SECTION */}
          <div className="p-6 bg-white border-t border-slate-200 space-y-6 z-30 shadow-md">
            
            {cart.length > 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer</Label>
                    <Select value={selectedCustomer} onValueChange={(val: string | null) => setSelectedCustomer(val ?? "WALKIN")}>
                      <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-white text-slate-900 shadow-sm px-3">
                        <SelectValue placeholder="Walk-in Customer" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 bg-white text-slate-900 shadow-xl">
                        <SelectItem value="WALKIN" className="font-bold">Walk-in Customer</SelectItem>
                        {customers.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment</Label>
                    <Select value={paymentMethod} onValueChange={(v: string | null) => setPaymentMethod((v ?? "CASH") as "CASH" | "MOBILE_MONEY" | "CARD")}>
                      <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-white text-slate-900 shadow-sm px-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 bg-white text-slate-900 shadow-xl">
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                        <SelectItem value="CARD">Bank Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Status</Label>
                  <Tabs value={paymentStatus} onValueChange={(val: string | null) => setPaymentStatus((val ?? "PAID") as "PAID" | "UNPAID" | "PARTIAL")} className="w-full">
                    <TabsList className="grid grid-cols-3 h-11 rounded-lg bg-slate-100 border border-slate-200 p-1">
                      <TabsTrigger value="PAID" className="rounded-md text-[9px] font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all">Fully Paid</TabsTrigger>
                      <TabsTrigger value="PARTIAL" className="rounded-md text-[9px] font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm transition-all">Partial</TabsTrigger>
                      <TabsTrigger value="UNPAID" className="rounded-md text-[9px] font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-rose-600 data-[state=active]:shadow-sm transition-all">Credit/Unpaid</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* TOTALS BOX */}
                <div className="p-5 bg-slate-50 rounded-2xl space-y-3 border border-slate-200 shadow-inner relative overflow-hidden">
                  <div className="space-y-2 relative z-10">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                       <span>Subtotal</span>
                       <span className="text-slate-900 font-bold">Le {Math.round(total).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                       <span>GST (15%)</span>
                       <span className="text-slate-900 font-bold">Le {Math.round(tax).toLocaleString()}</span>
                    </div>
                    <div className="h-[1px] bg-slate-200 w-full my-1" />
                    <div className="flex justify-between items-end">
                       <div className="space-y-1">
                          <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Grand Total</div>
                          <div className="text-3xl font-bold text-slate-900 tracking-tight">Le {Math.round(grandTotal).toLocaleString()}</div>
                       </div>
                       <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                          <CheckCircle2 className="h-6 w-6 text-white" />
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 w-full">
              <Button 
                variant="outline" 
                className="h-14 w-14 rounded-xl border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 hover:text-rose-500 transition-all"
                onClick={clearCart}
              >
                <Trash2 className="h-6 w-6" />
              </Button>
              <button
                type="button"
                disabled={loading || cart.length === 0}
                onClick={handleCheckout}
                className="flex-1 h-14 rounded-xl font-bold text-sm uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <>
                    <span>Checkout Now (Le {Math.round(grandTotal).toLocaleString()})</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SALES RECEIPT DIALOG */}
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden bg-white text-slate-900 animate-in zoom-in-95 duration-300">
           <div className="bg-blue-600 p-8 text-white text-center relative overflow-hidden print:hidden">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-white/20 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg relative z-10"
              >
                 <CheckCircle2 className="h-8 w-8 text-white" />
              </motion.div>
              <h3 className="text-2xl font-bold mb-1 uppercase tracking-tight relative z-10">Sale Completed</h3>
              <p className="text-white/80 font-medium text-[10px] uppercase tracking-widest relative z-10">Invoice: {lastSale?.invoiceNumber}</p>
           </div>

           <div id="receipt-content" className="p-8 space-y-6 bg-white print:p-0 print:text-black">
              <div className="text-center space-y-2">
                 <h4 className="font-bold text-xl uppercase tracking-tight">Protech Assist SL Limited</h4>
                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {format(new Date(), "PPP p")}
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-y border-slate-100 py-4">
                 <div className="space-y-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Served By</span>
                    <span className="text-xs font-bold text-slate-900 uppercase">Administrator</span>
                 </div>
                 <div className="space-y-1 text-right">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Customer</span>
                    <span className="text-xs font-bold text-slate-900 uppercase">{lastSale?.customerName}</span>
                 </div>
              </div>

              <div className="space-y-4">
                 {lastSale?.items?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-start gap-4">
                       <div className="flex-1">
                          <div className="text-xs font-bold text-slate-900 uppercase leading-tight mb-1">{item.name}</div>
                          <div className="text-[10px] text-slate-400 font-medium">
                             {item.quantity} x Le {Math.round(item.price).toLocaleString()}
                          </div>
                       </div>
                       <div className="text-sm font-bold text-slate-900">
                          Le {Math.round(item.price * item.quantity).toLocaleString()}
                       </div>
                    </div>
                 ))}
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2">
                 <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <span>Subtotal</span>
                    <span>Le {Math.round((lastSale?.totalAmount || 0) / 1.15).toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <span>Tax (15%)</span>
                    <span>Le {Math.round((lastSale?.totalAmount || 0) - ((lastSale?.totalAmount || 0) / 1.15)).toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-end pt-2">
                    <div className="space-y-1">
                       <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Total Amount</span>
                       <div className="text-3xl font-bold text-slate-900">Le {Math.round(lastSale?.totalAmount || 0).toLocaleString()}</div>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                       {lastSale?.paymentMethod === 'CASH' ? <Wallet className="h-5 w-5 text-blue-500" /> : <Smartphone className="h-5 w-5 text-emerald-500" />}
                    </div>
                 </div>
              </div>

              <div className="text-center pt-6 space-y-4 border-t border-slate-100">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Thank you for your business</p>
                 <div className="text-[8px] font-medium text-slate-300 uppercase tracking-widest">Digital ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}</div>
              </div>
           </div>

           <div className="p-8 pt-0 flex gap-3 print:hidden relative z-10">
              <Button onClick={() => window.print()} className="flex-1 h-12 rounded-xl font-bold uppercase text-[10px] tracking-wider bg-slate-900 text-white hover:bg-slate-800 transition-all flex gap-2">
                 <Printer className="h-4 w-4" /> Print Receipt
              </Button>
              <Button variant="outline" className="h-12 w-12 rounded-xl border-slate-200 bg-white hover:bg-slate-50 transition-all flex items-center justify-center">
                 <Download className="h-4 w-4 text-slate-400" />
              </Button>
           </div>
           
           <Button 
            variant="ghost" 
            className="w-full h-12 rounded-none border-t border-slate-100 font-bold text-[10px] uppercase tracking-wider text-slate-400 hover:text-slate-600 hover:bg-slate-50 print:hidden transition-all" 
            onClick={() => setIsReceiptOpen(false)}
          >
              Close Receipt
           </Button>
        </DialogContent>
      </Dialog>

      {/* QUICK SOURCE MODAL */}
      <Dialog open={isQuickSourceOpen} onOpenChange={setIsQuickSourceOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden bg-white text-slate-900">
           <div className="bg-indigo-600 p-8 text-white">
              <div className="flex items-center gap-3 mb-2">
                 <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center shadow-inner">
                    <Zap className="h-5 w-5 text-white" />
                 </div>
                 <h3 className="text-2xl font-black uppercase tracking-tight italic">Quick <span className="text-indigo-200">Source</span></h3>
              </div>
              <p className="text-indigo-100/80 font-bold text-[10px] uppercase tracking-[0.25em]">External Sourcing Protocol</p>
           </div>

           <form onSubmit={handleQuickSourceSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                 <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Item Designation</Label>
                    <Input 
                       placeholder="e.g. Laptop Power Adapter"
                       required
                       value={quickSourceData.name}
                       onChange={(e) => setQuickSourceData({...quickSourceData, name: e.target.value})}
                       className="h-12 rounded-xl border-slate-100 bg-slate-50 focus:bg-white font-bold"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 text-indigo-600">Sourcing Cost (Le)</Label>
                       <Input 
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          required
                          value={quickSourceData.costPrice}
                          onChange={(e) => setQuickSourceData({...quickSourceData, costPrice: e.target.value})}
                          className="h-12 rounded-xl border-indigo-100 bg-indigo-50/30 focus:bg-white font-black text-indigo-600"
                       />
                    </div>
                    <div className="space-y-1.5">
                       <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 text-emerald-600">Sale Price (Le)</Label>
                       <Input 
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          required
                          value={quickSourceData.salePrice}
                          onChange={(e) => setQuickSourceData({...quickSourceData, salePrice: e.target.value})}
                          className="h-12 rounded-xl border-emerald-100 bg-emerald-50/30 focus:bg-white font-black text-emerald-600"
                       />
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Source Establishment</Label>
                    <Input 
                       placeholder="e.g. Alpha Electronics (Optional)"
                       value={quickSourceData.sourceName}
                       onChange={(e) => setQuickSourceData({...quickSourceData, sourceName: e.target.value})}
                       className="h-12 rounded-xl border-slate-100 bg-slate-50 focus:bg-white font-medium"
                    />
                 </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-50">
                 <Button type="button" variant="ghost" className="flex-1 h-12 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400" onClick={() => setIsQuickSourceOpen(false)}>
                    Abort
                 </Button>
                 <Button type="submit" className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20">
                    Add to Cart
                 </Button>
              </div>
           </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

