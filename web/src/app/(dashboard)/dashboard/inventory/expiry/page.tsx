"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Clock, Calendar, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { format, addDays, isPast, isBefore } from "date-fns";
import { cn } from "@/lib/utils";
import { getExpiringBatches } from "@/lib/actions/stock";

export default function ExpiryTrackingPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getExpiringBatches();
        setBatches(data);
      } catch {
        toast.error("Failed to load expiry tracking data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const today = new Date();
  const warningThreshold = addDays(today, 30);

  const getStatus = (expiryDate: string) => {
    const date = new Date(expiryDate);
    if (isPast(date)) return { label: "Expired", color: "text-rose-500", bg: "bg-rose-50" };
    if (isBefore(date, warningThreshold)) return { label: "Near Expiry", color: "text-amber-500", bg: "bg-amber-50" };
    return { label: "Safe", color: "text-emerald-500", bg: "bg-emerald-50" };
  };

  return (
    <div className="space-y-6 p-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-[1000] tracking-tight text-slate-900 dark:text-white">Expiry Tracking</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6 rounded-3xl border-rose-100 bg-rose-50/50">
           <CardTitle className="text-sm font-black text-rose-800">Expired Items</CardTitle>
           <div className="text-3xl font-black text-rose-600 mt-2">{batches.filter(b => isPast(new Date(b.expiryDate))).length}</div>
        </Card>
        <Card className="p-6 rounded-3xl border-amber-100 bg-amber-50/50">
           <CardTitle className="text-sm font-black text-amber-800">Near Expiry (30 days)</CardTitle>
           <div className="text-3xl font-black text-amber-600 mt-2">{batches.filter(b => !isPast(new Date(b.expiryDate)) && isBefore(new Date(b.expiryDate), warningThreshold)).length}</div>
        </Card>
      </div>

      <Card className="rounded-[2rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Batch Number</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((batch) => {
              const status = getStatus(batch.expiryDate);
              return (
                <TableRow key={batch.id}>
                  <TableCell className="font-bold">{batch.product.name}</TableCell>
                  <TableCell>{batch.batchNumber}</TableCell>
                  <TableCell>{format(new Date(batch.expiryDate), "PPP")}</TableCell>
                  <TableCell>
                    <span className={cn("px-3 py-1 rounded-full font-black text-[10px] uppercase", status.bg, status.color)}>
                      {status.label}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
