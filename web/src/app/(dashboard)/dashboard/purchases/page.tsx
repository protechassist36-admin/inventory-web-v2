"use client";

import { useEffect, useState } from "react";
import { Plus, Package, Calendar, Truck, DollarSign, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { getPurchases } from "@/lib/actions/purchase";
import { ProcurementModal } from "@/components/dashboard/procurement-modal";
import { format } from "date-fns";

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const data = await getPurchases();
      setPurchases(data);
    } catch (error) {
      console.error("Failed to fetch purchases:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const filteredPurchases = purchases.filter(p => 
    p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.supplier?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 bg-slate-50/50 dark:bg-slate-950 min-h-screen space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Procurement History</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Manage and track your business procurement operations.</p>
        </div>
        
        <ProcurementModal onSuccess={fetchPurchases} />
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Procurement", value: `Le ${purchases.reduce((acc, p) => acc + p.totalAmount, 0).toLocaleString()}`, icon: DollarSign, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
          { label: "Active Suppliers", value: new Set(purchases.map(p => p.supplierId)).size, icon: Truck, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
          { label: "Total Orders", value: purchases.length, icon: Package, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
        ].map((stat, i) => (
          <div key={i} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5">
            <div className={`h-12 w-12 rounded-2xl ${stat.bg} flex items-center justify-center`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* FILTERS & SEARCH */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search invoice or supplier..." 
            className="pl-11 h-12 bg-slate-50 dark:bg-slate-950 border-transparent rounded-xl focus:bg-white dark:focus:bg-slate-900 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-12 rounded-xl border-slate-200 dark:border-slate-700 gap-2 px-6">
          <Filter className="h-4 w-4" /> Filters
        </Button>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
            <TableRow className="border-slate-100 dark:border-slate-800">
              <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Order Ref</TableHead>
              <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Supplier</TableHead>
              <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</TableHead>
              <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Items</TableHead>
              <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Total Amount</TableHead>
              <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="animate-pulse">
                  <TableCell className="px-8 py-6"><div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded" /></TableCell>
                  <TableCell><div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded" /></TableCell>
                  <TableCell><div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 rounded" /></TableCell>
                  <TableCell><div className="h-4 w-12 bg-slate-100 dark:bg-slate-800 rounded" /></TableCell>
                  <TableCell className="text-right"><div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 ml-auto rounded" /></TableCell>
                  <TableCell className="px-8"><div className="h-6 w-16 bg-slate-100 dark:bg-slate-800 ml-auto rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : filteredPurchases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <Package className="h-12 w-12 text-slate-200" />
                    <p className="text-slate-500 font-medium">No procurement records found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredPurchases.map((purchase) => (
                <TableRow key={purchase.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer border-slate-100 dark:border-slate-800">
                  <TableCell className="px-8 py-6 font-black text-slate-900 dark:text-white">{purchase.invoiceNumber}</TableCell>
                  <TableCell className="font-bold text-slate-600 dark:text-slate-400">{purchase.supplier?.name || "N/A"}</TableCell>
                  <TableCell className="text-slate-500 flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(purchase.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase text-slate-600 dark:text-slate-400">
                      {purchase.items?.length || 0} Items
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-black text-slate-950 dark:text-white">
                    Le {purchase.totalAmount.toLocaleString()}
                  </TableCell>
                  <TableCell className="px-8 text-right">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Completed</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
