"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  CreditCard, 
  Search, 
  Filter, 
  ArrowUpRight, 
  Clock, 
  User, 
  Wallet,
  Calendar,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Receipt
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
import { getDebts, createDebtPayment } from "@/lib/actions/debt";
import { format } from "date-fns";
import { cn, getIndustryColor } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export default function CreditSalesPage() {
  const { data: session } = useSession();
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const businessType = session?.user?.businessType || "SHOP";
  const colors = getIndustryColor(businessType);

  useEffect(() => {
    fetchDebts();
  }, []);

  async function fetchDebts() {
    try {
      setLoading(true);
      const data = await getDebts();
      setDebts(data);
    } catch (error) {
      toast.error("Failed to sync debt ledger.");
    } finally {
      setLoading(false);
    }
  }

  const filteredDebts = debts.filter(d => 
    d.customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.sale?.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 p-6 md:p-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <div className={cn("p-1.5 rounded-lg text-white shadow-lg", colors.primary)}>
                 <CreditCard className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Financial Intelligence</span>
           </div>
           <h1 className="text-4xl font-[1000] text-slate-900 dark:text-white tracking-tight">Credit Sales</h1>
           <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Manage receivables and track outstanding balances for reliable commerce nodes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="border-none bg-slate-900 p-6 rounded-[2rem] text-white shadow-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Total Receivables</p>
            <h2 className="text-3xl font-[1000] tracking-tighter">Le {Math.round(debts.filter(d => d.status !== 'PAID').reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0)).toLocaleString()}</h2>
            <div className="mt-4 flex items-center gap-2">
               <div className="h-1 flex-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-2/3" />
               </div>
               <span className="text-[9px] font-black text-slate-500 uppercase">Risk Level: Low</span>
            </div>
         </Card>
         
         <Card className="border-slate-200 dark:border-slate-800 bg-white p-6 rounded-[2rem] shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Pending Nodes</p>
            <h2 className="text-3xl font-[1000] text-slate-900 tracking-tighter">{debts.filter(d => d.status !== 'PAID').length.toString().padStart(2, '0')}</h2>
            <div className="mt-4 flex items-center gap-2">
               <AlertCircle size={14} className="text-amber-500" />
               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Requiring Follow-up</span>
            </div>
         </Card>

         <Card className="border-slate-200 dark:border-slate-800 bg-white p-6 rounded-[2rem] shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Collections Rate</p>
            <h2 className="text-3xl font-[1000] text-slate-900 tracking-tighter">94.2%</h2>
            <div className="mt-4 flex items-center gap-2">
               <CheckCircle2 size={14} className="text-emerald-500" />
               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Optimal Flow</span>
            </div>
         </Card>
      </div>

      <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-sm overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-100/50 dark:border-slate-800/50">
           <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="relative flex-1 max-w-md group">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                 <Input 
                   placeholder="Search customer or invoice..." 
                   className="h-12 pl-12 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                 />
              </div>
              <Button variant="outline" className="h-12 w-12 rounded-2xl border-slate-200 flex items-center justify-center">
                 <Filter className="h-4 w-4 text-slate-400" />
              </Button>
           </div>
        </CardHeader>
        <CardContent className="p-0">
           <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400 px-8">Debtor Identity</TableHead>
                    <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400">Total Liability</TableHead>
                    <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400">Current Balance</TableHead>
                    <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400">Cycle Status</TableHead>
                    <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400 text-right pr-8">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} className="border-b border-slate-50 dark:border-slate-800 h-20">
                        <TableCell colSpan={5} className="text-center animate-pulse">
                           <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/3 mx-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredDebts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-64 text-center">
                         <div className="space-y-4">
                            <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto">
                               <Receipt className="h-8 w-8 text-slate-200" />
                            </div>
                            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Clear Ledger Detected</p>
                         </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDebts.map((debt) => (
                      <TableRow key={debt.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all border-b border-slate-50 dark:border-slate-800/50">
                        <TableCell className="px-8 h-20">
                          <div className="font-black text-slate-900 dark:text-white tracking-tight">{debt.customer?.name}</div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                             <Receipt size={10} className="text-primary" /> {debt.sale?.invoiceNumber}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-black text-slate-600 dark:text-slate-400">Le {Math.round(debt.totalAmount).toLocaleString()}</div>
                          <div className="text-[9px] font-medium text-slate-400 uppercase">Initialized {format(new Date(debt.createdAt), "MMM dd")}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-lg font-[1000] text-rose-600 tracking-tighter">Le {Math.round(debt.totalAmount - debt.paidAmount).toLocaleString()}</div>
                          <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Le {Math.round(debt.paidAmount).toLocaleString()} Paid</div>
                        </TableCell>
                        <TableCell>
                           <div className={cn("inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm", 
                            debt.status === 'PAID' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400")}>
                            {debt.status}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                           <Button variant="ghost" size="sm" className="h-10 px-4 rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-500 hover:bg-white hover:text-primary transition-all">
                              Settle Node <ChevronRight className="ml-2 h-3.5 w-3.5" />
                           </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
