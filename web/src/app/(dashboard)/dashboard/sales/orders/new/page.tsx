"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Plus, 
  Trash2, 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Zap, 
  ShoppingCart, 
  ShieldCheck, 
  Receipt,
  Calculator,
  Box
} from "lucide-react";
import { createSale } from "@/lib/actions/sale";
import { getProducts } from "@/lib/actions/product";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function NewSalesOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "", address: "" });
  const [taxRate, setTaxRate] = useState<number | null>(0);
  const [items, setItems] = useState<{ id?: string; name: string; quantity: number; price: number }[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [newItem, setNewItem] = useState({ productId: "", name: "", quantity: 1, price: 0 });

  useEffect(() => {
    getProducts().then(setProducts).catch(() => toast.error("Resource acquisition failed."));
  }, []);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = 0;
  const tax = taxRate ? total * taxRate : 0;
  const netAmount = total - discount;
  const amountDue = netAmount + tax;

  const addItem = () => {
    if (!newItem.productId || newItem.price <= 0) {
      toast.error("Invalid node selection or yield value.");
      return;
    }
    setItems([...items, { id: newItem.productId, name: newItem.name, quantity: newItem.quantity, price: newItem.price }]);
    setNewItem({ productId: "", name: "", quantity: 1, price: 0 });
    toast.success("Resource node added to stream.");
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast.error("Transaction stream requires at least one resource node.");
      return;
    }

    setLoading(true);
    try {
      await createSale({
        items: items.map(item => ({ 
          productId: item.id,
          productName: item.name, 
          quantity: item.quantity, 
          unitPrice: item.price, 
          total: item.price * item.quantity, 
          isExternalSourced: !item.id 
        })),
        totalAmount: amountDue,
        paymentMethod: "CASH",
        paymentStatus: "PENDING",
      });
      toast.success("Sales order protocol successfully initialized.");
      router.push("/dashboard/sales/orders");
    } catch (error) {
      toast.error("Protocol initialization failure.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 bg-slate-50 overflow-hidden relative selection:bg-indigo-600/10 selection:text-indigo-600">
      
      {/* 1. PROFESSIONAL HEADER */}
      <div className="flex justify-between items-center mb-6 md:mb-10 shrink-0">
        <div className="flex items-center gap-4 md:gap-6">
           <Link href="/dashboard/sales/orders">
              <Button variant="ghost" className="h-10 w-10 md:h-12 md:px-5 rounded-2xl hover:bg-white font-black text-[11px] uppercase tracking-[0.3em] gap-3 text-slate-400">
                 <ArrowLeft size={18} /> <span className="hidden md:inline">Back</span>
              </Button>
           </Link>
           <div className="h-10 w-px bg-slate-200 hidden md:block" />
           <div>
              <h1 className="text-xl md:text-3xl font-[1000] uppercase tracking-tighter italic text-slate-900 leading-none">Initiate <span className="text-indigo-600">Protocol</span></h1>
              <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 md:mt-2">Commercial Instance Deployment</p>
           </div>
        </div>
        <Badge className="hidden md:flex bg-indigo-50 text-indigo-600 font-black text-[10px] uppercase tracking-widest h-8 px-6 rounded-xl border border-indigo-100 shadow-sm">DRAFT</Badge>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
        
        {/* 2. FORM AREA (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto pr-0 lg:pr-4 custom-scrollbar space-y-6 pb-20">
          
          {/* Identity Hub (Customer Info) */}
          <Card className="rounded-[2rem] border-none shadow-sm bg-white p-6 md:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full translate-x-1/2 -translate-y-1/2" />
            <div className="flex items-center gap-4 mb-6 border-b border-slate-50 pb-4">
               <User className="text-indigo-600" size={20} />
               <h2 className="text-lg font-black uppercase tracking-widest italic text-slate-900">Identity <span className="text-indigo-600">Hub</span></h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Entity Name</Label>
                <div className="relative">
                   <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                   <Input 
                      placeholder="Customer"
                      className="h-12 pl-12 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white font-bold"
                      value={customer.name} 
                      onChange={e => setCustomer({...customer, name: e.target.value})} 
                   />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Email</Label>
                <div className="relative">
                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                   <Input 
                      placeholder="Email"
                      className="h-12 pl-12 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white font-bold"
                      value={customer.email} 
                      onChange={e => setCustomer({...customer, email: e.target.value})} 
                   />
                </div>
              </div>
            </div>
          </Card>

          {/* Resource Itemization Area */}
          <Card className="rounded-[2rem] border-none shadow-sm bg-white p-6 md:p-10 overflow-visible">
            <div className="flex items-center gap-4 mb-6 border-b border-slate-50 pb-4">
               <Box className="text-indigo-600" size={20} />
               <h2 className="text-lg font-black uppercase tracking-widest italic text-slate-900">Itemization <span className="text-indigo-600">Nodes</span></h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end mb-8">
               <div className="md:col-span-5 space-y-1">
                 <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Asset</Label>
                 <Select onValueChange={(val: string | null) => {
                    if (!val) return;
                    const prod = products.find(p => p.id === val);
                    if (prod) {
                      setNewItem({ productId: prod.id, name: prod.name, quantity: 1, price: prod.unitPrice });
                    }
                  }}>
                    <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50 font-black uppercase text-[10px] tracking-widest text-slate-900">
                      <SelectValue placeholder="Select Asset..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {products.map((p: any) => <SelectItem key={p.id} value={p.id} className="font-bold uppercase text-[10px]">{p.name}</SelectItem>)}
                    </SelectContent>
                 </Select>
               </div>
               <div className="md:col-span-2 space-y-1">
                 <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Vol</Label>
                 <Input 
                   type="number" 
                   className="h-12 rounded-xl border-slate-100 bg-slate-50 text-center font-[1000] italic" 
                   value={newItem.quantity} 
                   onChange={e => setNewItem({...newItem, quantity: parseInt(e.target.value) || 0})} 
                 />
               </div>
               <div className="md:col-span-3 space-y-1">
                 <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Price</Label>
                 <Input 
                    type="number" 
                    className="h-12 rounded-xl border-slate-100 bg-slate-50 font-black text-indigo-600" 
                    value={newItem.price} 
                    onChange={e => setNewItem({...newItem, price: parseFloat(e.target.value) || 0})} 
                 />
               </div>
               <div className="md:col-span-2">
                  <Button 
                     onClick={addItem} 
                     className="h-12 w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                  >
                     <Plus size={20} />
                  </Button>
               </div>
            </div>

            <div className="space-y-4">
              {items.map((item, i) => (
                      <motion.div 
                        key={i} 
                        className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-xl group hover:bg-white hover:shadow-lg transition-all"
                      >
                         <div>
                               <div className="font-black text-slate-900 uppercase text-xs tracking-tight">{item.name}</div>
                               <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 italic">{item.quantity} x {item.price.toLocaleString()}</div>
                         </div>
                         <div className="flex items-center gap-4">
                            <div className="text-sm font-[1000] text-slate-950 italic">{(item.price * item.quantity).toLocaleString()}</div>
                            <Button variant="ghost" size="icon" onClick={() => removeItem(i)} className="h-8 w-8 text-rose-300 hover:text-rose-600">
                               <Trash2 size={16} />
                            </Button>
                         </div>
                      </motion.div>
                    ))}
            </div>
          </Card>
        </div>

        {/* 3. ORDER LEDGER SIDEBAR (350px desktop) */}
        <div className="w-full lg:w-[350px] shrink-0">
           <Card className="rounded-[2rem] border-none shadow-xl bg-slate-950 text-white p-6 md:p-8 h-auto lg:h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                 <Receipt className="h-5 w-5 text-indigo-400" />
                 <h2 className="text-sm font-black uppercase tracking-widest text-indigo-400">Ledger</h2>
              </div>

              <div className="space-y-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                 <div className="flex justify-between"><span>Subtotal</span><span className="text-white">Le {total.toLocaleString()}</span></div>
                 <div className="flex justify-between"><span>Tax</span><span className="text-indigo-400">Le {tax.toLocaleString()}</span></div>
                 <div className="border-t border-white/10 pt-4 mt-4">
                    <div className="flex justify-between text-white text-lg font-[1000] italic"><span>Total</span><span>Le {amountDue.toLocaleString()}</span></div>
                 </div>
              </div>

              <div className="mt-8">
                 <Button 
                    disabled={loading || items.length === 0}
                    onClick={handleSubmit}
                    className="w-full h-14 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl transition-all"
                 >
                    {loading ? "Processing..." : "Execute Order"}
                 </Button>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}
