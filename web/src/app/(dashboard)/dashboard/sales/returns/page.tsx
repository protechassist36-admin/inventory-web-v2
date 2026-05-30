"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  RotateCcw, 
  Search, 
  Filter, 
  ArrowLeftRight, 
  Package, 
  Calendar, 
  User,
  History,
  Activity,
  Plus
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
import { getReturns } from "@/lib/actions/return";
import { format } from "date-fns";
import { cn, getIndustryColor } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function SalesReturnsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const businessType = session?.user?.businessType || "SHOP";
  const colors = getIndustryColor(businessType);

  useEffect(() => {
    fetchReturns();
  }, []);

  async function fetchReturns() {
    try {
      setLoading(true);
      const data = await getReturns();
      setReturns(data);
    } catch (error) {
      toast.error("Failed to load return logs.");
    } finally {
      setLoading(false);
    }
  }

  const filteredReturns = returns.filter(r => 
    r.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.reason?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 p-6 md:p-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <div className={cn("p-1.5 rounded-lg text-white shadow-lg", colors.primary)}>
                 <RotateCcw className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Inventory Integrity</span>
           </div>
           <h1 className="text-4xl font-[1000] text-slate-900 dark:text-white tracking-tight">Sales Returns</h1>
           <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Monitor and manage reversed transactions and stock reinstatements.</p>
        </div>

        <Button onClick={() => router.push("/dashboard/inventory/history")} className={cn("h-12 px-8 rounded-xl text-white font-black uppercase text-[10px] tracking-widest shadow-xl", colors.primary)}>
           <Plus className="h-4 w-4 mr-2" /> Initialize Return
        </Button>
      </div>

      <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-sm overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-100/50 dark:border-slate-800/50">
           <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="relative flex-1 max-w-md group">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                 <Input 
                   placeholder="Search product or return reason..." 
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
                    <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400 px-8">Product Node</TableHead>
                    <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400">Date</TableHead>
                    <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400">Quantity</TableHead>
                    <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400">Processor</TableHead>
                    <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400 text-right pr-8">Reasoning</TableHead>
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
                  ) : filteredReturns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-64 text-center">
                        <div className="space-y-4">
                           <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto">
                              <History className="h-8 w-8 text-slate-200" />
                           </div>
                           <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No returns registered in log</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReturns.map((ret) => (
                      <TableRow key={ret.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all border-b border-slate-50 dark:border-slate-800/50">
                        <TableCell className="px-8 h-20">
                          <div className="flex items-center gap-3">
                             <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <Package size={18} className="text-slate-400" />
                             </div>
                             <div className="font-black text-slate-900 dark:text-white tracking-tight">{ret.productName}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                             <Calendar size={12} className="text-primary" />
                             {format(new Date(ret.createdAt), "MMM dd, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 text-xs font-black">
                             <ArrowLeftRight size={12} />
                             {ret.quantity} Units
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                             <User size={12} className="text-emerald-500" />
                             {ret.userName}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <span className="text-[10px] font-bold text-slate-400 italic uppercase tracking-wider">{ret.reason || "Manual Adjustment"}</span>
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
