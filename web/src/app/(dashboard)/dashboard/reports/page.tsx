"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Package,
  Calendar,
  Download,
  Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { toast } from "sonner";
import { getRecentSales } from "@/lib/actions/sale";
import { getProducts } from "@/lib/actions/product";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function ReportsPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [sData, pData] = await Promise.all([
        getRecentSales(),
        getProducts()
      ]);
      setSales(sData);
      setProducts(pData);
    } catch (error) {
      toast.error("Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  }

  // Analytics Logic
  const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  
  // Calculate COGS and Profit
  const analytics = sales.reduce((acc, sale) => {
    sale.items.forEach((item: any) => {
      const product = products.find(p => p.id === item.productId);
      const cost = product?.costPrice || 0;
      acc.totalCost += (cost * item.quantity);
      
      // Top products tracking
      if (!acc.productSales[item.productId]) {
        acc.productSales[item.productId] = { name: product?.name || "Unknown", qty: 0, revenue: 0 };
      }
      acc.productSales[item.productId].qty += item.quantity;
      acc.productSales[item.productId].revenue += item.total;
    });
    return acc;
  }, { totalCost: 0, productSales: {} as any });

  const grossProfit = totalRevenue - analytics.totalCost;
  const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  const topProducts = Object.values(analytics.productSales)
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, 5);

  const chartData = sales.map(s => ({
    name: format(new Date(s.createdAt), "HH:mm"),
    revenue: s.totalAmount
  })).reverse();

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 font-[1000]">Financial Performance</h1>
          <p className="text-slate-500 font-medium">Deep-dive into your business profitability and sales velocity.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="rounded-xl border-slate-200 font-bold gap-2">
              <Download className="h-4 w-4" /> Export PDF
           </Button>
           <Button className="rounded-xl bg-slate-900 text-white font-bold gap-2">
              <Filter className="h-4 w-4" /> This Month
           </Button>
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-xl shadow-slate-100/50 bg-white rounded-3xl overflow-hidden relative group">
           <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <DollarSign className="h-3 w-3 text-primary" /> Net Revenue
              </CardTitle>
           </CardHeader>
           <CardContent>
              <div className="text-3xl font-[1000] text-slate-900 tracking-tighter">Le {Math.round(totalRevenue).toLocaleString()}</div>
              <div className="mt-2 flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase tracking-tighter">
                 <TrendingUp className="h-3 w-3" /> +12.5% from last month
              </div>
           </CardContent>
        </Card>
        <Card className="border-none shadow-xl shadow-slate-100/50 bg-white rounded-3xl overflow-hidden relative group">
           <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Package className="h-3 w-3 text-rose-500" /> Cost of Goods (COGS)
              </CardTitle>
           </CardHeader>
           <CardContent>
              <div className="text-3xl font-[1000] text-slate-900 tracking-tighter">Le {Math.round(analytics.totalCost).toLocaleString()}</div>
              <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">Direct material expenses</p>
           </CardContent>
        </Card>
        <Card className="border-none shadow-xl shadow-slate-100/50 bg-slate-900 text-white rounded-3xl overflow-hidden relative group">
           <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <TrendingUp className="h-3 w-3 text-emerald-400" /> Gross Profit
              </CardTitle>
           </CardHeader>
           <CardContent>
              <div className="text-3xl font-[1000] tracking-tighter">Le {Math.round(grossProfit).toLocaleString()}</div>
              <div className="mt-2 flex items-center gap-1 text-[10px] font-black text-emerald-400 uppercase tracking-tighter">
                 Margin: {margin.toFixed(1)}%
              </div>
           </CardContent>
        </Card>
        <Card className="border-none shadow-xl shadow-slate-100/50 bg-white rounded-3xl overflow-hidden relative group">
           <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <ShoppingCart className="h-3 w-3 text-blue-500" /> Transaction Vol.
              </CardTitle>
           </CardHeader>
           <CardContent>
              <div className="text-3xl font-[1000] text-slate-900 tracking-tighter">{sales.length} Sales</div>
              <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">Average Ticket: Le {Math.round(totalRevenue / (sales.length || 1)).toLocaleString()}</p>
           </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-7">
         {/* Sales Trend Chart */}
         <Card className="lg:col-span-4 border-none shadow-2xl shadow-slate-100/50 bg-white rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8">
               <CardTitle className="text-xl font-black">Sales Velocity</CardTitle>
               <CardDescription className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Revenue trends over recent sessions</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
               <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={chartData}>
                        <defs>
                           <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                           </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                        <Tooltip 
                           contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                           itemStyle={{ fontWeight: 800, color: '#6366f1' }}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                     </AreaChart>
                  </ResponsiveContainer>
               </div>
            </CardContent>
         </Card>

         {/* Top Products */}
         <Card className="lg:col-span-3 border-none shadow-2xl shadow-slate-100/50 bg-white rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8">
               <CardTitle className="text-xl font-black">Velocity Rankings</CardTitle>
               <CardDescription className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Best performing inventory items</CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
               <div className="space-y-6">
                  {topProducts.map((p: any, i) => (
                     <div key={i} className="flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                           <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-lg", COLORS[i % COLORS.length])}>
                              #{i+1}
                           </div>
                           <div className="flex flex-col">
                              <span className="font-black text-slate-800 text-sm">{p.name}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">{p.qty} Units Sold</span>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className="font-black text-slate-900">Le {Math.round(p.revenue).toLocaleString()}</div>
                           <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                              <div 
                                 className={cn("h-full rounded-full", COLORS[i % COLORS.length])} 
                                 style={{ width: `${(p.revenue / (topProducts[0] as any).revenue) * 100}%` }}
                              />
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </CardContent>
         </Card>
      </div>

      {/* Audit Log Preview */}
      <Card className="border-none shadow-2xl shadow-slate-100/50 bg-white rounded-[2.5rem] overflow-hidden">
         <CardHeader className="p-8 flex flex-row items-center justify-between">
            <div>
               <CardTitle className="text-xl font-black">Session Log</CardTitle>
               <CardDescription className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Raw transaction history for compliance</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="rounded-xl font-black text-primary text-[10px] uppercase tracking-widest">View Full Ledger</Button>
         </CardHeader>
         <CardContent className="p-0">
            <Table>
               <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-slate-50">
                     <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest pl-8">Transaction</TableHead>
                     <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Settlement</TableHead>
                     <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Value</TableHead>
                     <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest text-right pr-8">Status</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {sales.slice(0, 5).map((sale) => (
                     <TableRow key={sale.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors">
                        <TableCell className="pl-8 py-4">
                           <div className="font-black text-slate-800 text-sm">{sale.invoiceNumber}</div>
                           <div className="text-[10px] font-bold text-slate-400 uppercase">{format(new Date(sale.createdAt), "HH:mm • MMM dd")}</div>
                        </TableCell>
                        <TableCell>
                           <div className="flex items-center gap-2">
                              <DollarSign className="h-3 w-3 text-slate-300" />
                              <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">{sale.paymentMethod}</span>
                           </div>
                        </TableCell>
                        <TableCell>
                           <div className="font-black text-primary">Le {Math.round(sale.totalAmount).toLocaleString()}</div>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                           <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-tighter">
                              {sale.paymentStatus}
                           </span>
                        </TableCell>
                     </TableRow>
                  ))}
               </TableBody>
            </Table>
         </CardContent>
      </Card>
    </div>
  );
}
