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
import Image from "next/image";
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

export default function POSPage() {
  const router = useRouter();
  const cart = usePOSStore((state) => state.cart);
  const addItem = usePOSStore((state) => state.addItem);
  const removeItem = usePOSStore((state) => state.removeItem);
  const updateQuantity = usePOSStore((state) => state.updateQuantity);
  const clearCart = usePOSStore((state) => state.clearCart);
  const total = usePOSStore((state) => state.total);
  
  const { isOnline, isSyncing, initialSync } = useOfflineSync();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Checkout State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
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
    initialSync();
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

  const filteredProducts = useMemo(() => products?.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
    ((p as any).barcode && (p as any).barcode.includes(searchQuery))
  ), [products, searchQuery]);

  const tax = total * 0.15;
  const grandTotal = total + tax;

  async function handleCheckout() {
    if (cart.length === 0) {
       toast.error("Cart is empty");
       return;
    }
    
    setLoading(true);
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

      const currentCart = [...cart];

      await db.pendingSales.add({
        ...saleData,
        createdAt: Date.now(),
        synced: isOnline,
      });

      if (isOnline) {
        const result = await createSale(saleData);
        if (result.success) {
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
      setIsCheckoutOpen(false);
      setSelectedCustomer("WALKIN");
      setPaymentStatus("PAID");
      setAmountPaid(0);
    } catch (error) {
      toast.error("Checkout failed. Please try again.");
    } finally {
      setLoading(false);
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
    <div className="flex flex-col h-[100dvh] bg-white text-slate-900 overflow-hidden relative">
      <header className="p-2 bg-white border-b border-slate-200 flex justify-between items-center shrink-0 z-20">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md">
            <ShoppingCart className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-900">POS</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
            <Button 
                variant="outline" 
                size="sm" 
                onClick={initialSync} 
                disabled={isSyncing} 
                className="h-8 px-3 rounded-lg border-slate-200 bg-white text-[9px] font-bold uppercase tracking-wider gap-1.5"
            >
                <RefreshCw className={cn("h-3 w-3", isSyncing && "animate-spin")} />
                Sync
            </Button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden relative z-10">
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 min-h-0">
          <div className="p-2 pb-1 space-y-1 shrink-0">
            <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input 
                  placeholder="Search..." 
                  className="h-9 pl-8 pr-3 rounded-lg border-slate-200 bg-white text-[11px] shadow-sm" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
          </div>
          
          <div className="flex-1 w-full overflow-y-auto px-2 pb-32 custom-scrollbar">
            <div className="grid grid-cols-3 gap-1.5 mt-1">
                {filteredProducts?.map((p) => (
                    <div 
                      key={p.id}
                      className="bg-white rounded-lg border border-slate-200 p-1.5 flex flex-col items-center cursor-pointer hover:border-blue-400 transition-all" 
                      onClick={() => addItem({ id: p.id, name: p.name, price: p.unitPrice, quantity: 1, imageUrl: p.imageUrl })}
                    >
                        <div className="relative aspect-square w-full rounded-md bg-slate-50 overflow-hidden mb-1">
                          {p.imageUrl ? (
                            <Image src={p.imageUrl} alt={p.name} fill className="object-cover" unoptimized />
                          ) : (
                            <Package className="h-6 w-6 text-slate-200 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                          )}
                        </div>
                        <span className="text-[9px] font-bold text-slate-900 uppercase text-center line-clamp-1 w-full">{p.name}</span>
                        <span className="text-[9px] font-black text-blue-600">Le {Math.round(p.unitPrice).toLocaleString()}</span>
                    </div>
                ))}
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 h-[30dvh] bg-white border-t border-slate-200 flex flex-col z-50 shadow-[-4px_-4px_12px_rgba(0,0,0,0.05)]">
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 bg-slate-50">
             {cart.map((item) => (
               <div key={item.id} className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-slate-100 text-[10px]">
                  <div className="relative h-8 w-8 rounded bg-slate-100 overflow-hidden shrink-0">
                      {item.imageUrl && <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />}
                  </div>
                  <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">{item.name}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <button 
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="h-4 w-4 rounded bg-slate-100 flex items-center justify-center hover:bg-slate-200"
                        >
                            <Minus size={10} />
                        </button>
                        <span className="text-[10px] font-bold w-4 text-center">{item.quantity}</span>
                        <button 
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-4 w-4 rounded bg-slate-100 flex items-center justify-center hover:bg-slate-200"
                        >
                            <Plus size={10} />
                        </button>
                        <span className="text-slate-400 ml-1">x Le {Math.round(item.price).toLocaleString()}</span>
                      </div>
                  </div>
                  <div className="font-black text-slate-900">Le {Math.round(item.price * item.quantity).toLocaleString()}</div>
               </div>
             ))}
          </div>
          
          <div className="p-2 border-t border-slate-200 shrink-0">
             <Button 
                onClick={() => setIsCheckoutOpen(true)}
                disabled={cart.length === 0}
                className="w-full h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
             >
                Checkout Now (Le {Math.round(total).toLocaleString()})
             </Button>
          </div>
        </div>
      </div>
      
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl bg-white p-6">
            <h2 className="text-lg font-bold mb-4">Complete Sale</h2>
            <Button onClick={handleCheckout} className="w-full h-12 rounded-xl bg-blue-600 text-white">Confirm Payment (Le {Math.round(grandTotal).toLocaleString()})</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
