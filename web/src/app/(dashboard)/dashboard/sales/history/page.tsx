"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
  FileDown, 
  Printer, 
  Clock, 
  User, 
  CreditCard, 
  ChevronRight,
  Receipt,
  ShoppingCart,
  ArrowUpDown,
  Smartphone as SmartphoneIcon,
  Wallet,
  X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getSalesHistoryByRange } from "@/lib/actions/sale";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay, startOfYear, endOfYear } from "date-fns";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { cn, getIndustryColor } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export default function SalesHistoryPage() {
  const { data: session } = useSession();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [filterRange, setFilterRange] = useState("TODAY");

  const businessType = session?.user?.businessType || "SHOP";
  const colors = getIndustryColor(businessType);

  useEffect(() => {
    fetchSales();
  }, [filterRange]);

  async function fetchSales() {
    try {
      setLoading(true);
      const now = new Date();
      let start: Date, end: Date;

      switch (filterRange) {
        case "TODAY":
          start = startOfDay(now);
          end = endOfDay(now);
          break;
        case "THIS_WEEK":
          start = startOfWeek(now);
          end = endOfWeek(now);
          break;
        case "LAST_TWO_WEEKS":
          start = subDays(now, 14);
          end = now;
          break;
        case "LAST_MONTH":
          start = startOfMonth(subMonths(now, 1));
          end = endOfMonth(subMonths(now, 1));
          break;
        case "LAST_THREE_MONTHS":
          start = startOfMonth(subMonths(now, 3));
          end = endOfMonth(now);
          break;
        case "LAST_SIX_MONTHS":
          start = startOfMonth(subMonths(now, 6));
          end = endOfMonth(now);
          break;
        case "THIS_YEAR":
          start = startOfYear(now);
          end = endOfYear(now);
          break;
        case "ALL_TIME":
          start = new Date(2000, 0, 1);
          end = now;
          break;
        default:
          start = subDays(now, 30);
          end = now;
      }

      const data = await getSalesHistoryByRange(start, end);
      setSales(data);
    } catch (error) {
      toast.error("Failed to sync ledger data.");
    } finally {
      setLoading(false);
    }
  }

  const filteredSales = sales.filter(s => 
    s.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const ranges = [
    { label: "Today", value: "TODAY" },
    { label: "This Week", value: "THIS_WEEK" },
    { label: "Last 2 Weeks", value: "LAST_TWO_WEEKS" },
    { label: "Last Month", value: "LAST_MONTH" },
    { label: "Last 3 Months", value: "LAST_THREE_MONTHS" },
    { label: "Last 6 Months", value: "LAST_SIX_MONTHS" },
    { label: "This Year", value: "THIS_YEAR" },
    { label: "All Sales", value: "ALL_TIME" },
  ];

  return (
    <div className="space-y-8 p-6 md:p-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <div className={cn("p-1.5 rounded-lg text-white shadow-lg", colors.primary)}>
                 <ShoppingCart className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Commerce Intelligence</span>
           </div>
           <h1 className="text-4xl font-[1000] text-slate-900 dark:text-white tracking-tight">Sales History</h1>
           <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Audit and track every finalized transaction across your network.</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
           <Button variant="outline" className="flex-1 md:flex-none h-12 rounded-xl border-slate-200 gap-2 font-bold uppercase text-[10px] tracking-widest">
              <FileDown className="h-4 w-4" /> Export CSV
           </Button>
           <Button className={cn("flex-1 md:flex-none h-12 rounded-xl text-white font-black uppercase text-[10px] tracking-widest shadow-xl", colors.primary)}>
              <Printer className="h-4 w-4 mr-2" /> Print Report
           </Button>
        </div>
      </div>

      <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-sm overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-100/50 dark:border-slate-800/50">
           <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="relative flex-1 max-w-md group">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                 <Input 
                   placeholder="Search invoice or customer..." 
                   className="h-12 pl-12 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                 />
              </div>
              <div className="flex gap-2">
                 <Select value={filterRange} onValueChange={(val: string | null) => setFilterRange(val || "TODAY")}>
                   <SelectTrigger className="h-12 rounded-2xl w-[180px] border-slate-200 bg-white font-bold text-[10px] uppercase tracking-widest text-slate-500">
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                     {ranges.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                   </SelectContent>
                 </Select>
              </div>
           </div>
        </CardHeader>
        <CardContent className="p-0">
           <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400 px-8">Invoice ID</TableHead>
                    <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400">Date/Time</TableHead>
                    <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400">Customer Node</TableHead>
                    <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400">Total Yield</TableHead>
                    <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400 text-right pr-8">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} className="border-b border-slate-50 dark:border-slate-800">
                        <TableCell colSpan={5} className="h-20 text-center">
                          <div className="flex items-center justify-center gap-2 text-slate-300 animate-pulse">
                            <div className="h-4 w-4 rounded-full bg-slate-100 dark:bg-slate-800" />
                            <div className="h-4 w-32 rounded bg-slate-100 dark:bg-slate-800" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredSales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-64 text-center">
                        <div className="space-y-4">
                           <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto">
                              <Receipt className="h-8 w-8 text-slate-200" />
                           </div>
                           <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No matching nodes detected</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSales.map((sale) => (
                      <TableRow 
                        key={sale.id} 
                        className="group cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all border-b border-slate-50 dark:border-slate-800/50"
                        onClick={() => {
                          setSelectedSale(sale);
                          setIsDetailsOpen(true);
                        }}
                      >
                        <TableCell className="px-8 h-20">
                          <div className="font-black text-slate-900 dark:text-white tracking-tight">{sale.invoiceNumber}</div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                             <User size={10} className="text-primary" /> {sale.userName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-bold text-slate-600 dark:text-slate-400">{format(new Date(sale.createdAt), "MMM dd, yyyy")}</div>
                          <div className="text-[10px] font-medium text-slate-400">{format(new Date(sale.createdAt), "HH:mm")}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter">{sale.customerName}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Retail Client</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-lg font-[1000] text-slate-900 dark:text-white tracking-tighter">Le {sale.totalAmount.toLocaleString()}</div>
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                             {sale.paymentMethod === 'CASH' ? <Wallet size={10} /> : <SmartphoneIcon size={10} />}
                             {sale.paymentMethod}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <div className={cn("inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm", 
                            sale.paymentStatus === 'PAID' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400")}>
                            {sale.paymentStatus}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
           </div>
        </CardContent>
      </Card>

      {/* DETAIL VIEW MODAL */}
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
                             <div className="text-xs font-black text-slate-900 uppercase tracking-tight mb-1">{item.name}</div>
                             <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                                {item.quantity} x Le {item.unitPrice.toLocaleString()}
                             </div>
                          </div>
                          <div className="text-sm font-[1000] text-slate-900 tracking-tighter">
                             Le {item.total.toLocaleString()}
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              <div className="pt-6 border-t border-slate-100 space-y-3">
                 <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span>Transaction Subtotal</span>
                    <span className="text-slate-900">Le {(selectedSale?.totalAmount / 1.15).toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span>Tax Applied (15%)</span>
                    <span className="text-slate-900">Le {(selectedSale?.totalAmount - (selectedSale?.totalAmount / 1.15)).toLocaleString()}</span>
                 </div>
                 <div className="h-px bg-slate-100 w-full my-2" />
                 <div className="flex justify-between items-end pt-2">
                    <div className="space-y-1">
                       <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Final Settlement</span>
                       <div className="text-4xl font-[1000] text-slate-900 tracking-tighter">Le {selectedSale?.totalAmount.toLocaleString()}</div>
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
