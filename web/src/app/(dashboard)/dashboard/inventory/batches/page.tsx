"use client";

import { useState, useEffect } from "react";
import { Package, Search, Plus, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// This is a placeholder action until the backend is fully connected
async function getBatches() {
  return [
    { id: "1", batchNumber: "B101", product: { name: "Paracetamol" }, quantity: 100, expiryDate: new Date(2026, 5, 20) },
    { id: "2", batchNumber: "B102", product: { name: "Amoxicillin" }, quantity: 50, expiryDate: new Date(2026, 0, 10) },
  ];
}

export default function BatchesPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getBatches();
        setBatches(data);
      } catch {
        toast.error("Failed to load batches");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6 p-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-[1000] tracking-tight text-slate-900 dark:text-white">Batch Management</h1>
        <Button className="rounded-2xl bg-indigo-600 font-black">
          <Plus className="mr-2 h-4 w-4" /> Add Batch
        </Button>
      </div>

      <Card className="rounded-[2rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch Number</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Expiry Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((batch) => (
              <TableRow key={batch.id}>
                <TableCell className="font-bold">{batch.batchNumber}</TableCell>
                <TableCell>{batch.product.name}</TableCell>
                <TableCell>{batch.quantity}</TableCell>
                <TableCell className={cn(
                  "font-bold",
                  new Date(batch.expiryDate) < new Date() ? "text-rose-500" : "text-emerald-500"
                )}>
                  {format(new Date(batch.expiryDate), "PPP")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
