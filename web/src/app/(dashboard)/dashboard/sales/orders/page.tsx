"use client";

import { useState, useEffect, useMemo } from "react";
import { format, subDays } from "date-fns";
import { toast } from "sonner";
import { 
  ShoppingCart, 
  DollarSign, 
  Plus, 
  Printer, 
  Wallet, 
  Smartphone, 
  User, 
  Search, 
  ArrowLeft, 
  FileDown, 
  Edit, 
  History,
  Info,
  Layers,
  Calendar,
  Filter,
  CheckCircle2,
  Box,
  ChevronRight,
  TrendingUp,
  Activity,
  ShieldCheck,
  Clock,
  AlertCircle,
  ArrowUpRight,
  MapPin,
  Phone,
  Mail,
  Receipt,
  Calculator
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { getSalesOrderSummary } from "@/lib/actions/sales-summary";
import { getSalesHistoryByRange, getOrderStatusHistory, updateSaleStatus } from "@/lib/actions/sale";
import { getBusinessProfile } from "@/lib/actions/business";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function SalesOrdersPage() {
  // Global States
  const [activeTab, setActiveTab] = useState("summary");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [business, setBusiness] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRange, setFilterRange] = useState("TODAY");

  // Detail Workspace States
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [managementTab, setManagementTab] = useState("activities");
  const [newStatus, setNewStatus] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filterRange]);

  async function fetchData() {
    try {
      setLoading(true);
      const now = new Date();
      let start: Date, end: Date = now;

      switch (filterRange) {
        case "TODAY":
          start = subDays(now, 0);
          start.setHours(0, 0, 0, 0);
          break;
        case "THIS_WEEK":
          start = subDays(now, 7);
          break;
        case "THIS_MONTH":
          start = subDays(now, 30);
          break;
        case "LAST_THREE_MONTHS":
          start = subDays(now, 90);
          break;
        case "LAST_SIX_MONTHS":
          start = subDays(now, 180);
          break;
        case "THIS_YEAR":
          start = new Date(now.getFullYear(), 0, 1);
          break;
        case "ALL_TIME":
          start = new Date(2000, 0, 1);
          break;
        default:
          start = subDays(now, 30);
      }
      
      const [summaryData, salesData, businessData] = await Promise.all([
        getSalesOrderSummary(start, end).catch(e => { console.error("Summary Sync Failed:", e); throw e; }),
        getSalesHistoryByRange(start, end).catch(e => { console.error("History Sync Failed:", e); throw e; }),
        getBusinessProfile().catch(e => { console.error("Business Profile Sync Failed:", e); throw e; })
      ]);
      
      setSummary(summaryData);
      setSales(salesData);
      setBusiness(businessData);
    } catch (error: any) {
      console.error("MASTER SYNC ERROR:", error);
      toast.error(`Audit synchronization failure: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectOrder(sale: any) {
    setSelectedSale(sale);
    setNewStatus(sale.status.toLowerCase());
    try {
      const history = await getOrderStatusHistory(sale.id);
      setStatusHistory(history);
    } catch (e) {
      console.error("Timeline load failed:", e);
      toast.error("Failed to load audit trail.");
    }
  }

  async function handleUpdateStatus() {
    if (!selectedSale || !newStatus) return;

    try {
      setIsUpdatingStatus(true);
      // Ensure status is uppercase for the backend
      const formattedStatus = newStatus.toUpperCase();
      const res = await updateSaleStatus(selectedSale.id, formattedStatus);
      if (res.success) {
        toast.success("State change executed successfully.");
        // Refresh data
        fetchData();
        const history = await getOrderStatusHistory(selectedSale.id);
        setStatusHistory(history);
        setSelectedSale({ ...selectedSale, status: res.status });
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  const groupedSales = useMemo(() => {
    const filtered = sales.filter(s => 
        s.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.customerName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const groups: Record<string, any[]> = {};
    filtered.forEach(sale => {
        const dateKey = format(new Date(sale.createdAt), "MMMM do, yyyy");
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(sale);
    });
    return groups;
  }, [sales, searchQuery]);

  const statuses = [
    { name: "completed", color: "bg-emerald-500", icon: CheckCircle2 },
    { name: "failed", color: "bg-rose-500", icon: Info },
    { name: "pending", color: "bg-amber-500", icon: Clock },
    { name: "confirmed", color: "bg-blue-500", icon: ShieldCheck },
    { name: "processing", color: "bg-indigo-500", icon: Activity },
    { name: "cancelled", color: "bg-slate-500", icon: Box },
    { name: "returned", color: "bg-orange-500", icon: History },
  ];

  if (loading && !selectedSale && sales.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4 text-slate-400">
           <Layers className="h-10 w-10 animate-pulse text-indigo-600" />
           <p className="font-black uppercase text-[10px] tracking-[0.4em]">Initializing Ecosystem Intel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col p-6 bg-slate-50 overflow-hidden relative selection:bg-indigo-600/10 selection:text-indigo-600">
      
      {/* 1. MASTER HEADER (DYNAMIC) */}
      <AnimatePresence mode="wait">
        {!selectedSale ? (
          <motion.div 
            key="master-header"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex justify-between items-end mb-8 shrink-0"
          >
            <div className="flex items-center gap-5">
               <div className="h-14 w-14 rounded-[1.25rem] bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-600/30">
                  <ShoppingCart className="h-7 w-7" />
               </div>
               <div>
                  <h1 className="text-4xl font-[1000] uppercase tracking-tighter italic text-slate-900 leading-none">Sales <span className="text-indigo-600">Orders</span></h1>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Order Management & Business Insights</p>
               </div>
            </div>
            
            <div className="flex gap-4 items-center">
                <Tabs value={activeTab} onValueChange={(v: string | null) => setActiveTab(v ?? "summary")} className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                  <TabsList className="bg-transparent border-none p-0">
                    <TabsTrigger value="summary" className="px-8 h-10 rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">Overview</TabsTrigger>
                    <TabsTrigger value="orders" className="px-8 h-10 rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">Orders</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="h-8 w-px bg-slate-200 mx-2" />
                <Link 
                    href="/dashboard/sales/orders/new"
                    className={cn(buttonVariants({ variant: "default" }), "h-14 px-10 rounded-2xl bg-slate-950 hover:bg-indigo-600 text-white font-black uppercase text-[11px] tracking-[0.2em] gap-3 shadow-2xl transition-all hover:scale-[1.02] active:scale-95")}
                >
                    <Plus className="h-5 w-5" /> New Order
                </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Tabs value={activeTab} className="flex-1 flex flex-col overflow-hidden">
        {/* --- SUMMARY TAB --- */}
        <TabsContent value="summary" className="flex-1 overflow-y-auto pr-2 custom-scrollbar focus-visible:ring-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <Card className="rounded-[3rem] border-none shadow-sm bg-white p-12 group hover:shadow-2xl transition-all duration-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50/50 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform duration-700" />
              <CardHeader className="flex flex-row items-center justify-between p-0 pb-10">
                <CardTitle className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em]">Total Order Volume</CardTitle>
                <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner"><ShoppingCart className="h-7 w-7" /></div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="text-7xl font-[1000] tracking-tighter text-slate-950 italic leading-none">{summary?.totalOrders || 0} <span className="text-sm not-italic uppercase tracking-[0.3em] text-slate-300 ml-4 font-black">Orders</span></div>
              </CardContent>
            </Card>
            <Card className="rounded-[3rem] border-none shadow-sm bg-white p-12 group hover:shadow-2xl transition-all duration-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50/50 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform duration-700" />
              <CardHeader className="flex flex-row items-center justify-between p-0 pb-10">
                <CardTitle className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em]">Total Revenue</CardTitle>
                <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 shadow-inner"><DollarSign className="h-7 w-7" /></div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="text-7xl font-[1000] tracking-tighter text-slate-950 italic leading-none">NLe {(summary?.totalAmount || 0).toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <Card className="lg:col-span-2 rounded-[3.5rem] border-none shadow-sm p-14 bg-white">
              <div className="flex items-center justify-between mb-16 border-b border-slate-50 pb-10">
                 <div className="flex items-center gap-5">
                    <div className="h-12 w-12 rounded-2xl bg-slate-950 flex items-center justify-center text-white"><History className="h-6 w-6" /></div>
                    <h2 className="text-3xl font-[1000] uppercase tracking-widest italic text-slate-950">Status <span className="text-indigo-600">Breakdown</span></h2>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mb-1">System Health</p>
                    <div className="flex items-center gap-2 text-emerald-500 font-[1000] text-sm italic tracking-widest uppercase"><TrendingUp size={16} /> Operational</div>
                 </div>
              </div>
              
              <div className="grid grid-cols-1 gap-12">
                {statuses.map(({ name, color, icon: StatusIcon }) => {
                  const data = summary?.statusSummary?.[name] || { count: 0, amount: 0 };
                  const percentage = summary?.totalOrders ? (data.count / summary.totalOrders) * 100 : 0;
                  return (
                    <div key={name} className="group relative">
                      <div className="flex justify-between items-end mb-5">
                        <div className="flex gap-6 items-center">
                           <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all group-hover:scale-110", color)}>
                              <StatusIcon size={24} />
                           </div>
                           <div className="space-y-1.5">
                              <div className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-300 group-hover:text-indigo-600 transition-colors">{name}</div>
                              <div className="text-3xl font-black text-slate-950 tracking-tighter italic">{data.count} <span className="text-[11px] not-italic text-slate-400 font-bold uppercase tracking-[0.3em] ml-2">Total</span></div>
                           </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <div className="text-xl font-black text-slate-900 tracking-tight italic">NLe {data.amount.toLocaleString()}</div>
                          <div className="px-4 py-1 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-black text-indigo-600 uppercase tracking-widest shadow-sm">{percentage.toFixed(1)}% weight</div>
                        </div>
                      </div>
                      <div className="h-4 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-1">
                        <div 
                          className={cn("h-full rounded-full transition-all duration-1000 ease-out shadow-sm shadow-black/10", color)} 
                          style={{ width: `${percentage}%` }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="rounded-[3.5rem] border-none bg-slate-950 p-14 text-white shadow-2xl relative overflow-hidden flex flex-col justify-center">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />
               <div className="relative z-10 space-y-10">
                  <div className="space-y-4">
                     <ShieldCheck className="h-12 w-12 text-indigo-400 animate-pulse" />
                     <h3 className="text-3xl font-[1000] uppercase italic tracking-tighter">Order Risk <span className="text-indigo-500">Summary</span></h3>
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Automatic Risk Analysis</p>
                  </div>
                  
                  <div className="space-y-6">
                     <div className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/10">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Accuracy</span>
                        <span className="text-xl font-black italic text-emerald-500">99.8%</span>
                     </div>
                     <div className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/10">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fulfillment Risk</span>
                        <span className="text-xl font-black italic text-indigo-400">Low</span>
                     </div>
                     <div className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/10">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Anomaly Detection</span>
                        <span className="text-xl font-black italic text-emerald-500">Negative</span>
                     </div>
                  </div>

                  <Button className="w-full h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-[0.3em] shadow-xl shadow-indigo-600/20 transition-all active:scale-95">
                     Generate Report
                  </Button>
               </div>
            </Card>
          </div>
        </TabsContent>

        {/* --- ORDERS TAB --- */}
        <TabsContent value="orders" className="flex-1 flex flex-col overflow-hidden focus-visible:ring-0">
          
          {/* A. TABLE VIEW */}
          {!selectedSale && (
            <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-12 duration-1000">
               <Card className="rounded-[3.5rem] border-none shadow-sm bg-white p-12 flex flex-col flex-1 overflow-hidden relative">
                  {/* Operations Toolbar */}
                  <div className="flex flex-wrap items-center gap-6 mb-12 shrink-0">
                    <div className="flex items-center gap-4 bg-slate-50 px-8 h-16 rounded-[1.5rem] border border-slate-100 shadow-inner">
                       <Calendar className="h-5 w-5 text-indigo-600" />
                       <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 italic">Current Date Range</span>
                    </div>
                    
                    <div className="relative flex-1 min-w-[400px] group">
                       <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                       <Input 
                         placeholder="Search orders or customers..." 
                         className="h-16 pl-16 pr-8 rounded-[1.5rem] border-slate-100 bg-slate-50/30 focus:bg-white text-base font-bold tracking-tight shadow-sm transition-all focus:ring-4 focus:ring-indigo-600/5 placeholder:text-slate-300"
                         value={searchQuery}
                         onChange={(e) => setSearchQuery(e.target.value)}
                       />
                    </div>

                    <div className="flex gap-3">
                       <Button variant="outline" className="h-16 px-8 rounded-[1.5rem] border-slate-100 bg-white font-black text-[11px] uppercase tracking-[0.2em] text-slate-500 gap-4 hover:bg-slate-50 shadow-sm"><Filter className="h-5 w-5" /> Filter Results</Button>
                    </div>
                  </div>

                  {/* High-Contrast Intelligence Table */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar rounded-[2rem] border border-slate-50 bg-slate-50/30">
                     <Table>
                        <TableHeader className="bg-white border-b border-slate-100 sticky top-0 z-20">
                            <TableRow className="hover:bg-transparent border-none text-[12px] font-[1000] uppercase tracking-[0.4em] text-slate-300">
                                <TableHead className="h-20 px-12">Invoice #</TableHead>
                                <TableHead className="h-20">Customer Name</TableHead>
                                <TableHead className="h-20 text-center">Status</TableHead>
                                <TableHead className="h-20">Order Date</TableHead>
                                <TableHead className="h-20 text-right pr-12">Total Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="bg-transparent">
                            {sales.map((sale) => (
                                <TableRow 
                                    key={sale.id} 
                                    onClick={() => handleSelectOrder(sale)}
                                    className="group cursor-pointer hover:bg-white transition-all border-b border-slate-100/50"
                                >
                                    <TableCell className="px-12 h-28">
                                        <div className="font-black text-slate-950 text-xl tracking-tighter italic group-hover:text-indigo-600 transition-colors">{sale.invoiceNumber}</div>
                                        <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mt-1.5 flex items-center gap-2 italic">
                                           <div className="h-1 w-1 rounded-full bg-indigo-500" /> Commercial Entry
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none mb-2">{sale.customerName}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Verified Partner</div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge className="bg-slate-950 text-white font-black text-[10px] uppercase tracking-[0.2em] px-5 h-8 rounded-xl shadow-lg shadow-black/20">{sale.status}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm font-black text-slate-700 tracking-tighter italic">{format(new Date(sale.createdAt), "MMMM do, yyyy")}</div>
                                        <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mt-1.5">{format(new Date(sale.createdAt), "hh:mm:ss a")}</div>
                                    </TableCell>
                                    <TableCell className="text-right pr-12">
                                        <div className="text-2xl font-[1000] text-slate-950 tracking-tighter italic leading-none mb-1">NLe {sale.totalAmount.toLocaleString()}</div>
                                        <Badge variant="outline" className="h-5 px-2 rounded-lg border-emerald-100 bg-emerald-50 text-emerald-700 text-[9px] font-black tracking-widest uppercase border-none italic">Settled</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                     </Table>
                  </div>
               </Card>
            </div>
          )}

          {/* B. THREE-COLUMN ERP WORKSPACE */}
          {selectedSale && (
            <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-700">
               
               {/* Workspace Navigation Bar */}
               <div className="flex items-center justify-between bg-white px-10 h-28 rounded-t-[3.5rem] border-b border-slate-100 shrink-0 relative z-40 shadow-sm">
                  <div className="flex items-center gap-12">
                     <Button 
                        variant="ghost" 
                        onClick={() => setSelectedSale(null)}
                        className="h-14 px-8 rounded-2xl hover:bg-slate-50 font-[1000] text-[12px] uppercase tracking-[0.3em] gap-4 text-slate-300 transition-all group"
                     >
                        <ArrowLeft className="h-5 w-5 group-hover:-translate-x-2 transition-transform" /> Back to List
                     </Button>
                     <div className="h-10 w-px bg-slate-100" />
                     <div className="flex items-center gap-6">
                        <div className="space-y-1">
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] italic leading-none">Order Instance</p>
                           <h2 className="text-3xl font-[1000] uppercase tracking-tighter italic text-slate-950 leading-none">Invoice: {selectedSale.invoiceNumber}</h2>
                        </div>
                        <Badge className="bg-indigo-600 text-white font-black text-[11px] uppercase tracking-[0.2em] h-10 px-8 rounded-2xl shadow-[0_15px_30px_-10px_rgba(79,70,229,0.6)]">{selectedSale.status}</Badge>
                     </div>
                  </div>

                  <div className="flex items-center gap-4">
                     <Button variant="outline" className="h-14 px-8 rounded-[1.25rem] font-black uppercase text-[10px] tracking-[0.2em] border-slate-100 gap-4 hover:bg-slate-50 transition-all"><Printer className="h-4 w-4" /> Print Receipt</Button>
                     <Button variant="outline" className="h-14 px-8 rounded-[1.25rem] font-black uppercase text-[10px] tracking-[0.2em] border-slate-100 gap-4 hover:bg-slate-50 transition-all"><FileDown className="h-4 w-4" /> Export Order</Button>
                     <Button className="h-14 px-10 rounded-[1.25rem] bg-slate-950 text-white font-black uppercase text-[10px] tracking-[0.3em] gap-4 shadow-2xl transition-all hover:scale-105 active:scale-95 border-b-4 border-indigo-600"><Edit className="h-4 w-4" /> Edit Order</Button>
                  </div>
               </div>

               {/* ERP Intelligence Grid */}
               <div className="flex-1 flex gap-6 overflow-hidden pt-4 pb-0 bg-slate-50 relative z-30">
                  
                  {/* COLUMN 1: Registry Stream (20%) */}
                  <div className="w-[20%] bg-white border-r border-slate-100 flex flex-col overflow-hidden rounded-bl-[3.5rem] shadow-sm">
                     <div className="p-8 bg-slate-50/50 border-b border-slate-100 relative shrink-0">
                        <div className="relative">
                           <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                           <Input placeholder="Search orders..." className="h-12 pl-12 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white border-slate-100 shadow-inner" />
                        </div>
                     </div>
                     <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
                        {Object.entries(groupedSales).map(([date, list]) => (
                            <div key={date}>
                                <div className="px-8 py-5 bg-white/90 text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 sticky top-0 z-10 backdrop-blur-xl border-b border-slate-50/50 italic leading-none">{date}</div>
                                {list.map(s => (
                                    <div 
                                        key={s.id} 
                                        onClick={() => handleSelectOrder(s)}
                                        className={cn(
                                            "p-8 border-b border-slate-50/50 cursor-pointer transition-all flex flex-col gap-2 relative group",
                                            selectedSale.id === s.id ? "bg-indigo-600 text-white shadow-[0_20px_40px_-15px_rgba(79,70,229,0.7)] z-20" : "hover:bg-slate-50"
                                        )}
                                    >
                                        <div className="font-black text-base tracking-tighter italic leading-none">{s.invoiceNumber}</div>
                                        <div className={cn("text-[10px] font-black uppercase tracking-[0.1em] truncate", selectedSale.id === s.id ? "text-indigo-200" : "text-slate-400")}>{s.customerName}</div>
                                        <div className={cn("text-lg font-[1000] italic mt-2 leading-none", selectedSale.id === s.id ? "text-white" : "text-indigo-600")}>NLe {s.totalAmount.toLocaleString()}</div>
                                        {selectedSale.id === s.id && <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-30"><ChevronRight size={24} /></div>}
                                    </div>
                                ))}
                            </div>
                        ))}
                     </div>
                  </div>

                  {/* COLUMN 2: High-Fidelity Professional Receipt (52%) */}
                  <div className="flex-1 bg-white p-14 overflow-y-auto custom-scrollbar flex flex-col shadow-inner items-center print:p-0">
                     <div id="printable-receipt" className="w-full max-w-2xl bg-white border border-slate-100 p-20 rounded-[3rem] shadow-[0_30px_70px_-20px_rgba(0,0,0,0.15)] relative overflow-hidden print:border-none print:shadow-none print:max-w-full print:p-10">
                        {/* Elegant Decorative Elements */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600 print:hidden" />
                        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50/40 rounded-full -translate-y-1/2 translate-x-1/2 -z-10 blur-3xl print:hidden" />
                        
                        {/* Document Branding */}
                        <div className="text-center space-y-6 mb-20">
                           <div className="inline-flex flex-col items-center gap-6 mb-6">
                              <div className="h-20 w-20 rounded-[1.5rem] bg-slate-950 flex items-center justify-center text-white shadow-2xl ring-8 ring-slate-50"><ShoppingCart className="h-10 w-10" /></div>
                              <div className="space-y-2">
                                 <h3 className="text-5xl font-[1000] uppercase tracking-tighter italic text-slate-950 leading-none">{(business?.name || "ECOSYSTEM").split(' ')[0]} <span className="text-indigo-600 text-4xl font-black">{(business?.name || "SYSTEM").split(' ').slice(1).join(' ')}</span></h3>
                                 <div className="flex flex-col items-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] italic gap-1">
                                    <p>{business?.address || "Global Infrastructure Node"}</p>
                                    <p>TEL: {business?.phone || "SYS-DIRECT-DIAL"} • EMAIL: {business?.email || "ECOSYSTEM-INTELLIGENCE"}</p>
                                 </div>
                              </div>
                           </div>
                           <div className="flex justify-center items-center gap-8 text-[12px] font-black uppercase tracking-[0.4em] text-slate-400">
                              <span className="flex items-center gap-3 italic"><div className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> INV: {selectedSale.invoiceNumber}</span>
                              <span className="flex items-center gap-3 italic"><div className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> DATE: {format(new Date(selectedSale.createdAt), "MMMM do, yyyy")}</span>
                           </div>
                           <div className="inline-flex px-6 py-2 bg-emerald-100 text-emerald-900 text-[11px] font-black uppercase tracking-[0.3em] rounded-xl shadow-sm border border-emerald-200 italic">{selectedSale.paymentStatus} TRANSACTION</div>
                        </div>

                        {/* High-Contrast Line Items */}
                        <div className="space-y-4 border-t-4 border-slate-950 pt-12">
                           <div className="grid grid-cols-12 text-[12px] font-black uppercase text-slate-300 tracking-[0.3em] pb-8 border-b border-slate-100 italic">
                              <div className="col-span-7">Product Description</div>
                              <div className="col-span-2 text-center">Unit Price</div>
                              <div className="col-span-3 text-right">Total Amount</div>
                           </div>
                           
                           {selectedSale.items.map((item: any, i: number) => (
                              <div key={i} className="grid grid-cols-12 items-center py-10 border-b border-slate-50 group hover:bg-slate-50/50 px-4 rounded-2xl -mx-4 transition-colors">
                                 <div className="col-span-7 space-y-2">
                                    <div className="font-black text-slate-950 uppercase text-base tracking-tight leading-none group-hover:text-indigo-600 transition-colors">{item.name}</div>
                                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">
                                       <span>QUANTITY: {item.quantity}</span>
                                       <div className="h-1 w-1 rounded-full bg-slate-200" />
                                       <span>REF ID: {item.id.substring(0, 8)}</span>
                                    </div>
                                 </div>
                                 <div className="col-span-2 text-center font-black text-slate-600 text-sm italic tracking-tighter">NLe {item.unitPrice.toLocaleString()}</div>
                                 <div className="col-span-3 text-right font-[1000] text-slate-950 text-lg tracking-tighter italic leading-none">NLe {item.total.toLocaleString()}</div>
                              </div>
                           ))}
                        </div>

                        {/* Financial Settlement Breakdown */}
                        <div className="space-y-8 pt-12 mt-8 border-t-4 border-slate-950 bg-slate-50/30 p-10 rounded-[2.5rem]">
                           <div className="flex justify-between items-center text-[12px] font-black uppercase tracking-[0.4em] text-slate-400">
                              <span>Sub-Total</span>
                              <span className="text-slate-950 font-[1000]">NLe {(selectedSale.totalAmount / 1.15).toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between items-center text-[12px] font-black uppercase tracking-[0.4em] text-slate-400">
                              <span>Tax Assessment (15%)</span>
                              <span className="text-slate-950 font-[1000]">NLe {(selectedSale.totalAmount - (selectedSale.totalAmount / 1.15)).toLocaleString()}</span>
                           </div>
                           <div className="h-[2px] bg-slate-950 w-full" />
                           <div className="flex justify-between items-end pt-8">
                              <div className="space-y-3">
                                 <span className="text-[12px] font-black uppercase tracking-[0.5em] text-indigo-600 leading-none block">Total Payable</span>
                                 <div className="flex items-center gap-3">
                                    <Badge className="bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest px-6 h-8 border-none shadow-xl italic">Verified</Badge>
                                 </div>
                              </div>
                              <span className="text-7xl font-[1000] tracking-tighter italic text-slate-950 leading-none">NLe {selectedSale.totalAmount.toLocaleString()}</span>
                           </div>
                        </div>

                        <div className="pt-32 text-center">
                           <div className="inline-flex flex-col items-center gap-4">
                              <div className="h-px w-32 bg-slate-200" />
                              <p className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-200 animate-pulse">Official Business Record</p>
                              <div className="text-[8px] font-bold text-slate-100 uppercase tracking-widest">Auth Code: {selectedSale.id.toUpperCase()}</div>
                           </div>
                        </div>
                     </div>
                     
                     <div className="mt-14 flex gap-6 print:hidden">
                        <Button 
                           onClick={() => window.print()} 
                           className="h-20 px-16 rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[12px] tracking-[0.3em] shadow-[0_30px_60px_-15px_rgba(79,70,229,0.5)] flex gap-6 transition-all hover:scale-105 active:scale-95 ring-8 ring-indigo-50"
                        >
                           <Printer className="h-6 w-6" /> Print Official Receipt
                        </Button>
                     </div>
                  </div>

                  {/* COLUMN 3: Management Architecture (28%) */}
                  <div className="w-[28%] bg-white border-l border-slate-100 flex flex-col overflow-hidden rounded-br-[3.5rem] shadow-sm">
                     <Tabs value={managementTab} onValueChange={setManagementTab} className="flex-1 flex flex-col overflow-hidden">
                        <TabsList className="bg-slate-50 p-0 rounded-none border-b border-slate-100 shrink-0 grid grid-cols-4 gap-0 h-16">
                           <TabsTrigger value="intelligence" className="rounded-none border-r border-slate-100 last:border-r-0 text-[11px] font-black uppercase tracking-[0.15em] data-[state=active]:bg-white data-[state=active]:text-indigo-600 transition-all italic">Intel</TabsTrigger>
                           <TabsTrigger value="activities" className="rounded-none border-r border-slate-100 last:border-r-0 text-[11px] font-black uppercase tracking-[0.15em] data-[state=active]:bg-white data-[state=active]:text-indigo-600 transition-all italic">Logs</TabsTrigger>
                           <TabsTrigger value="items" className="rounded-none border-r border-slate-100 last:border-r-0 text-[11px] font-black uppercase tracking-[0.15em] data-[state=active]:bg-white data-[state=active]:text-indigo-600 transition-all italic">Assets</TabsTrigger>
                           <TabsTrigger value="payments" className="rounded-none border-r border-slate-100 last:border-r-0 text-[11px] font-black uppercase tracking-[0.15em] data-[state=active]:bg-white data-[state=active]:text-indigo-600 transition-all italic">Ledger</TabsTrigger>
                        </TabsList>

                        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar focus-visible:ring-0">
                           
                           {/* --- INTELLIGENCE HUB OVERLAY --- */}
                           <TabsContent value="intelligence" className="mt-0 space-y-12 animate-in fade-in duration-500">
                              <div className="space-y-8">
                                 <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-500/30 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-1000">
                                       <ShieldCheck size={80} />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-200 mb-6">Neural Reliability Index</p>
                                    <div className="flex items-end gap-3 mb-8">
                                       <div className="text-6xl font-[1000] italic tracking-tighter leading-none">98.4<span className="text-xl not-italic ml-1">%</span></div>
                                       <Badge className="bg-white/20 text-white font-black text-[9px] uppercase tracking-widest px-3 h-6 border-none italic">Optima</Badge>
                                    </div>
                                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                       <div className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]" style={{ width: '98.4%' }} />
                                    </div>
                                 </div>

                                 <div className="grid grid-cols-1 gap-4">
                                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group hover:bg-white transition-all">
                                       <div className="flex items-center gap-4">
                                          <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600"><Activity size={18} /></div>
                                          <div>
                                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Entity Velocity</p>
                                             <p className="text-sm font-black text-slate-900 italic">High-Frequency</p>
                                          </div>
                                       </div>
                                       <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    </div>
                                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group hover:bg-white transition-all">
                                       <div className="flex items-center gap-4">
                                          <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600"><AlertCircle size={18} /></div>
                                          <div>
                                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Exposure Node</p>
                                             <p className="text-sm font-black text-slate-900 italic">NLe 0.00 Outstanding</p>
                                          </div>
                                       </div>
                                       <ShieldCheck size={16} className="text-emerald-500" />
                                    </div>
                                 </div>

                                 <div className="space-y-4 pt-4">
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] italic underline underline-offset-8 decoration-slate-100 mb-8">Registry Profile</p>
                                    <div className="flex items-center gap-6 p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm">
                                       <div className="h-14 w-14 rounded-full bg-slate-50 border-2 border-slate-100 flex items-center justify-center text-slate-200 font-black text-xl italic">{selectedSale.customerName.charAt(0)}</div>
                                       <div>
                                          <h4 className="text-lg font-black text-slate-950 tracking-tighter italic leading-none mb-1">{selectedSale.customerName}</h4>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Commercial Node ID: {selectedSale.customerId || 'EXTERNAL'}</p>
                                       </div>
                                    </div>
                                 </div>

                                 <Button 
                                    onClick={() => window.location.href = '/dashboard/registry'}
                                    className="w-full h-16 rounded-2xl bg-slate-950 text-white font-black uppercase text-[10px] tracking-[0.3em] gap-4 shadow-2xl transition-all hover:scale-[1.02] group"
                                 >
                                    Launch Full Intelligence Profile <ArrowUpRight className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                 </Button>
                              </div>
                           </TabsContent>

                           {/* --- LOGS / ACTIVITIES --- */}
                           <TabsContent value="activities" className="mt-0 space-y-16">
                              <div className="space-y-12">
                                 <div className="p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] space-y-6">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Update Order State</p>
                                    <div className="space-y-4">
                                       <Select value={newStatus} onValueChange={(val: string | null) => setNewStatus(val || "PENDING")}>
                                          <SelectTrigger className="h-14 rounded-xl border-slate-200 bg-white font-black uppercase text-[10px] tracking-widest shadow-sm">
                                             <SelectValue placeholder="Select New Status" />
                                          </SelectTrigger>
                                          <SelectContent className="rounded-xl border-slate-100 shadow-2xl p-2">
                                             {statuses.map((s) => (
                                                <SelectItem key={s.name} value={s.name} className="h-11 rounded-lg font-bold text-xs uppercase tracking-widest">{s.name}</SelectItem>
                                             ))}
                                          </SelectContent>
                                       </Select>
                                       <Button 
                                          onClick={handleUpdateStatus}
                                          disabled={isUpdatingStatus || newStatus.toUpperCase() === selectedSale.status.toUpperCase()}
                                          className="w-full h-14 rounded-xl bg-indigo-600 text-white font-black uppercase text-[10px] tracking-[0.3em] shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
                                       >
                                          {isUpdatingStatus ? "Syncing State..." : "Confirm State Change"}
                                       </Button>
                                    </div>
                                 </div>

                                 {statusHistory.length === 0 ? (
                                    <div className="py-24 text-center opacity-20 italic font-black uppercase text-[11px] tracking-[0.5em]">No Activity Logs</div>
                                 ) : statusHistory.map((h, i) => (
                                    <div key={i} className="space-y-2 relative pl-10 group">
                                       <div className="absolute left-0 top-1.5 h-4 w-4 rounded-full bg-indigo-600 ring-[12px] ring-indigo-50 shadow-sm group-hover:scale-125 transition-all duration-500" />
                                       <p className="text-[11px] font-black uppercase text-slate-300 tracking-[0.4em] italic">Status Change</p>
                                       <p className="text-base font-black uppercase text-slate-950 leading-tight italic">{h.status}</p>
                                       <p className="text-xs font-bold text-slate-500 pt-1 leading-relaxed">{h.note}</p>
                                       <div className="pt-6 flex flex-col gap-1.5 border-l-2 border-slate-50 pl-4">
                                          <p className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em]">Updated By: <span className="text-slate-900">{h.userName}</span></p>
                                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] italic">{format(new Date(h.createdAt), "MMMM d, h:mm:ss a")}</p>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           </TabsContent>

                           {/* --- ASSETS / ITEMS --- */}
                           <TabsContent value="items" className="mt-0 space-y-10">
                              <div className="bg-rose-50 border-2 border-rose-100 p-8 rounded-[2rem] flex items-start gap-6 shadow-sm ring-8 ring-rose-50/50">
                                 <Info className="h-6 w-6 text-rose-500 mt-0.5 shrink-0" />
                                 <div className="space-y-1.5">
                                    <p className="text-[11px] font-black uppercase text-rose-900 tracking-[0.4em]">Order Locked</p>
                                    <p className="text-xs font-bold text-rose-700 leading-relaxed italic">Items cannot be edited once the order is completed.</p>
                                 </div>
                              </div>
                              <div className="space-y-6">
                                 <p className="text-[11px] font-[1000] uppercase tracking-[0.5em] text-slate-200 mb-8 ml-2 italic underline underline-offset-[12px] decoration-slate-100">Order Items</p>
                                 {selectedSale.items.map((item: any, i: number) => (
                                    <div key={i} className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] hover:bg-white hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] transition-all duration-700 cursor-default group relative overflow-hidden">
                                       <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Box size={60} /></div>
                                       <div className="font-black text-slate-950 uppercase text-sm tracking-tight mb-4 group-hover:text-indigo-600 transition-colors leading-none italic">{item.name}</div>
                                       <div className="flex justify-between items-end border-t border-slate-100/50 pt-5">
                                          <div className="text-[11px] font-[1000] text-slate-300 uppercase tracking-[0.3em]">Quantity: <span className="text-indigo-600 ml-1 italic">{item.quantity}</span></div>
                                          <div className="text-xl font-[1000] text-slate-950 tracking-tighter italic leading-none">NLe {item.total.toLocaleString()}</div>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           </TabsContent>

                           {/* --- LEDGER / PAYMENTS --- */}
                           <TabsContent value="payments" className="mt-0 space-y-10">
                              <div className="bg-emerald-50 border-2 border-emerald-100 p-8 rounded-[2rem] flex items-start gap-6 shadow-sm ring-8 ring-emerald-50/50">
                                 <ShieldCheck className="h-6 w-6 text-emerald-600 mt-0.5 shrink-0" />
                                 <div className="space-y-1.5">
                                    <p className="text-[11px] font-black uppercase text-emerald-900 tracking-[0.4em]">Payment Secured</p>
                                    <p className="text-xs font-bold text-emerald-700 leading-relaxed italic">Payment details are verified and finalized in the ledger.</p>
                                 </div>
                              </div>
                              <div className="p-10 bg-slate-950 rounded-[3rem] text-white shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] relative overflow-hidden group">
                                 <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-125 transition-transform duration-1000" />
                                 <div className="relative z-10">
                                    <p className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-500 mb-6 italic leading-none">Total Paid</p>
                                    <div className="text-6xl font-[1000] italic tracking-tighter mb-12 leading-none">NLe {selectedSale.totalAmount.toLocaleString()}</div>
                                    <div className="pt-10 border-t border-white/10 flex items-center justify-between">
                                       <div className="space-y-2">
                                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] leading-none">Method</p>
                                          <div className="text-sm font-black uppercase tracking-widest flex items-center gap-3 italic">
                                             {selectedSale.paymentMethod === 'CASH' ? <Wallet className="h-4 w-4 text-blue-400" /> : <Smartphone className="h-4 w-4 text-emerald-400" />}
                                             {selectedSale.paymentMethod}
                                          </div>
                                       </div>
                                       <Badge className="bg-indigo-600 text-white font-black text-[10px] tracking-[0.3em] px-6 h-8 border-none italic shadow-xl">VERIFIED</Badge>
                                    </div>
                                 </div>
                              </div>
                           </TabsContent>

                           {/* --- NODE / CUSTOMER --- */}
                           <TabsContent value="customer" className="mt-0 space-y-14">
                              <div className="flex flex-col items-center text-center py-12 px-8 bg-white border border-slate-100 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
                                 <div className="absolute inset-0 bg-slate-50/50 -z-10" />
                                 <div className="h-28 w-28 rounded-full bg-white border-4 border-slate-50 flex items-center justify-center mb-8 shadow-2xl group-hover:scale-110 transition-all duration-700 ring-8 ring-indigo-50/50"><User className="h-14 w-14 text-slate-200" /></div>
                                 <h4 className="text-2xl font-[1000] uppercase tracking-tighter italic leading-none mb-4 text-slate-950">{selectedSale.customerName}</h4>
                                 <div className="flex flex-col items-center gap-4">
                                    <Badge variant="outline" className="rounded-full font-[1000] text-[10px] uppercase tracking-[0.4em] border-slate-200 px-8 h-8 italic bg-white shadow-sm text-indigo-600">ID: {selectedSale.customerId || 'WALK-IN'}</Badge>
                                    <p className="text-[10px] font-[1000] text-slate-300 uppercase tracking-[0.3em] italic">Active Business Partner</p>
                                 </div>
                              </div>

                              <div className="space-y-4">
                                 <div className="grid grid-cols-1 gap-4">
                                    <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] shadow-inner group hover:bg-white hover:border-indigo-100 transition-all duration-500 flex flex-col gap-2">
                                       <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-300 italic">Phone Number</p>
                                       <p className="text-sm font-black uppercase text-slate-950 italic">Not Provided</p>
                                    </div>
                                    <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] shadow-inner group hover:bg-white hover:border-indigo-100 transition-all duration-500 flex flex-col gap-2">
                                       <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-300 italic">Email Address</p>
                                       <p className="text-sm font-black uppercase text-slate-950 truncate italic">Not Provided</p>
                                    </div>
                                 </div>
                                 <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] shadow-inner group hover:bg-white hover:border-indigo-100 transition-all duration-500 flex flex-col gap-2">
                                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-300 italic">Business Address</p>
                                    <p className="text-xs font-black uppercase text-slate-950 leading-relaxed italic">Address details not found in registry.</p>
                                 </div>
                              </div>

                              <div className="grid grid-cols-1 gap-4 pt-10 border-t border-slate-100">
                                 <Button variant="outline" className="h-16 rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.3em] border-slate-200 gap-5 transition-all hover:bg-slate-950 hover:text-white hover:border-slate-950 active:scale-95 shadow-md italic leading-none"><User className="h-5 w-5" /> View Partner Profile</Button>
                                 <Button variant="outline" className="h-16 rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.3em] border-slate-200 gap-5 transition-all hover:bg-indigo-600 hover:text-white hover:border-indigo-600 active:scale-95 shadow-md italic leading-none"><History className="h-5 w-5" /> View Order History</Button>
                              </div>
                           </TabsContent>
                        </div>
                     </Tabs>
                  </div>
               </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
