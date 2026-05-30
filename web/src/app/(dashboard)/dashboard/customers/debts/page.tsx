"use client";

import { useState, useEffect } from "react";
import { Search, CreditCard, Calendar, User, DollarSign, History, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getDebts, createDebtPayment } from "@/lib/actions/debt";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function DebtsPage() {
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);

  useEffect(() => {
    fetchDebts();
  }, []);

  async function fetchDebts() {
    try {
      setLoading(true);
      const data = await getDebts();
      setDebts(data);
    } catch (error) {
      toast.error("Failed to load debt records.");
    } finally {
      setLoading(false);
    }
  }

  const filteredDebts = debts.filter(d => 
    d.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.sale?.invoiceNumber && d.sale.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalOutstanding = debts.reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0);

  async function handlePayment() {
    if (paymentAmount <= 0) return toast.error("Enter a valid amount");
    if (paymentAmount > (selectedDebt.totalAmount - selectedDebt.paidAmount)) {
       return toast.error("Payment exceeds outstanding balance");
    }

    try {
      const result = await createDebtPayment(selectedDebt.id, paymentAmount);
      if (result.success) {
        toast.success("Payment recorded successfully.");
        setIsPaymentDialogOpen(false);
        setPaymentAmount(0);
        setSelectedDebt(null);
        fetchDebts();
      }
    } catch (error) {
      toast.error("Failed to record payment.");
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 font-[1000]">Credit & Debt Ledger</h1>
          <p className="text-slate-500 font-medium">Track customer balances and manage account receivables.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-xl shadow-slate-100/50 bg-slate-900 text-white rounded-3xl overflow-hidden relative">
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
           <CardContent className="p-6">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Outstanding</div>
              <div className="text-3xl font-[1000] tracking-tighter">Le {totalOutstanding.toLocaleString()}</div>
              <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase">Receivable from {debts.filter(d => d.status !== 'PAID').length} clients</p>
           </CardContent>
        </Card>
        <Card className="border-none shadow-xl shadow-slate-100/50 bg-white rounded-3xl overflow-hidden relative">
           <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
           <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                 <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Settled This Month</div>
                 <div className="text-2xl font-black text-slate-900">Le {debts.filter(d => d.status === 'PAID').reduce((sum, d) => sum + d.paidAmount, 0).toLocaleString()}</div>
              </div>
           </CardContent>
        </Card>
        <Card className="border-none shadow-xl shadow-slate-100/50 bg-white rounded-3xl overflow-hidden relative">
           <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
           <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
                 <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overdue Accounts</div>
                 <div className="text-2xl font-black text-slate-900">{debts.filter(d => d.dueDate && new Date(d.dueDate) < new Date() && d.status !== 'PAID').length}</div>
              </div>
           </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm p-4 rounded-3xl">
        <div className="relative group">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search by customer name or invoice..." 
            className="pl-10 h-10 rounded-xl border-slate-100 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </Card>

      <div className="rounded-[2rem] border-none bg-white shadow-xl shadow-slate-100/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-slate-50">
              <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest pl-6">Customer & Transaction</TableHead>
              <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Balance Details</TableHead>
              <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Status</TableHead>
              <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Due Date</TableHead>
              <TableHead className="w-[120px] pr-6"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [1,2,3].map(i => (
                <TableRow key={i} className="border-slate-50">
                  <TableCell colSpan={5} className="h-20 animate-pulse bg-slate-50/50 first:rounded-l-[2rem] last:rounded-r-[2rem]" />
                </TableRow>
              ))
            ) : filteredDebts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-400 font-bold italic">
                  No debt records found.
                </TableCell>
              </TableRow>
            ) : (
              filteredDebts.map((debt) => (
                <TableRow key={debt.id} className="hover:bg-slate-50/50 border-slate-50 group transition-colors">
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-800 text-sm">{debt.customer.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{debt.sale?.invoiceNumber || "Opening Balance"}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <div className="text-sm font-black text-slate-900">Le {(debt.totalAmount - debt.paidAmount).toLocaleString()} <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">Left</span></div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Total: Le {debt.totalAmount.toLocaleString()}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter",
                      debt.status === 'PAID' ? "bg-emerald-50 text-emerald-600" : 
                      debt.status === 'PARTIAL' ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                    )}>
                      {debt.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className={cn(
                      "text-xs font-bold",
                      debt.dueDate && new Date(debt.dueDate) < new Date() && debt.status !== 'PAID' ? "text-rose-500" : "text-slate-600"
                    )}>
                      {debt.dueDate ? format(new Date(debt.dueDate), "MMM dd, yyyy") : "No limit"}
                    </div>
                  </TableCell>
                  <TableCell className="pr-6">
                    <div className="flex justify-end gap-2">
                       {debt.status !== 'PAID' && (
                         <Button 
                           size="sm" 
                           variant="outline" 
                           className="h-8 rounded-lg border-slate-100 font-bold text-xs"
                           onClick={() => {
                             setSelectedDebt(debt);
                             setPaymentAmount(debt.totalAmount - debt.paidAmount);
                             setIsPaymentDialogOpen(true);
                           }}
                         >
                           Record Payment
                         </Button>
                       )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Settle Debt</DialogTitle>
            <p className="text-slate-400 font-bold text-sm">Recording payment for {selectedDebt?.customer.name}</p>
          </DialogHeader>
          <div className="space-y-6 pt-6">
             <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase">Outstanding Balance</span>
                <span className="text-xl font-black text-primary">Le {selectedDebt ? (selectedDebt.totalAmount - selectedDebt.paidAmount).toLocaleString() : 0}</span>
             </div>
             <div className="space-y-2">
                <Label className="font-bold text-slate-700">Payment Amount (Le)</Label>
                <div className="relative">
                   <DollarSign className="absolute left-3 top-3 h-5 w-5 text-slate-300" />
                   <Input 
                     type="number"
                     value={paymentAmount}
                     onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                     className="h-12 pl-10 rounded-xl border-slate-100 bg-slate-50"
                   />
                </div>
             </div>
             <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
                <Button variant="ghost" className="font-bold text-slate-400" onClick={() => setIsPaymentDialogOpen(false)}>Cancel</Button>
                <Button className="rounded-xl px-8 h-12 bg-slate-900 text-white font-black" onClick={handlePayment}>Confirm Payment</Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
