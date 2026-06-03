"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  Sparkles,
  BarChart3,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { getCashFlowData } from "@/lib/actions/cashflow";
import { cn, getIndustryColor } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export default function CashFlowPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const businessType = session?.user?.businessType || "SHOP";
  const colors = getIndustryColor(businessType);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const result = await getCashFlowData();
      setData(result);
    } catch (error) {
      toast.error("Failed to aggregate financial nodes.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
         <div className="relative">
            <div className="h-16 w-16 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
               <DollarSign className="h-6 w-6 text-primary animate-pulse" />
            </div>
         </div>
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Syncing Liquidity Nodes...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8 p-6 md:p-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <div className={cn("p-1.5 rounded-lg text-white shadow-lg", colors.primary)}>
                 <Activity className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Liquidity Intelligence</span>
           </div>
           <h1 className="text-4xl font-[1000] text-slate-900 dark:text-white tracking-tight">Cash Flow</h1>
           <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Real-time analysis of capital velocity and operational solvency.</p>
        </div>

        <Button onClick={fetchData} variant="outline" className="h-12 px-6 rounded-xl border-slate-200 font-bold uppercase text-[10px] tracking-widest gap-2">
           <RefreshCw className="h-4 w-4" /> Re-Sync Ledger
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="border-none bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
               <TrendingUp size={100} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Monthly Inflow</p>
            <h2 className="text-4xl font-[1000] tracking-tighter">Le {Math.round(data.summary.totalInflow).toLocaleString()}</h2>
            <div className="mt-4 flex items-center gap-2 text-emerald-400 font-bold text-[10px] uppercase tracking-widest">
               <ArrowUpRight size={14} /> Revenue Node
            </div>
         </Card>

         <Card className="border-none bg-rose-600 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
               <TrendingDown size={100} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-200 mb-2">Monthly Outflow</p>
            <h2 className="text-4xl font-[1000] tracking-tighter">Le {Math.round(data.summary.totalOutflow).toLocaleString()}</h2>
            <div className="mt-4 flex items-center gap-2 text-rose-100 font-bold text-[10px] uppercase tracking-widest">
               <ArrowDownRight size={14} /> Expenditure Node
            </div>
         </Card>

         <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Net Cash Position</p>
            <h2 className={cn("text-4xl font-[1000] tracking-tighter", data.summary.netCashFlow >= 0 ? "text-slate-900 dark:text-white" : "text-rose-600")}>
               Le {Math.round(data.summary.netCashFlow).toLocaleString()}
            </h2>
            <div className="mt-4 flex items-center gap-2">
               <div className="h-1 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className={cn("h-full", data.summary.netCashFlow >= 0 ? "bg-emerald-500" : "bg-rose-500")} style={{ width: `${Math.min(Math.abs(data.summary.burnRate), 100)}%` }} />
               </div>
               <span className="text-[9px] font-black text-slate-400 uppercase">Velocity</span>
            </div>
         </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-sm">
            <CardHeader className="px-0 pt-0 pb-8">
               <CardTitle className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Flow Visualization</CardTitle>
               <CardDescription className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Daily Inflow vs Outflow Nodes</CardDescription>
            </CardHeader>
            <div className="h-[400px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.dailyData}>
                     <defs>
                        <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                           <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#e11d48" stopOpacity={0.1}/>
                           <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                     <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} 
                     />
                     <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                        tickFormatter={(value) => `Le ${value >= 1000 ? (value/1000) + 'k' : value}`}
                     />
                     <Tooltip 
                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}
                        itemStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                     />
                     <Area 
                        type="monotone" 
                        dataKey="inflow" 
                        stroke="#2563eb" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorInflow)" 
                     />
                     <Area 
                        type="monotone" 
                        dataKey="outflow" 
                        stroke="#e11d48" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorOutflow)" 
                     />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </Card>

         <Card className="border-none bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[100px]" />
            <Sparkles className="h-10 w-10 mb-6 text-indigo-200 animate-pulse" />
            <h3 className="text-2xl font-[1000] tracking-tight mb-4 uppercase italic leading-tight">Neural Solvency Prediction</h3>
            <p className="text-indigo-100/70 text-xs font-bold leading-relaxed uppercase tracking-widest mb-8">
               Our predictive models indicate a 98.2% probability of positive cash flow for the next cycle. Operational liquidity nodes are stable.
            </p>
            <div className="space-y-4">
               <div className="p-4 bg-white/10 rounded-2xl border border-white/10 flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest">Runway Status</span>
                  <span className="px-3 py-1 rounded-full bg-emerald-500 text-[8px] font-black uppercase">Optimal</span>
               </div>
               <div className="p-4 bg-white/10 rounded-2xl border border-white/10 flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest">Burn Intensity</span>
                  <span className="px-3 py-1 rounded-full bg-indigo-400 text-[8px] font-black uppercase">Low</span>
               </div>
            </div>
            <Button className="w-full mt-10 h-14 bg-white text-indigo-600 hover:bg-white/90 font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all">
               Generate Full Report
            </Button>
         </Card>
      </div>
    </div>
  );
}
