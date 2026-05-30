"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  CreditCard, 
  Search, 
  Filter, 
  Plus, 
  DollarSign, 
  Calendar, 
  User,
  History,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Wallet,
  Clock,
  ShieldCheck
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getPayrolls, processPayroll, markAsPaid } from "@/lib/actions/payroll";
import { getUsers } from "@/lib/actions/user";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { cn, getIndustryColor } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function PayrollPage() {
  const { data: session } = useSession();
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [formData, setFormData] = useState({
    userId: "",
    amount: "",
    periodStart: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    periodEnd: format(endOfMonth(new Date()), "yyyy-MM-dd")
  });

  const businessType = session?.user?.businessType || "SHOP";
  const colors = getIndustryColor(businessType);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [payrollData, usersData] = await Promise.all([
        getPayrolls(),
        getUsers()
      ]);
      setPayrolls(payrollData);
      setUsers(usersData);
      if (usersData.length > 0) setFormData(prev => ({ ...prev, userId: usersData[0].id }));
    } catch (error) {
      toast.error("Failed to sync payroll ledger.");
    } finally {
      setLoading(false);
    }
  }

  async function handleProcess(e: React.FormEvent) {
    e.preventDefault();
    try {
      await processPayroll(
        formData.userId, 
        parseFloat(formData.amount), 
        new Date(formData.periodStart), 
        new Date(formData.periodEnd)
      );
      toast.success("Payroll entry initialized.");
      setIsAddOpen(false);
      setFormData({ ...formData, amount: "" });
      fetchData();
    } catch (error: any) {
      toast.error("Failed to initialize payroll node.");
    }
  }

  async function handlePay(id: string) {
    try {
      await markAsPaid(id, "CASH");
      toast.success("Payment cycle finalized.");
      fetchData();
    } catch (error) {
      toast.error("Failed to finalize payment.");
    }
  }

  const filteredPayrolls = payrolls.filter(p => 
    p.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 p-6 md:p-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <div className={cn("p-1.5 rounded-lg text-white shadow-lg", colors.primary)}>
                 <DollarSign className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Financial Compensation Intelligence</span>
           </div>
           <h1 className="text-4xl font-[1000] text-slate-900 dark:text-white tracking-tight">Payroll Ledger</h1>
           <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Audit staff earnings, manage disbursement nodes, and track cycle payouts.</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
           <DialogTrigger render={
              <Button className={cn("h-12 px-8 rounded-xl text-white font-black uppercase text-[10px] tracking-widest shadow-xl", colors.primary)}>
                 <Plus className="h-4 w-4 mr-2" /> Initialize Payout Node
              </Button>
           } />
           <DialogContent className="rounded-3xl border-none shadow-2xl p-0 overflow-hidden bg-white max-w-md">
              <div className="bg-slate-900 p-8 text-white">
                 <h3 className="text-2xl font-[1000] tracking-tighter uppercase italic">Record Compensation</h3>
                 <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Disbursement Initialization</p>
              </div>
              <form onSubmit={handleProcess} className="p-8 space-y-5">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Personnel</Label>
                    <Select value={formData.userId} onValueChange={v => setFormData({...formData, userId: v})}>
                       <SelectTrigger className="h-12 rounded-xl">
                          <SelectValue />
                       </SelectTrigger>
                       <SelectContent className="rounded-xl">
                          {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                       </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Settlement Amount (Le)</Label>
                    <Input required type="number" step="0.01" className="h-12 rounded-xl" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Period Start</Label>
                       <Input type="date" className="h-12 rounded-xl" value={formData.periodStart} onChange={e => setFormData({...formData, periodStart: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Period End</Label>
                       <Input type="date" className="h-12 rounded-xl" value={formData.periodEnd} onChange={e => setFormData({...formData, periodEnd: e.target.value})} />
                    </div>
                 </div>
                 <Button type="submit" className={cn("w-full h-14 rounded-2xl text-white font-black uppercase tracking-widest shadow-xl mt-4", colors.primary)}>
                    Finalize Node
                 </Button>
              </form>
           </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="border-none bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
               <TrendingUp size={100} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Total Cycle Liability</p>
            <h2 className="text-4xl font-[1000] tracking-tighter">Le {payrolls.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</h2>
            <div className="mt-4 flex items-center gap-2 text-indigo-400 font-bold text-[10px] uppercase tracking-widest">
               <AlertCircle size={14} /> Pending Dispersal
            </div>
         </Card>

         <Card className="border-none bg-emerald-600 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
               <CheckCircle2 size={100} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200 mb-2">Finalized Payouts</p>
            <h2 className="text-4xl font-[1000] tracking-tighter">Le {payrolls.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</h2>
            <div className="mt-4 flex items-center gap-2 text-emerald-100 font-bold text-[10px] uppercase tracking-widest">
               <Wallet size={14} /> Verified Flows
            </div>
         </Card>

         <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Average Node Yield</p>
            <h2 className="text-4xl font-[1000] text-slate-900 dark:text-white tracking-tighter">
               Le {payrolls.length > 0 ? (payrolls.reduce((sum, p) => sum + p.amount, 0) / payrolls.length).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "0"}
            </h2>
            <div className="mt-4 flex items-center gap-2">
               <div className="h-1 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 w-[70%]" />
               </div>
               <span className="text-[9px] font-black text-slate-400 uppercase">Stability</span>
            </div>
         </Card>
      </div>

      <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-sm overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-100/50 dark:border-slate-800/50 flex flex-col md:flex-row justify-between gap-4">
           <div className="relative flex-1 max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search personnel or status..." 
                className="h-12 pl-12 rounded-2xl border-slate-200 bg-slate-50/50"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
           </div>
           <Button variant="outline" className="h-12 w-12 rounded-2xl border-slate-200 flex items-center justify-center">
              <Filter className="h-4 w-4 text-slate-400" />
           </Button>
        </CardHeader>
        <CardContent className="p-0">
           <Table>
             <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
               <TableRow className="hover:bg-transparent border-none">
                 <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400 px-8">Staff Node</TableHead>
                 <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400">Payout Value</TableHead>
                 <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400">Pay Cycle</TableHead>
                 <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400">Status</TableHead>
                 <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400 text-right pr-8">Actions</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {loading ? (
                 Array.from({ length: 5 }).map((_, i) => <TableRow key={i} className="h-20 border-b border-slate-50 animate-pulse"><TableCell colSpan={5} /></TableRow>)
               ) : filteredPayrolls.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={5} className="h-64 text-center">
                      <History className="h-8 w-8 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest italic">No compensation logs registered</p>
                   </TableCell>
                 </TableRow>
               ) : (
                 filteredPayrolls.map((p) => (
                   <TableRow key={p.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all border-b border-slate-50 dark:border-slate-800/50 h-20">
                     <TableCell className="px-8">
                        <div className="font-black text-slate-900 dark:text-white tracking-tight leading-none">{p.userName}</div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{p.userEmail}</div>
                     </TableCell>
                     <TableCell>
                        <div className="text-lg font-[1000] text-slate-900 dark:text-white tracking-tighter">Le {p.amount.toLocaleString()}</div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Base Compensation</div>
                     </TableCell>
                     <TableCell>
                        <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                           {format(new Date(p.periodStart), "MMM dd")} - {format(new Date(p.periodEnd), "MMM dd")}
                        </div>
                     </TableCell>
                     <TableCell>
                        <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm", 
                           p.status === 'PAID' ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600")}>
                           {p.status === 'PAID' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                           {p.status}
                        </div>
                     </TableCell>
                     <TableCell className="text-right pr-8">
                        {p.status === 'PENDING' ? (
                          <Button onClick={() => handlePay(p.id)} className={cn("h-9 px-4 rounded-lg text-white font-black text-[9px] uppercase tracking-widest shadow-md", colors.primary)}>Finalize payout</Button>
                        ) : (
                          <div className="text-[9px] font-bold text-slate-400 uppercase italic tracking-widest flex items-center justify-end gap-2">
                             <ShieldCheck size={12} className="text-emerald-500" /> Settled {format(new Date(p.paymentDate), "MMM dd")}
                          </div>
                        )}
                     </TableCell>
                   </TableRow>
                 ))
               )}
             </TableBody>
           </Table>
        </CardContent>
      </Card>
    </div>
  );
}
