"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Minus,
  X, 
  Trash2, 
  Save, 
  Package, 
  Truck, 
  Info, 
  TrendingUp, 
  BarChart3,
  Calculator,
  ShieldCheck,
  Zap,
  ChevronRight,
  ShoppingCart,
  Receipt,
  AlertCircle,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { createPurchase } from "@/lib/actions/purchase";
import { getProducts } from "@/lib/actions/product";
import { getSuppliers } from "@/lib/actions/supplier";
import { cn } from "@/lib/utils";

const itemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitCost: z.number().min(0, "Unit cost must be at least 0"),
  total: z.number(),
});

const purchaseSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  items: z.array(itemSchema).min(1, "At least one item is required"),
  notes: z.string().optional(),
});

type PurchaseFormValues = z.infer<typeof purchaseSchema>;

export function ProcurementModal({ 
  onSuccess 
}: { 
  onSuccess?: () => void 
}) {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      supplierId: "",
      invoiceNumber: `PO-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
      items: [{ productId: "", quantity: 1, unitCost: 0, total: 0 }],
      notes: "",
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        try {
          const [p, s] = await Promise.all([getProducts(), getSuppliers()]);
          setProducts(p);
          setSuppliers(s);
        } catch (error) {
          toast.error("Failed to load procurement data");
        }
      };
      fetchData();
    }
  }, [open]);

  const items = form.watch("items");
  const subtotal = useMemo(() => items.reduce((acc, item) => acc + (item.total || 0), 0), [items]);
  const itemCount = useMemo(() => items.reduce((acc, item) => acc + (item.quantity || 0), 0), [items]);

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      const quantity = form.getValues(`items.${index}.quantity`) || 1;
      const unitCost = product.costPrice || product.unitPrice || 0;
      update(index, {
        productId,
        quantity,
        unitCost,
        total: quantity * unitCost,
      });
    }
  };

  const handleQuantityCostChange = (index: number) => {
    const quantity = form.getValues(`items.${index}.quantity`);
    const unitCost = form.getValues(`items.${index}.unitCost`);
    form.setValue(`items.${index}.total`, quantity * unitCost);
  };

  const onSubmit = async (data: PurchaseFormValues) => {
    setLoading(true);
    try {
      const result = await createPurchase({
        supplierId: data.supplierId,
        invoiceNumber: data.invoiceNumber,
        items: data.items.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          unitCost: i.unitCost,
          total: i.total
        })),
        totalAmount: subtotal,
      });

      if (result.success) {
        toast.success("Purchase recorded successfully");
        setOpen(false);
        form.reset();
        onSuccess?.();
      }
    } catch (error) {
      toast.error("Failed to record purchase");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="h-12 px-6 bg-slate-950 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl active:scale-95 gap-2">
            <Plus className="h-4 w-4" /> Record New Purchase
          </Button>
        }
      />
      
      <DialogContent className="sm:max-w-[1200px] w-[95vw] p-0 overflow-hidden shadow-2xl rounded-3xl h-[90vh] flex flex-col bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-300">
        
        {/* ENTERPRISE HEADER */}
        <div className="p-6 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-slate-900 dark:text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-950 dark:text-white tracking-tight leading-none">Record New Purchase</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Synchronize procurement operations and update inventory intelligence in real time.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
              <Zap className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Live Sync Active</span>
            </div>
            <button onClick={() => setOpen(false)} className="h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-slate-950 dark:hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* WORKSPACE AREA */}
        <div className="flex flex-1 overflow-hidden relative">
          
          {/* LEFT COLUMN: WORKFLOW (70%) */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/50 dark:bg-transparent custom-scrollbar">
            
            {/* Supplier & Ref Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-slate-400" />
                  <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Primary Supplier</Label>
                </div>
                <Select value={form.watch("supplierId")} onValueChange={(val) => form.setValue("supplierId", val)}>
                  <SelectTrigger className="h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 transition-all focus:ring-2 focus:ring-slate-950 dark:focus:ring-slate-400">
                    <SelectValue placeholder="Select a supplier" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-slate-400" />
                  <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Invoice Reference</Label>
                </div>
                <Input 
                  {...form.register("invoiceNumber")}
                  className="h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 transition-all focus:ring-2 focus:ring-slate-950 dark:focus:ring-slate-400" 
                  placeholder="PO-2026-..." 
                />
              </div>
            </div>

            {/* Quick Search & Add Bar */}
            <div className="space-y-4">
              <div className="p-2 bg-slate-100 dark:bg-slate-900/50 rounded-2xl flex items-center gap-3 border border-slate-200 dark:border-slate-800">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Select onValueChange={(val) => {
                    const product = products.find(p => p.id === val);
                    if (product) {
                      append({ 
                        productId: val, 
                        quantity: 1, 
                        unitCost: product.costPrice || product.unitPrice || 0,
                        total: product.costPrice || product.unitPrice || 0
                      });
                      toast.success(`${product.name} added to cart`);
                    }
                  }}>
                    <SelectTrigger className="h-12 pl-12 rounded-xl bg-white dark:bg-slate-950 border-transparent shadow-sm hover:shadow-md transition-all">
                      <SelectValue placeholder="Quick search product to add to cart..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl">
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                              <Package size={14} className="text-slate-500" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-black text-xs uppercase">{p.name}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">SKU: {p.sku} • Stock: {p.stockQuantity}</span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />
                <Button 
                  type="button"
                  onClick={() => append({ productId: "", quantity: 1, unitCost: 0, total: 0 })}
                  variant="outline"
                  className="h-12 rounded-xl px-6 font-black text-[10px] uppercase tracking-widest border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                >
                  <Plus className="mr-2 h-4 w-4" /> Manual Row
                </Button>
              </div>
            </div>

            {/* Inventory Items Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-2">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-slate-400" />
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Active Procurement Cart</h4>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xl overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Product / Item Name</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-52 text-center">Qty</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-56 text-right">Unit Cost</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-40 text-right">Total</th>
                      <th className="px-4 py-4 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <AnimatePresence mode="popLayout">
                      {fields.map((field, index) => (
                        <motion.tr 
                          key={field.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <Select 
                              value={form.watch(`items.${index}.productId`)} 
                              onValueChange={(val) => handleProductChange(index, val)}
                            >
                              <SelectTrigger className="h-10 border-transparent bg-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all rounded-lg font-bold">
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                                {products.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold">{p.name}</span>
                                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">{p.sku}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                type="button"
                                onClick={() => {
                                  const current = form.getValues(`items.${index}.quantity`);
                                  if (current > 1) {
                                    form.setValue(`items.${index}.quantity`, current - 1);
                                    handleQuantityCostChange(index);
                                  }
                                }}
                                className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 text-slate-600 dark:text-slate-400"
                              >
                                <Minus size={16} />
                              </button>
                              
                              <Input 
                                type="number"
                                {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                                onChange={() => handleQuantityCostChange(index)}
                                className="h-11 w-20 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-900 text-center font-black text-base transition-all rounded-xl"
                              />

                              <button 
                                type="button"
                                onClick={() => {
                                  const current = form.getValues(`items.${index}.quantity`);
                                  form.setValue(`items.${index}.quantity`, current + 1);
                                  handleQuantityCostChange(index);
                                }}
                                className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Le</span>
                              <Input 
                                type="number"
                                {...form.register(`items.${index}.unitCost`, { valueAsNumber: true })}
                                onChange={() => handleQuantityCostChange(index)}
                                className="h-11 w-44 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-900 text-right font-black text-base transition-all rounded-xl"
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white">
                            Le {form.watch(`items.${index}.total`)?.toLocaleString()}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button 
                              type="button"
                              onClick={() => remove(index)}
                              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-3 p-6 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-slate-400" />
                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Procurement Notes</Label>
              </div>
              <textarea 
                {...form.register("notes")}
                className="w-full min-h-[100px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm transition-all focus:ring-2 focus:ring-slate-950 dark:focus:ring-slate-400 outline-none"
                placeholder="Add internal notes about this procurement order..."
              />
            </div>
          </div>

          {/* RIGHT COLUMN: ANALYTICS (30%) */}
          <div className="w-[380px] bg-white dark:bg-slate-950 border-l border-slate-100 dark:border-slate-800 p-8 flex flex-col shrink-0 overflow-y-auto hidden lg:flex">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Operational Intelligence
            </h4>

            <div className="space-y-8 flex-1">
              {/* Main Total Card */}
              <div className="p-8 bg-slate-950 dark:bg-slate-900 text-white rounded-[2.5rem] space-y-4 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <Calculator size={80} />
                </div>
                <div className="space-y-1 relative z-10">
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Total Procurement Investment</div>
                  <div className="text-4xl font-[1000] tracking-tighter text-glow">Le {subtotal.toLocaleString()}</div>
                </div>
                <div className="pt-4 border-t border-white/10 flex justify-between items-center relative z-10">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-300">{itemCount} items total</span>
                  </div>
                  <div className="text-[10px] font-black uppercase px-2 py-1 rounded bg-white/10 text-white tracking-widest">Calculated</div>
                </div>
              </div>

              {/* Breakdown Sections */}
              <div className="space-y-6 px-2">
                <div className="flex justify-between items-center group cursor-help">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Inventory Valuation Impact</span>
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-black text-sm">
                      <TrendingUp size={14} />
                      <span>+ Le {subtotal.toLocaleString()}</span>
                    </div>
                  </div>
                  <Info size={14} className="text-slate-200 group-hover:text-slate-400 transition-colors" />
                </div>

                <div className="flex justify-between items-center group cursor-help">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Projected Stock Level Impact</span>
                    <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-black text-sm">
                      <TrendingUp size={14} />
                      <span>+ {itemCount} units total</span>
                    </div>
                  </div>
                  <Info size={14} className="text-slate-200 group-hover:text-slate-400 transition-colors" />
                </div>

                <div className="flex justify-between items-center group cursor-help">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Supplier Verification</span>
                    <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-black text-sm">
                      <ShieldCheck size={14} className="text-blue-500" />
                      <span>{suppliers.find(s => s.id === form.watch("supplierId"))?.name || "Unselected"}</span>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-200 group-hover:text-slate-400 transition-colors" />
                </div>
              </div>

              {/* Warnings/Status Area */}
              <div className="mt-auto pt-8">
                {subtotal > 1000000 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 flex gap-3"
                  >
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                    <div className="space-y-1">
                      <div className="text-[11px] font-black text-amber-900 dark:text-amber-400 uppercase tracking-widest">High Value Alert</div>
                      <p className="text-[10px] text-amber-700 dark:text-amber-500 leading-relaxed font-medium">This procurement exceeds Le 1,000,000. Ensure all invoice documentation matches exactly.</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* STICKY FOOTER ACTION BAR */}
        <div className="p-6 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 z-10 sticky bottom-0">
          <div className="hidden md:flex items-center gap-2 text-slate-400 text-xs">
            <Info className="h-4 w-4" />
            <span>Review all item costs before finalizing record.</span>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button 
              type="button"
              variant="ghost" 
              onClick={() => setOpen(false)}
              className="h-12 px-8 font-black rounded-xl uppercase tracking-widest text-[10px] text-slate-500 hover:text-slate-950 dark:hover:text-white transition-all w-full md:w-auto"
            >
              Cancel
            </Button>
            <Button 
              type="button"
              variant="outline" 
              className="h-12 px-8 font-black rounded-xl uppercase tracking-widest text-[10px] border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all w-full md:w-auto gap-2"
            >
              <Save className="h-4 w-4"/> Save Draft
            </Button>
            <Button 
              disabled={loading || items.some(i => !i.productId)}
              onClick={form.handleSubmit(onSubmit)}
              className="h-12 px-10 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 transition-all w-full md:w-auto flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Zap className="h-4 w-4 fill-white" />
              )}
              Record Purchase
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
