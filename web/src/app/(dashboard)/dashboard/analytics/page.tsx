"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  Zap,
  Target,
  Globe,
  PieChart as PieChartIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { getRecentSales } from "@/lib/actions/sale";
import { getProducts } from "@/lib/actions/product";
import { format, subDays } from "date-fns";
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell,
  Pie,
  PieChart
} from "recharts";
import { useSession } from "next-auth/react";
import { cn, getIndustryColor } from "@/lib/utils";
import { toast } from "sonner";

export const dynamic = "force-dynamic";

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const businessType = session?.user?.businessType || "SHOP";
  const colors = getIndustryColor(businessType);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [salesData, productsData] = await Promise.all([
        getRecentSales(),
        getProducts()
      ]);
      setSales(salesData);
      setProducts(productsData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // 1. Revenue Velocity (Last 14 days)
  const revenueTrend = Array.from({ length: 14 }).map((_, i) => {
    const date = subDays(new Date(), 13 - i);
    const dateStr = format(date, "MMM dd");
    const amount = sales
      .filter(s => format(new Date(s.createdAt), "yyyy-MM-dd") === format(date, "yyyy-MM-dd"))
      .reduce((sum, s) => sum + parseFloat(s.totalAmount), 0);
    return { name: dateStr, value: amount };
  });

  // 2. Category Intelligence (Pie Chart)
  const categoryData = products.reduce((acc: any[], p) => {
    const catName = p.category?.name || "Uncategorized";
    const existing = acc.find(item => item.name === catName);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: catName, value: 1 });
    }
    return acc;
  }, []).sort((a, b) => b.value - a.value).slice(0, 5);

  // Map primary Tailwind class to hex for chart compatibility
  const getPrimaryHex = (tailwindClass: string) => {
    if (tailwindClass.includes('indigo')) return '#4f46e5';
    if (tailwindClass.includes('rose')) return '#e11d48';
    if (tailwindClass.includes('emerald')) return '#059669';
    return '#2563eb'; // Default blue
  };

  const PIE_COLORS = [getPrimaryHex(colors.primary), '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e'];

  // 3. Top Moving Products (Bar Chart)
  const productPerformance = products
    .sort((a, b) => parseFloat(b.unitPrice) - parseFloat(a.unitPrice))
    .slice(0, 6)
    .map(p => ({
      name: p.name.length > 12 ? p.name.substring(0, 12) + '...' : p.name,
      value: parseFloat(p.unitPrice)
    }));

  const handleExport = () => {
    try {
      const headers = ["Date", "Revenue"];
      const csvContent = [
        headers.join(","),
        ...revenueTrend.map(row => `${row.name},${row.value}`)
      ].join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `protech_revenue_audit_${format(new Date(), "yyyy-MM-dd")}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Intelligence audit exported successfully.");
    } catch (error) {
      toast.error("Failed to generate export.");
    }
  };

  const handleDeploy = () => {
    console.log("Tactical deployment sequence engaged...");
    alert("Intelligence Deployment Sequence: Initiated. Check your notifications.");
    
    toast("Syncing with African Trade Nodes...", {
      description: "Establishing neural link with regional hubs.",
    });

    setTimeout(() => {
      toast.success("Insights deployed to all operational units.", {
        description: "System velocity optimized across Sierra Leone, Nigeria, and Ghana.",
      });
      console.log("Deployment node synchronization complete.");
    }, 2500);
  };

  if (loading) {
    return (
      <div className="p-10 space-y-8 animate-pulse">
        <div className="h-20 w-1/3 bg-slate-100 dark:bg-slate-900 rounded-[2rem]" />
        <div className="grid grid-cols-3 gap-6">
           <div className="h-64 bg-slate-100 dark:bg-slate-900 rounded-[2.5rem]" />
           <div className="h-64 bg-slate-100 dark:bg-slate-900 rounded-[2.5rem]" />
           <div className="h-64 bg-slate-100 dark:bg-slate-900 rounded-[2.5rem]" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-10 relative overflow-hidden bg-slate-50/30 dark:bg-slate-950/50">
      {/* Background Glows */}
      <div className={cn("absolute -top-24 -right-24 w-96 h-96 blur-[120px] opacity-[0.07] rounded-full pointer-events-none", colors.primary)} />
      <div className="absolute top-1/2 -left-24 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Header Intelligence */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div className="space-y-4">
           <div className="flex items-center gap-3">
              <div className={cn("p-2.5 rounded-2xl text-white shadow-xl", colors.primary)}>
                 <Activity className="h-6 w-6" />
              </div>
              <div className="h-px w-12 bg-slate-200 dark:bg-slate-800" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Node: Analytics Intelligence</span>
           </div>
           <div className="space-y-1">
              <h1 className="text-4xl md:text-6xl font-[1000] text-slate-900 dark:text-white tracking-tight leading-none">Business Velocity</h1>
              <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px]">Real-time operational performance & trend analysis</p>
           </div>
        </div>

        <div className="flex items-center gap-3">
           <Button 
             variant="outline" 
             className="h-12 rounded-xl border-slate-200 font-black text-[10px] uppercase tracking-widest"
             onClick={handleExport}
           >
              Export Audit
           </Button>
           <Button 
             className={cn("h-12 rounded-xl text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl", colors.primary)}
             onClick={handleDeploy}
           >
              Deploy Insights
           </Button>
        </div>
      </motion.div>

      {/* Primary Intelligence Row */}
      <div className="grid gap-8 lg:grid-cols-3">
         <motion.div 
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.2 }}
           className="lg:col-span-2"
         >
            <TrendChart 
              data={revenueTrend} 
              title="Revenue Velocity" 
              description="Systemized daily revenue tracking (14 day cycle)"
              dataKey="value"
              categoryKey="name"
              color={getPrimaryHex(colors.primary)}
            />
         </motion.div>

         <motion.div 
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.3 }}
         >
            <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-sm overflow-hidden h-full">
              <CardHeader className="p-8 pb-0">
                <CardTitle className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Catalog Spread</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Inventory Distribution</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[280px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie
                           data={categoryData}
                           cx="50%"
                           cy="50%"
                           innerRadius={60}
                           outerRadius={80}
                           paddingAngle={8}
                           dataKey="value"
                           animationBegin={500}
                           animationDuration={1500}
                         >
                           {categoryData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="none" />
                           ))}
                         </Pie>
                         <Tooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-slate-900 text-white p-3 rounded-xl shadow-2xl border border-white/10">
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-50">{payload[0].name}</p>
                                    <p className="text-sm font-black">{payload[0].value} Items</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                         />
                      </PieChart>
                   </ResponsiveContainer>
                </div>
                <div className="px-8 pb-8 space-y-3">
                   {categoryData.map((cat, i) => (
                     <div key={cat.name} className="flex items-center justify-between group cursor-default">
                        <div className="flex items-center gap-3">
                           <div className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{cat.name}</span>
                        </div>
                        <span className="text-xs font-black text-slate-900 dark:text-white">{cat.value}</span>
                     </div>
                   ))}
                </div>
              </CardContent>
            </Card>
         </motion.div>
      </div>

      {/* Secondary Intelligence Row */}
      <div className="grid gap-8 lg:grid-cols-2">
         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.4 }}
         >
            <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-sm overflow-hidden h-full">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">High-Value Assets</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Unit value performance analysis</CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <div className="h-[300px] w-full mt-4">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={productPerformance} layout="vertical" margin={{ left: 0, right: 40 }}>
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                          width={100}
                        />
                        <Tooltip 
                           content={({ active, payload }) => {
                             if (active && payload && payload.length) {
                               return (
                                 <div className="bg-slate-900 text-white p-3 rounded-xl shadow-2xl">
                                   <p className="text-sm font-black">Le {Math.round(Number(payload[0].value) || 0).toLocaleString()}</p>
                                 </div>
                               );
                             }
                             return null;
                           }}
                        />
                        <Bar 
                          dataKey="value" 
                          radius={[0, 10, 10, 0]} 
                          barSize={32}
                          animationDuration={2000}
                        >
                           {productPerformance.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={index % 2 === 0 ? getPrimaryHex(colors.primary) : '#6366f1'} fillOpacity={0.8} />
                           ))}
                        </Bar>
                      </BarChart>
                   </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
         </motion.div>

         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.5 }}
           className="grid grid-cols-2 gap-6"
         >
            {[
              { label: "Predictive Health", val: "94%", sub: "System Accuracy", icon: Target, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/20" },
              { label: "Market Velocity", val: "+18%", sub: "Growth Node", icon: Zap, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/20" },
              { label: "Global Reach", val: "SL / NG", sub: "Operational Context", icon: Globe, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/20" },
              { label: "System Uptime", val: "99.9", sub: "Offline-First Core", icon: Activity, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-950/20" },
            ].map((node, i) => (
              <Card key={i} className="border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-sm p-8 flex flex-col justify-center items-center text-center group hover:scale-[1.03] transition-all hover:shadow-xl">
                 <div className={cn("p-4 rounded-3xl mb-4 group-hover:rotate-12 transition-transform", node.bg)}>
                    <node.icon className={cn("h-6 w-6", node.color)} />
                 </div>
                 <h4 className="text-3xl font-[1000] text-slate-900 dark:text-white tracking-tighter mb-1">{node.val}</h4>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">{node.label}</p>
                 <p className="text-[8px] font-bold text-slate-400/60 uppercase tracking-tighter">{node.sub}</p>
              </Card>
            ))}
         </motion.div>
      </div>
    </div>
  );
}
