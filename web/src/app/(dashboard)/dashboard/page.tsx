"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  DollarSign,
  AlertCircle,
  Utensils,
  Beer,
  Stethoscope,
  Sparkles,
  History,
  Clock,
  ArrowRight,
  Activity,
  Receipt,
  Wallet,
  Smartphone as SmartphoneIcon,
  Printer,
  Book
} from "lucide-react";
import { useSession } from "next-auth/react";
import { cn, getIndustryColor } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getRecentSales } from "@/lib/actions/sale";
import { getDashboardStats } from "@/lib/actions/dashboard";
import { useRouter } from "next/navigation";
import { StatCard } from "@/components/dashboard/stat-card";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { format, subDays } from "date-fns";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    skuCount: 0,
    lowStock: 0,
    expiringItems: 0,
    activeTransactions: 0,
    staffCount: 0
  });
  const [loading, setLoading] = useState(true);

  const businessType = session?.user?.businessType || "SHOP";
  const colors = getIndustryColor(businessType);

  useEffect(() => {
    fetchDashboardData();
  }, [session]);

  // Derive chart data from last 7 days
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, "MMM dd");
    const amount = recentSales
      .filter(s => format(new Date(s.createdAt), "MMM dd") === dateStr)
      .reduce((sum, s) => sum + parseFloat(s.totalAmount), 0);
    return { name: dateStr, value: amount };
  });

  async function fetchDashboardData() {
    try {
      setLoading(true);
      const [sales, dashboardStats] = await Promise.all([
        getRecentSales(),
        getDashboardStats()
      ]);

      setRecentSales(sales);
      setStats(dashboardStats);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = session?.user?.email?.split('@')[0] || "Partner";
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
    
    let timeGreeting = "Hello";
    if (hour < 12) timeGreeting = "Good Morning";
    else if (hour < 17) timeGreeting = "Good Afternoon";
    else timeGreeting = "Good Evening";

    return `${timeGreeting}, ${formattedName}`;
  };

  const getContextInfo = () => {
    switch(businessType) {
      case "BAR":
        return { label: "Bar Intelligence", icon: Beer, sub: "Alcoholic beverage sales & tap performance" };
      case "RESTAURANT":
        return { label: "Culinary Intelligence", icon: Utensils, sub: "Kitchen throughput & table turnover" };
      case "PHARMACY":
        return { label: "Pharmacy Intelligence", icon: Stethoscope, sub: "Medical stock & prescription tracking" };
      default:
        return { label: "Retail Intelligence", icon: TrendingUp, sub: "Inventory velocity & customer flow" };
    }
  };

  const getPrimaryHex = (tailwindClass: string) => {
    if (tailwindClass.includes('indigo')) return '#4f46e5';
    if (tailwindClass.includes('rose')) return '#e11d48';
    if (tailwindClass.includes('emerald')) return '#059669';
    return '#2563eb'; // Default blue
  };

  const context = getContextInfo();

  return (
    <div className="relative min-h-full space-y-8 md:space-y-12 p-4 sm:p-6 md:p-10 bg-slate-50/30 dark:bg-slate-950/50">
      {/* Dynamic Background Ornament */}
      <div className={cn("absolute top-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full blur-[120px] opacity-[0.05] dark:opacity-[0.03] pointer-events-none", colors.primary)} />
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col xl:flex-row xl:items-end justify-between gap-8"
      >
        <div className="space-y-4">
           <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 transition-all hover:scale-105">
                 <div className="h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-500 animate-pulse" />
                 <span className="text-[9px] sm:text-[10px] font-[1000] text-emerald-700 dark:text-emerald-500 uppercase tracking-widest">System Active</span>
              </div>
              <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] text-slate-400 dark:text-slate-500">
                {format(new Date(), "EEEE, MMMM dd, yyyy")}
              </span>
           </div>

           <div className="space-y-2">
              <h2 className="text-xs sm:text-sm md:text-base font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 drop-shadow-sm">
                {getGreeting()}
              </h2>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-[1000] text-slate-900 dark:text-white tracking-tight leading-none italic uppercase">
                Welcome <span className="text-indigo-600">Back</span>
              </h1>
           </div>

           <div className="flex items-center gap-4 pt-2">
              <div className={cn("p-2.5 rounded-2xl text-white shadow-xl shadow-indigo-500/10", colors.primary)}>
                 <context.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-slate-900 dark:text-white font-[1000] text-xs sm:text-sm uppercase tracking-widest">{context.label}</p>
                <p className="text-slate-500 dark:text-slate-400 font-bold text-[9px] sm:text-[10px] uppercase tracking-tighter">{context.sub}</p>
              </div>
           </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
           <Button 
             onClick={() => router.push("/dashboard/manual")}
             variant="outline"
             className="h-14 sm:h-16 px-6 sm:px-8 rounded-2xl sm:rounded-[2rem] border-slate-200 bg-white dark:bg-slate-900 font-black uppercase tracking-widest text-[10px] sm:text-xs shadow-sm hover:bg-slate-50 transition-all hover:scale-[1.05] active:scale-95 gap-3"
           >
             <Book className="h-5 w-5 text-indigo-600" /> Manual
           </Button>
           <Button 
             onClick={() => router.push("/dashboard/pos")}
             className={cn("h-14 sm:h-16 px-8 sm:px-10 rounded-2xl sm:rounded-[2rem] text-white font-black uppercase tracking-widest text-[10px] sm:text-xs shadow-2xl transition-all hover:scale-[1.05] active:scale-95", colors.primary)}
           >
             <ShoppingCart className="mr-3 h-5 w-5" /> New Transaction
           </Button>
        </div>
      </motion.div>
      
      {/* KPI Cards: Responsive Grid 1/2/3/4 */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" id="dashboard-stats">
        <StatCard 
          title="Total Revenue" 
          value={stats.revenue} 
          prefix="Le "
          description="Global Platform Total" 
          icon={DollarSign}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50 dark:bg-emerald-950/30"
          delay={0.1}
          href="/dashboard/sales/history"
        />
        <StatCard 
          title="Today's Orders" 
          value={stats.orders} 
          description="Processing Cycles" 
          icon={ShoppingCart}
          colorClass="text-blue-600"
          bgClass="bg-blue-50 dark:bg-blue-950/30"
          delay={0.2}
          href="/dashboard/sales/orders"
        />
        <StatCard 
          title={businessType === "PHARMACY" ? "Drug Items" : "SKU Count"} 
          value={stats.skuCount} 
          description="Managed Catalog" 
          icon={Package}
          colorClass="text-purple-600"
          bgClass="bg-purple-50 dark:bg-purple-950/30"
          delay={0.3}
          href="/dashboard/inventory/products"
        />
        <StatCard 
          title="Low Stock" 
          value={stats.lowStock} 
          description="Urgent Attention" 
          icon={AlertCircle}
          colorClass="text-rose-600"
          bgClass="bg-rose-50 dark:bg-rose-950/30"
          delay={0.4}
          href="/dashboard/inventory/products"
        />
        {businessType === "PHARMACY" && (
          <StatCard 
            title="Expiring Items" 
            value={stats.expiringItems} 
            description="< 30 Days Alert" 
            icon={Clock}
            colorClass="text-amber-600"
            bgClass="bg-amber-50 dark:bg-amber-950/30"
            delay={0.5}
            href="/dashboard/inventory/expiry"
          />
        )}
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
        {/* Trend Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="lg:col-span-2 w-full min-h-[350px]"
        >
          <TrendChart 
            data={chartData} 
            title="Revenue Velocity" 
            description="Intelligence performance tracking (last 7 days)"
            dataKey="value"
            categoryKey="name"
            color={getPrimaryHex(colors.primary)}
          />
        </motion.div>

        {/* Action Center - Small Stats Nodes */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
           <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-sm overflow-hidden h-full flex flex-col">
             <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Intelligence Nodes</CardTitle>
                <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">System Operational Status</CardDescription>
             </CardHeader>
             <CardContent className="p-8 pt-4 flex-1 flex flex-col justify-center space-y-6">
                <div className="grid grid-cols-1 gap-4">
                    {[
                      { 
                        label: "Active Transactions", 
                        value: stats.activeTransactions.toString().padStart(2, '0'), 
                        icon: ShoppingCart, 
                        color: "text-emerald-500", 
                        bg: "bg-emerald-50 dark:bg-emerald-950/20" 
                      },
                      { 
                        label: "Inventory Thresholds", 
                        value: stats.lowStock.toString().padStart(2, '0'), 
                        icon: Package, 
                        color: "text-rose-500", 
                        bg: "bg-rose-50 dark:bg-rose-950/20" 
                      },
                      { 
                        label: "Staff Connectivity", 
                        value: stats.staffCount.toString().padStart(2, '0'), 
                        icon: Users, 
                        color: "text-blue-500", 
                        bg: "bg-blue-50 dark:bg-blue-950/20" 
                      }
                    ].map((node, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 transition-all hover:scale-[1.02] group">
                         <div className="flex items-center gap-4">
                            <div className={cn("p-3 rounded-xl", node.bg)}>
                               <node.icon className={cn("h-4 w-4", node.color)} />
                            </div>
                            <div>
                               <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest leading-none mb-1">{node.label}</p>
                               <p className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">{node.value}</p>
                            </div>
                         </div>
                         <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      </div>
                    ))}
                </div>
                
                <Button 
                  onClick={() => {
                    toast.loading("Initializing Neural Diagnostics...");
                    setTimeout(() => router.push("/dashboard/analytics"), 1500);
                  }}
                  className="w-full h-14 rounded-2xl bg-slate-900 text-white dark:bg-indigo-600 font-black text-[10px] uppercase tracking-[0.3em] shadow-xl transition-all hover:scale-[1.02] active:scale-95"
                >
                  Launch Neural Diagnostics
                </Button>
             </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3 pb-12">
        {/* Recent Transactions List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="lg:col-span-2"
        >
          <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-sm overflow-hidden h-full">
             <CardHeader className="p-8 border-b border-slate-100/50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/30">
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                         <CardTitle className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Intelligence Activity</CardTitle>
                         <CardDescription className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Live ledger stream</CardDescription>
                      </div>
                      <Button variant="ghost" size="sm" className="rounded-xl h-10 px-4 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-white dark:hover:bg-slate-800 self-start sm:self-auto" onClick={() => router.push("/dashboard/sales/history")}>
                         History Explorer <ArrowRight className="ml-2 h-3.5 w-3.5" />
                      </Button>
                   </div>
                </CardHeader>
                <CardContent className="p-0">
                   {loading ? (
                     <div className="p-20 flex flex-col items-center justify-center gap-6">
                        <div className="relative">
                           <div className="h-12 w-12 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
                           <div className="absolute inset-0 flex items-center justify-center">
                              <Activity className="h-4 w-4 text-primary animate-pulse" />
                           </div>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Syncing African Trade Nodes...</p>
                     </div>
                   ) : recentSales.length === 0 ? (
                     <div className="p-20 text-center space-y-6">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner border border-slate-100 dark:border-slate-700/50">
                           <History className="h-8 w-8 text-slate-200" />
                        </div>
                        <div className="space-y-2">
                           <p className="text-sm text-slate-400 font-bold uppercase tracking-widest leading-relaxed">No Intelligence entries found <br /> in the current cycle</p>
                           <Button variant="outline" className="h-10 rounded-xl border-slate-200 text-[10px] font-black uppercase tracking-widest" onClick={() => router.push("/dashboard/pos")}>Initialize First Sale</Button>
                        </div>
                     </div>
                   ) : (
                     <div className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
                        {recentSales.slice(0, 6).map((sale: any, idx) => (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 + (idx * 0.05), ease: "easeOut" }}
                            key={sale.id} 
                            className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all duration-500 group/item cursor-pointer gap-4"
                            onClick={() => {
                               setSelectedSale(sale);
                               setIsDetailsOpen(true);
                            }}
                          >
                             <div className="flex items-center gap-3 sm:gap-5">
                                <div className={cn("h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-black/[0.02] border border-white dark:border-slate-800 transition-transform duration-500 group-hover/item:scale-110 group-hover/item:rotate-3 shrink-0", colors.secondary)}>
                                   <Activity className={cn("h-4 w-4 sm:h-6 sm:w-6", colors.text)} />
                                </div>
                                <div className="min-w-0">
                                   <div className="font-black text-sm sm:text-lg text-slate-900 dark:text-white tracking-tight group-hover/item:text-primary transition-colors truncate">{sale.invoiceNumber}</div>
                                   <div className="flex items-center gap-2 sm:gap-3 text-[8px] sm:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-0.5">
                                      <div className="flex items-center gap-1.5"><Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> {format(new Date(sale.createdAt), "HH:mm")}</div>
                                      <div className="h-1 w-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                                      <span className="text-slate-500 font-bold italic">{sale.paymentMethod}</span>
                                   </div>
                                </div>
                             </div>
                             <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-x-6 gap-y-1.5 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-50 dark:border-slate-800/50 w-full sm:w-auto">
                                <div className="font-[1000] text-lg sm:text-xl text-slate-900 dark:text-white tracking-tighter shrink-0">
                                   Le {Math.round(parseFloat(sale.totalAmount)).toLocaleString()}
                                </div>
                                <div className={cn("px-2.5 py-1 rounded-lg text-[9px] font-[1000] uppercase tracking-widest shadow-sm shrink-0", 
                                   sale.paymentStatus === "PAID" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400")}>
                                   {sale.paymentStatus}
                                </div>
                             </div>
                          </motion.div>
                        ))}
                     </div>
                   )}
                </CardContent>
             </Card>
           </motion.div>
   
           {/* Intelligence Promotion */}
           <motion.div 
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.9 }}
           >
             <Card className="group border-none bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[2.5rem] p-8 sm:p-10 text-white shadow-2xl shadow-indigo-500/10 relative overflow-hidden h-full flex flex-col justify-center">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none group-hover:scale-150 transition-transform duration-700" />
                <Sparkles className="h-10 w-10 mb-6 text-primary animate-pulse shrink-0" />
                <h3 className="text-2xl font-[1000] tracking-tight mb-3 uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50 leading-none">Protech Forecast</h3>
                <p className="text-slate-400 text-[10px] font-bold leading-relaxed uppercase tracking-[0.15em] mb-8 max-w-sm">
                  Our neural predictive engines are analyzing your stock velocity. Upgrade to unlock advanced trade forecasting and demand simulation.
                </p>
             <Button 
               onClick={() => {
                 toast.info("Generating predictive demand models...");
                 setTimeout(() => router.push("/dashboard/analytics"), 1500);
               }}
               className="w-full h-14 bg-primary text-white hover:bg-primary/90 font-black text-xs uppercase tracking-[0.25em] shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 mt-auto"
             >
               Initialize Full Intelligence
             </Button>
          </Card>
        </motion.div>
      </div>

      {/* INVOICE DETAILS MODAL */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden bg-white text-slate-900">
           <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Receipt size={120} />
              </div>
              <div className="relative z-10 space-y-1">
                 <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Invoice Intelligence</div>
                 <h3 className="text-3xl font-[1000] tracking-tighter uppercase italic">{selectedSale?.invoiceNumber}</h3>
                 <div className="flex items-center gap-3 pt-2">
                    <div className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest", 
                       selectedSale?.paymentStatus === 'PAID' ? "bg-emerald-500 text-white" : "bg-amber-500 text-white")}>
                       {selectedSale?.paymentStatus}
                    </div>
                    <div className="h-1 w-1 rounded-full bg-slate-700" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedSale && format(new Date(selectedSale.createdAt), "PPP p")}</span>
                 </div>
              </div>
           </div>

           <div className="p-8 space-y-8 bg-white max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Line Item Breakdown</h4>
                 <div className="space-y-4">
                    {selectedSale?.items.map((item: any, i: number) => (
                       <div key={i} className="flex justify-between items-start group">
                          <div className="flex-1">
                             <div className="text-xs font-black text-slate-900 uppercase tracking-tight mb-1">{item.product?.name || 'Unknown Product'}</div>
                             <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                                {item.quantity} x Le {Math.round(item.unitPrice).toLocaleString()}
                             </div>
                          </div>
                          <div className="text-sm font-[1000] text-slate-900 tracking-tighter">
                             Le {Math.round(item.total).toLocaleString()}
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              <div className="pt-6 border-t border-slate-100 space-y-3">
                 <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span>Transaction Subtotal</span>
                    <span className="text-slate-900">Le {Math.round(selectedSale?.totalAmount / 1.15).toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span>Tax Applied (15%)</span>
                    <span className="text-slate-900">Le {Math.round(selectedSale?.totalAmount - (selectedSale?.totalAmount / 1.15)).toLocaleString()}</span>
                 </div>
                 <div className="h-px bg-slate-100 w-full my-2" />
                 <div className="flex justify-between items-end pt-2">
                    <div className="space-y-1">
                       <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Final Settlement</span>
                       <div className="text-4xl font-[1000] text-slate-900 tracking-tighter">Le {Math.round(selectedSale?.totalAmount).toLocaleString()}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Method</span>
                       <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                          {selectedSale?.paymentMethod === 'CASH' ? <Wallet size={12} className="text-blue-500" /> : <SmartphoneIcon size={12} className="text-emerald-500" />}
                          {selectedSale?.paymentMethod}
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="p-8 pt-0 flex gap-4 bg-white relative z-10">
              <Button variant="outline" className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-500 hover:bg-slate-50 border-slate-200 transition-all flex gap-2">
                 <Printer className="h-4 w-4" /> Print Copy
              </Button>
              <Button onClick={() => setIsDetailsOpen(false)} className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-slate-900 text-white hover:bg-slate-800 shadow-xl transition-all">
                 Close View
              </Button>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

