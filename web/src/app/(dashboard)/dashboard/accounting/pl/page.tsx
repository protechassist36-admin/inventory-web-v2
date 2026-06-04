"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getProfitLossData } from "@/lib/actions/pl";
import { getProductProfitability } from "@/lib/actions/product-pl";
import { subDays } from "date-fns";
import { Loader2, TrendingUp, TrendingDown, DollarSign, Package } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProfitLossPage() {
  const [data, setData] = useState<any>(null);
  const [productData, setProductData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const end = new Date();
    const start = subDays(end, 30);
    Promise.all([
      getProfitLossData(start, end),
      getProductProfitability(start, end)
    ]).then(([pl, products]) => {
      setData(pl);
      setProductData(products);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;

  const cards = [
    { title: "Total Revenue", value: data.totalRevenue, icon: TrendingUp, color: "text-emerald-600" },
    { title: "Total Expenses", value: data.totalExpenses, icon: TrendingDown, color: "text-rose-600" },
    { title: "Net Profit", value: data.netProfit, icon: DollarSign, color: "text-indigo-600" },
  ];

  return (
    <div className="p-6 md:p-10 space-y-8">
      <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Profit & Loss Analysis</h1>
      
      <div className="grid gap-6 md:grid-cols-3">
        {cards.map((card, i) => (
          <Card key={i} className="border-none shadow-xl shadow-slate-100/50 rounded-3xl p-6">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
               <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest">{card.title}</CardTitle>
               <card.icon className={cn("h-4 w-4", card.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-[1000] tracking-tighter">Le {Math.round(card.value).toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-xl shadow-slate-100/50 rounded-3xl p-6">
        <CardHeader>
          <CardTitle className="text-xl font-black text-slate-900">Product Profitability</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-100">
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty Sold</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productData.map((p) => (
                <TableRow key={p.id} className="border-slate-50">
                  <TableCell className="font-bold flex items-center gap-3">
                    <Package className="h-4 w-4 text-slate-400" />
                    {p.name}
                  </TableCell>
                  <TableCell className="text-right font-black">{p.quantity}</TableCell>
                  <TableCell className="text-right">Le {Math.round(p.totalRevenue).toLocaleString()}</TableCell>
                  <TableCell className="text-right">Le {Math.round(p.totalCost).toLocaleString()}</TableCell>
                  <TableCell className={cn("text-right font-black", p.profit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                    Le {Math.round(p.profit).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
