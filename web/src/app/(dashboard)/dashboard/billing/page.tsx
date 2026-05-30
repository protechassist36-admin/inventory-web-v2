"use client";

import { useState, useEffect } from "react";
import { CreditCard, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { getCurrentSubscription, getInvoices } from "@/lib/actions/billing";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function BillingPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [sub, inv] = await Promise.all([getCurrentSubscription(), getInvoices()]);
        setSubscription(sub);
        setInvoices(inv);
      } catch (error) {
        toast.error("Failed to load billing information.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div className="p-8">Loading billing details...</div>;

  return (
    <div className="space-y-8 p-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-3xl font-[1000] tracking-tight text-slate-900">Billing & Subscription</h1>
        <p className="text-slate-500 font-medium">Manage your subscription plan and view invoice history.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-xl bg-white rounded-3xl p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-lg font-black text-slate-900">Current Plan</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {subscription ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div>
                        <div className="text-sm font-black text-slate-900 uppercase">{subscription.plan}</div>
                        <div className="text-xs font-bold text-slate-400">Expires {format(new Date(subscription.endDate), "PPP")}</div>
                    </div>
                    <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase",
                        subscription.status === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                    )}>
                        {subscription.status}
                    </span>
                </div>
              </div>
            ) : (
                <div className="text-slate-500 font-medium">No active subscription found.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
          <CardTitle className="text-lg font-black text-slate-900">Invoice History</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-bold text-slate-700">{format(new Date(invoice.createdAt), "PPP")}</TableCell>
                <TableCell className="font-black text-slate-900">Le {Number(invoice.amount).toLocaleString()}</TableCell>
                <TableCell>
                  <span className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-black uppercase",
                    invoice.status === 'PAID' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  )}>
                    {invoice.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
