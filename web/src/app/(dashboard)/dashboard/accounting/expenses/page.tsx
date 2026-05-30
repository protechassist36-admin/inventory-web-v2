"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Wallet, 
  Search, 
  Filter, 
  Plus, 
  TrendingDown, 
  Calendar, 
  User,
  History,
  FileText,
  DollarSign,
  ArrowRight
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
import { getExpenses, createExpense } from "@/lib/actions/expense";
import { format } from "date-fns";
import { cn, getIndustryColor } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export default function ExpensesPage() {
  const { data: session } = useSession();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "General",
    paymentMethod: "CASH"
  });

  const businessType = session?.user?.businessType || "SHOP";
  const colors = getIndustryColor(businessType);

  useEffect(() => {
    fetchExpenses();
  }, []);

  async function fetchExpenses() {
    try {
      setLoading(true);
      const data = await getExpenses();
      setExpenses(data);
    } catch (error) {
      toast.error("Failed to load expense ledger.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createExpense({
        ...formData,
        amount: parseFloat(formData.amount)
      });
      toast.success("Expense recorded successfully.");
      setIsDialogOpen(false);
      setFormData({ description: "", amount: "", category: "General", paymentMethod: "CASH" });
      fetchExpenses();
    } catch (error) {
      toast.error("Failed to record expense.");
    }
  }

  const filteredExpenses = expenses.filter(e => 
    e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 p-6 md:p-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <div className={cn("p-1.5 rounded-lg text-white shadow-lg", colors.primary)}>
                 <TrendingDown className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Expense Intelligence</span>
           </div>
           <h1 className="text-4xl font-[1000] text-slate-900 dark:text-white tracking-tight">Business Costs</h1>
           <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Audit operational overhead and manage business expenditure nodes.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
           <DialogTrigger 
             render={
               <Button className={cn("h-12 px-8 rounded-xl text-white font-black uppercase text-[10px] tracking-widest shadow-xl", colors.primary)}>
                  <Plus className="h-4 w-4 mr-2" /> Log New Expense
               </Button>
             }
           />
           <DialogContent className="rounded-3xl border-none shadow-2xl p-0 overflow-hidden bg-white">
              <div className="bg-slate-900 p-8 text-white">
                 <h3 className="text-2xl font-[1000] tracking-tighter uppercase italic">Record Expenditure</h3>
                 <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Operational Cost Intelligence</p>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</Label>
                    <Input 
                      required 
                      placeholder="e.g. Monthly Rent, Electricity..." 
                      className="h-12 rounded-xl border-slate-200"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Amount (Le)</Label>
                       <Input 
                         required 
                         type="number" 
                         step="0.01" 
                         placeholder="0.00" 
                         className="h-12 rounded-xl border-slate-200"
                         value={formData.amount}
                         onChange={(e) => setFormData({...formData, amount: e.target.value})}
                       />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category</Label>
                       <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                          <SelectTrigger className="h-12 rounded-xl border-slate-200">
                             <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-slate-200">
                             <SelectItem value="Rent">Rent</SelectItem>
                             <SelectItem value="Utilities">Utilities</SelectItem>
                             <SelectItem value="Salaries">Salaries</SelectItem>
                             <SelectItem value="Inventory">Inventory</SelectItem>
                             <SelectItem value="General">General</SelectItem>
                          </SelectContent>
                       </Select>
                    </div>
                 </div>
                 <Button type="submit" className={cn("w-full h-14 rounded-2xl text-white font-black uppercase tracking-widest shadow-xl", colors.primary)}>
                    Finalize Entry
                 </Button>
              </form>
           </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="border-none bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
               <DollarSign size={80} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200 mb-2">Total Monthly Spend</p>
            <h2 className="text-4xl font-[1000] tracking-tighter">Le {expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</h2>
         </Card>
         <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Highest Category</p>
            <h2 className="text-2xl font-[1000] text-slate-900 dark:text-white uppercase tracking-tighter">Utilities</h2>
         </Card>
         <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Burn Rate</p>
            <h2 className="text-2xl font-[1000] text-slate-900 dark:text-white uppercase tracking-tighter">Low Intensity</h2>
         </Card>
      </div>

      <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-sm overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-100/50 dark:border-slate-800/50">
           <div className="relative max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search expense nodes..." 
                className="h-12 pl-12 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
        </CardHeader>
        <CardContent className="p-0">
           <Table>
             <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
               <TableRow className="hover:bg-transparent border-none">
                 <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400 px-8">Description Node</TableHead>
                 <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400">Category</TableHead>
                 <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400">Yield Out</TableHead>
                 <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400 text-right pr-8">Date</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {loading ? (
                 Array.from({ length: 5 }).map((_, i) => <TableRow key={i} className="h-20 border-b border-slate-50 animate-pulse"><TableCell colSpan={4} /></TableRow>)
               ) : filteredExpenses.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={4} className="h-64 text-center">
                      <div className="space-y-4">
                         <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto">
                            <History className="h-8 w-8 text-slate-200" />
                         </div>
                         <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No expenditures logged</p>
                      </div>
                   </TableCell>
                 </TableRow>
               ) : (
                 filteredExpenses.map((e) => (
                   <TableRow key={e.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all border-b border-slate-50 dark:border-slate-800/50">
                     <TableCell className="px-8 h-20">
                        <div className="font-black text-slate-900 dark:text-white tracking-tight">{e.description}</div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                           <User size={10} className="text-primary" /> {e.userName}
                        </div>
                     </TableCell>
                     <TableCell>
                        <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                           {e.category}
                        </div>
                     </TableCell>
                     <TableCell>
                        <div className="text-lg font-[1000] text-rose-600 tracking-tighter">Le {e.amount.toLocaleString()}</div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{e.paymentMethod}</div>
                     </TableCell>
                     <TableCell className="text-right pr-8">
                        <div className="text-xs font-bold text-slate-600 dark:text-slate-400">{format(new Date(e.date), "MMM dd, yyyy")}</div>
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
