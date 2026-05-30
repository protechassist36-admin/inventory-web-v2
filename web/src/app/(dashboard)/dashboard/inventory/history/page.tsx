"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  History, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCcw, 
  ShoppingCart, 
  Truck, 
  AlertTriangle,
  Package,
  Activity,
  User,
  Clock,
  LayoutGrid
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getStockMovements } from "@/lib/actions/stock";
import { cn, getIndustryColor } from "@/lib/utils";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";

export default function StockHistoryPage() {
  const { data: session } = useSession();
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const businessType = session?.user?.businessType || "SHOP";
  const colors = getIndustryColor(businessType);

  useEffect(() => {
    fetchMovements();
  }, []);

  async function fetchMovements() {
    try {
      setLoading(true);
      const data = await getStockMovements();
      setMovements(data);
    } catch (error) {
      toast.error("Failed to load stock movements.");
    } finally {
      setLoading(false);
    }
  }

  const filteredMovements = movements.filter(m => 
    m.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.reason && m.reason.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getMovementIcon = (type: string) => {
    switch(type) {
      case "IN": return <ArrowUpRight className="h-4 w-4 text-emerald-500" />;
      case "OUT": return <ArrowDownRight className="h-4 w-4 text-rose-500" />;
      case "ADJUSTMENT": return <RefreshCcw className="h-4 w-4 text-amber-500" />;
      case "RETURN": return <ShoppingCart className="h-4 w-4 text-blue-500" />;
      default: return <History className="h-4 w-4 text-slate-400" />;
    }
  };

  const getSourceIcon = (reason: string) => {
    if (reason.includes("Sale")) return <ShoppingCart className="h-3.5 w-3.5" />;
    if (reason.includes("Purchase")) return <Truck className="h-3.5 w-3.5" />;
    return <AlertTriangle className="h-3.5 w-3.5" />;
  };

  return (
    <div className="relative min-h-full space-y-8 p-6 md:p-10 bg-slate-50/30 dark:bg-slate-950/50">
      {/* Dynamic Background Ornament */}
      <div className={cn("absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-[0.05] dark:opacity-[0.03] pointer-events-none", colors.primary)} />
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div className="space-y-2">
           <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-500">
                Inventory Analytics
              </span>
              <div className="h-px w-8 bg-slate-200 dark:bg-slate-800" />
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                 <div className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-500 animate-pulse" />
                 <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-600 uppercase tracking-tighter">Live Ledger</span>
              </div>
           </div>
           <h1 className="text-4xl md:text-5xl font-[1000] text-slate-900 dark:text-white tracking-tight">
             Movement Ledger
           </h1>
           <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-[0.15em]">Trace every item lifecycle across your entire supply chain.</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] p-4 shadow-sm">
          <div className="relative group">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <Input 
              placeholder="Search by product name, SKU, or transaction reason..." 
              className="pl-12 h-12 rounded-2xl border-none bg-slate-50 dark:bg-slate-800/50 font-medium text-slate-700 dark:text-slate-200 focus-visible:ring-2 focus-visible:ring-indigo-500/20 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </Card>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-[2.5rem] border border-slate-200 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
              <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800/50">
                <TableHead className="h-14 font-black text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-[0.2em] pl-8">Timestamp</TableHead>
                <TableHead className="h-14 font-black text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-[0.2em]">Product Intel</TableHead>
                <TableHead className="h-14 font-black text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-[0.2em]">Movement</TableHead>
                <TableHead className="h-14 font-black text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-[0.2em]">Source & Context</TableHead>
                <TableHead className="h-14 font-black text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-[0.2em] pr-8 text-right">Logged By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [1,2,3,4,5,6].map(i => (
                  <TableRow key={i} className="border-slate-100 dark:border-slate-800/50">
                    <TableCell colSpan={5} className="h-20 animate-pulse bg-slate-50/30 dark:bg-slate-800/20" />
                  </TableRow>
                ))
              ) : filteredMovements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                     <div className="flex flex-col items-center justify-center gap-4">
                        <div className="h-16 w-16 rounded-[2rem] bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                           <History className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                        </div>
                        <p className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">No Intelligence Records Found</p>
                     </div>
                  </TableCell>
                </TableRow>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredMovements.map((m, idx) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      key={m.id} 
                      className="border-slate-100 dark:border-slate-800/50 group transition-all duration-300 hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                    >
                      <TableCell className="pl-8 py-5">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">{format(new Date(m.createdAt), "MMM dd, yyyy")}</span>
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                             <Clock className="h-3 w-3" /> {format(new Date(m.createdAt), "hh:mm a")}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-4">
                           <div className="h-10 w-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:scale-110 transition-transform">
                              <Package className="h-5 w-5" />
                           </div>
                           <div className="flex flex-col">
                              <div className="font-black text-slate-900 dark:text-white text-sm tracking-tight">{m.product.name}</div>
                              <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">SKU: {m.product.sku || "N/A"}</div>
                           </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-4">
                           <div className={cn(
                             "h-10 w-10 rounded-2xl flex items-center justify-center shadow-inner transition-all group-hover:rotate-12",
                             m.type === "IN" ? "bg-emerald-500/10" : m.type === "OUT" ? "bg-rose-500/10" : "bg-amber-500/10"
                           )}>
                              {getMovementIcon(m.type)}
                           </div>
                           <div className="flex flex-col">
                              <span className={cn(
                                "font-[1000] text-lg leading-none tracking-tighter",
                                m.type === "IN" ? "text-emerald-600 dark:text-emerald-500" : m.type === "OUT" ? "text-rose-600 dark:text-rose-500" : "text-amber-600 dark:text-amber-500"
                              )}>
                                 {m.type === "IN" ? "+" : "-"}{m.quantity}
                              </span>
                              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">{m.type}</span>
                           </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 w-fit group-hover:border-indigo-500/20 transition-colors">
                           <div className="text-slate-400 dark:text-slate-500">
                              {getSourceIcon(m.reason || "")}
                           </div>
                           <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight">{m.reason || "System Adjustment"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="pr-8 text-right">
                        <div className="flex items-center justify-end gap-3">
                           <div className="flex flex-col items-end gap-0.5">
                              <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{m.user.name}</span>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Verified Node</span>
                           </div>
                           <div className={cn("h-9 w-9 rounded-2xl flex items-center justify-center text-xs font-black text-white shadow-lg", colors.primary)}>
                              {m.user.name?.charAt(0) || "U"}
                           </div>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </TableBody>
          </Table>
        </div>
      </motion.div>
    </div>
  );
}
