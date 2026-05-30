"use client";

import { useState, useEffect } from "react";
import { Search, RotateCcw, Package, AlertCircle, ShoppingCart, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getRecentSales } from "@/lib/actions/sale";
import { processReturn } from "@/lib/actions/return";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function ReturnsPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [returnItems, setReturnItems] = useState<any[]>([]);

  useEffect(() => {
    fetchSales();
  }, []);

  async function fetchSales() {
    try {
      setLoading(true);
      const data = await getRecentSales();
      setSales(data);
    } catch (error) {
      toast.error("Failed to load recent sales.");
    } finally {
      setLoading(false);
    }
  }

  const handleSelectSale = (sale: any) => {
    setSelectedSale(sale);
    setReturnItems(sale.items.map((item: any) => ({
      ...item,
      returnQuantity: 0
    })));
  };

  const handleReturnQtyChange = (productId: string, qty: number) => {
    setReturnItems(returnItems.map(item => 
      item.productId === productId ? { ...item, returnQuantity: qty } : item
    ));
  };

  async function handleSubmitReturn() {
    const itemsToReturn = returnItems.filter(item => item.returnQuantity > 0);
    if (itemsToReturn.length === 0) return toast.error("Select items to return");

    try {
      await processReturn({
        saleId: selectedSale.id,
        items: itemsToReturn.map(item => ({
          productId: item.productId,
          quantity: item.returnQuantity
        })),
        reason: "Customer Return"
      });
      toast.success("Return processed. Inventory updated.");
      setSelectedSale(null);
      setReturnItems([]);
      fetchSales();
    } catch (error) {
      toast.error("Failed to process return.");
    }
  }

  const filteredSales = sales.filter(s => 
    s.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-[1000] tracking-tight text-slate-900">Returns & RMA</h1>
           <p className="text-slate-500 font-medium">Handle product returns and restore inventory balances.</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
         {/* Search & Select Sale */}
         <div className="space-y-6">
            <Card className="border-none shadow-sm bg-white p-4 rounded-3xl">
               <div className="relative group">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <Input 
                     placeholder="Search by Invoice # (e.g. INV-2026...)" 
                     className="pl-10 h-10 rounded-xl border-slate-100 bg-slate-50 focus:bg-white"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>
            </Card>

            <div className="rounded-[2rem] border-none bg-white shadow-xl overflow-hidden">
               <Table>
                  <TableHeader className="bg-slate-50">
                     <TableRow className="hover:bg-transparent border-slate-100">
                        <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest pl-8">Invoice</TableHead>
                        <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Customer</TableHead>
                        <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest text-right pr-8">Value</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {loading ? (
                       [1,2,3].map(i => <TableRow key={i} className="h-16 animate-pulse bg-slate-50/50 border-slate-50" />)
                     ) : filteredSales.length === 0 ? (
                        <TableRow>
                           <TableCell colSpan={3} className="h-32 text-center text-slate-400 font-bold italic">No matching sales found.</TableCell>
                        </TableRow>
                     ) : (
                        filteredSales.map((sale) => (
                           <TableRow 
                             key={sale.id} 
                             className={cn(
                               "hover:bg-slate-50/50 border-slate-50 cursor-pointer transition-colors",
                               selectedSale?.id === sale.id && "bg-primary/5 border-primary/20"
                             )}
                             onClick={() => handleSelectSale(sale)}
                           >
                              <TableCell className="pl-8 py-4">
                                 <div className="font-black text-slate-800 text-sm">{sale.invoiceNumber}</div>
                                 <div className="text-[10px] font-bold text-slate-400 uppercase">{format(new Date(sale.createdAt), "MMM dd, yyyy")}</div>
                              </TableCell>
                              <TableCell>
                                 <div className="text-xs font-bold text-slate-600">{sale.customer?.name || "Walk-in"}</div>
                              </TableCell>
                              <TableCell className="text-right pr-8">
                                 <div className="font-black text-slate-900">Le {sale.totalAmount.toLocaleString()}</div>
                              </TableCell>
                           </TableRow>
                        ))
                     )}
                  </TableBody>
               </Table>
            </div>
         </div>

         {/* Return Processing Form */}
         <div className="space-y-6">
            {!selectedSale ? (
               <Card className="h-full border-dashed border-2 border-slate-100 bg-slate-50/50 rounded-[2rem] flex flex-col items-center justify-center p-12 text-center">
                  <div className="bg-white p-6 rounded-full shadow-sm mb-6">
                     <RotateCcw className="h-12 w-12 text-slate-200" />
                  </div>
                  <h3 className="text-xl font-black text-slate-400">Select a transaction to begin return processing.</h3>
               </Card>
            ) : (
               <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden animate-in slide-in-from-right-4 duration-500">
                  <div className="bg-slate-900 p-8 text-white">
                     <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-rose-500 rounded-lg">
                           <RotateCcw className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inventory Restoration</span>
                     </div>
                     <h2 className="text-2xl font-[1000] tracking-tight">Return for {selectedSale.invoiceNumber}</h2>
                  </div>

                  <CardContent className="p-8 space-y-8">
                     <div className="space-y-4">
                        <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Select Items & Quantities</h3>
                        <div className="rounded-2xl border border-slate-100 overflow-hidden">
                           <Table>
                              <TableHeader className="bg-slate-50">
                                 <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableHead className="text-[10px] font-black uppercase text-slate-400">Product</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-400 text-center">Sold</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-400 text-right pr-6">Returning</TableHead>
                                 </TableRow>
                              </TableHeader>
                              <TableBody>
                                 {returnItems.map((item) => (
                                    <TableRow key={item.productId} className="border-slate-50">
                                       <TableCell className="font-bold text-slate-700">{item.product?.name || "Product"}</TableCell>
                                       <TableCell className="text-center font-black text-slate-400">{item.quantity}</TableCell>
                                       <TableCell className="text-right pr-6">
                                          <Input 
                                             type="number"
                                             min="0"
                                             max={item.quantity}
                                             className="h-9 w-20 ml-auto rounded-lg text-right font-black border-slate-100 bg-slate-50 focus:bg-white"
                                             value={item.returnQuantity}
                                             onChange={(e) => handleReturnQtyChange(item.productId, parseInt(e.target.value) || 0)}
                                          />
                                       </TableCell>
                                    </TableRow>
                                 ))}
                              </TableBody>
                           </Table>
                        </div>
                     </div>

                     <div className="p-6 rounded-2xl bg-rose-50 border border-rose-100">
                        <div className="flex gap-3">
                           <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
                           <p className="text-xs font-bold text-rose-700 leading-relaxed">
                              Proceeding will restore the selected quantities back to your inventory levels. This action will be logged in the stock movement ledger as a RETURN.
                           </p>
                        </div>
                     </div>

                     <div className="flex gap-4">
                        <Button 
                           variant="outline" 
                           className="flex-1 h-12 rounded-xl font-bold border-slate-100 text-slate-400"
                           onClick={() => setSelectedSale(null)}
                        >
                           Discard
                        </Button>
                        <Button 
                           className="flex-[2] h-12 rounded-xl font-black bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-200"
                           onClick={handleSubmitReturn}
                        >
                           Confirm Return
                        </Button>
                     </div>
                  </CardContent>
               </Card>
            )}
         </div>
      </div>
    </div>
  );
}
