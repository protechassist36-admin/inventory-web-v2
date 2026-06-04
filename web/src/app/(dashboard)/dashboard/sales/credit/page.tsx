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
import { Label } from "@/components/ui/label";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  
  // Payment Dialog State
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentNote, setPaymentNote] = useState("");

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

  async function handlePayment() {
    if (!selectedDebt) return;
    if (paymentAmount <= 0) return toast.error("Enter a valid amount");
    if (paymentAmount > (selectedDebt.totalAmount - selectedDebt.paidAmount)) {
       return toast.error("Payment exceeds outstanding balance");
    }

    try {
      const result = await createDebtPayment(selectedDebt.id, paymentAmount, "CASH", paymentNote);
      if (result.success) {
        toast.success("Payment recorded successfully.");
        setIsPaymentDialogOpen(false);
        setPaymentAmount(0);
        setPaymentNote("");
        fetchDebts();
      } else {
        toast.error("Failed to record payment.");
      }
    } catch (error) {
      toast.error("Failed to record payment.");
    }
  }

  const filteredDebts = debts.filter(d => 
    d.customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.sale?.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 p-6 md:p-10">
      {/* ... header and stats cards remain the same ... */}
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
                         <Button variant="ghost" size="sm" className="h-10 px-4 rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-500 hover:bg-white hover:text-primary transition-all"
                           onClick={() => {
                              setSelectedDebt(debt);
                              setPaymentAmount(debt.totalAmount - debt.paidAmount);
                              setIsPaymentDialogOpen(true);
                           }}
                         >
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

      {/* Payment Dialog */
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Settle Node</DialogTitle>
            <DialogDescription className="text-slate-400 font-bold text-sm">Recording payment for {selectedDebt?.customer?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="font-bold text-slate-700">Payment Amount (Le)</Label>
              <Input 
                type="number" 
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                className="h-12 rounded-xl border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-slate-700">Payment Note</Label>
              <Input 
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                className="h-12 rounded-xl border-slate-200"
                placeholder="Optional payment note..."
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" className="font-bold text-slate-400" onClick={() => setIsPaymentDialogOpen(false)}>Cancel</Button>
            <Button className="rounded-xl px-8 h-12 bg-slate-900 text-white font-black" onClick={handlePayment}>Confirm Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
