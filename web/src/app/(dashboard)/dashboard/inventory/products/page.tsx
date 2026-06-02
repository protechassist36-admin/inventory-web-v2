"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, MoreVertical, Package, Search, Filter, Download, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/lib/actions/product";
import { getCategories } from "@/lib/actions/category";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { EmptyState } from "@/components/shared/empty-state";

export default function ProductsPage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    unitPrice: "",
    stockQuantity: "",
    minStockLevel: "10",
    categoryId: "",
    description: "",
    expiryDate: "",
    batchNumber: "",
    type: "PRODUCT" as "PRODUCT" | "SERVICE",
    isNetworkAvailable: false,
  });

  // Business Type Logic
  const businessType = session?.user?.businessType || "SHOP";
  const isPharmacy = businessType === "PHARMACY";
  const isBar = businessType === "BAR";

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [productsData, categoriesData] = await Promise.all([
        getProducts(),
        getCategories(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      toast.error("Cloud synchronization failed.");
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        unitPrice: parseFloat(formData.unitPrice),
        stockQuantity: formData.type === "SERVICE" ? 0 : parseInt(formData.stockQuantity),
        minStockLevel: formData.type === "SERVICE" ? 0 : parseInt(formData.minStockLevel),
        categoryId: formData.categoryId === "none" ? null : formData.categoryId,
        metadata: {
          expiryDate: isPharmacy ? formData.expiryDate : undefined,
          batchNumber: isPharmacy ? formData.batchNumber : undefined,
          isAlcoholic: isBar ? true : undefined,
        }
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
        toast.success("Inventory item updated successfully.");
      } else {
        await createProduct(data);
        toast.success("New asset added to catalog.");
      }
      setIsDialogOpen(false);
      setEditingProduct(null);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error("Operation failed. Please check permissions.");
    }
  }

  function resetForm() {
    setFormData({
      name: "",
      sku: "",
      unitPrice: "",
      stockQuantity: "",
      minStockLevel: "10",
      categoryId: "",
      description: "",
      expiryDate: "",
      batchNumber: "",
      type: "PRODUCT",
      isNetworkAvailable: false,
    });
  }

  async function handleDelete(id: string) {
    if (confirm("Permanently delete this product? This action cannot be undone.")) {
      try {
        await deleteProduct(id);
        toast.success("Product removed from inventory.");
        fetchData();
      } catch (error) {
        toast.error("Unauthorized operation.");
      }
    }
  }

  function handleEdit(product: any) {
    setEditingProduct(product);
    const metadata = (product.metadata as any) || {};
    setFormData({
      name: product.name,
      sku: product.sku || "",
      unitPrice: product.unitPrice.toString(),
      stockQuantity: product.stockQuantity.toString(),
      minStockLevel: product.minStockLevel.toString(),
      categoryId: product.categoryId || "none",
      description: product.description || "",
      expiryDate: metadata.expiryDate || "",
      batchNumber: metadata.batchNumber || "",
      type: product.type || "PRODUCT",
      isNetworkAvailable: product.isNetworkAvailable || false,
    });
    setIsDialogOpen(true);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            {isBar ? "Bar Stock Catalog" : isPharmacy ? "Pharmacy Inventory" : "Inventory Catalog"}
          </h1>
          <p className="text-slate-500 font-medium uppercase tracking-widest text-[10px]">
            {isBar ? "Manage your drinks, spirits, and bar supplies." : "Manage your product SKU, pricing, and stock levels."}
          </p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="rounded-xl border-slate-200 font-bold gap-2 h-11 px-6 text-xs uppercase tracking-widest">
              <Download className="h-4 w-4 text-primary" /> Export Vault
           </Button>
           <Dialog open={isDialogOpen} onOpenChange={(open) => {
             setIsDialogOpen(open);
             if (!open) {
               setEditingProduct(null);
               resetForm();
             }
           }}>
             <DialogTrigger render={
               <Button className="h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 font-black text-xs uppercase tracking-[0.2em] gap-2 shadow-lg shadow-primary/20">
                 <Plus className="h-4 w-4" /> New Asset
               </Button>
             } />
             <DialogContent className="sm:max-w-[600px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
               <div className="bg-slate-900 p-8 text-white">
                  <h3 className="text-2xl font-black uppercase tracking-tight">
                    {editingProduct ? "Modify Asset" : "Deploy New Asset"}
                  </h3>
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-1">Inventory Intelligence Update</p>
               </div>
               <form onSubmit={handleSubmit} className="p-8 space-y-6">
                 <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Type</Label>
                     <Select 
                       value={formData.type} 
                       onValueChange={(val: any) => setFormData({ ...formData, type: val })}
                     >
                       <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50 font-bold">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent className="rounded-xl border-slate-100">
                         <SelectItem value="PRODUCT">Physical Product</SelectItem>
                         <SelectItem value="SERVICE">Professional Service</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                   <div className="space-y-2 flex items-center justify-between p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                     <div className="space-y-0.5">
                        <Label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Network Exchange</Label>
                        <p className="text-[9px] text-indigo-500 font-bold leading-tight">Allow other businesses to source this item</p>
                     </div>
                     <input 
                       type="checkbox"
                       checked={formData.isNetworkAvailable}
                       onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, isNetworkAvailable: e.target.checked })}
                       className="h-5 w-5 rounded-lg border-indigo-200 text-indigo-600 focus:ring-indigo-500"
                     />
                   </div>
                   <div className="space-y-2 col-span-2">
                     <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Designation</Label>
                     <Input
                       value={formData.name}
                       onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                       placeholder={isBar ? "e.g. Star Beer 600ml" : "Enter designation"}
                       className="h-12 rounded-xl border-slate-100 bg-slate-50 focus:bg-white font-bold"
                       required
                     />
                   </div>
                   <div className="space-y-2">
                     <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SKU / Signature</Label>
                     <Input
                       value={formData.sku}
                       onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, sku: e.target.value })}
                       placeholder="Scan or enter ID"
                       className="h-12 rounded-xl border-slate-100 bg-slate-50 focus:bg-white font-mono text-xs"
                     />
                   </div>
                   <div className="space-y-2">
                     <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Classification</Label>
                     <Select 
                       value={formData.categoryId || ""} 
                       onValueChange={(val: string | null) => setFormData({ ...formData, categoryId: val ?? "" })}
                     >
                       <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50">
                         <SelectValue placeholder="Categorize item" />
                       </SelectTrigger>
                       <SelectContent className="rounded-xl border-slate-100">
                         <SelectItem value="none">Uncategorized</SelectItem>
                         {categories.map((c: any) => (
                           <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                   <div className="space-y-2">
                     <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       {formData.type === "SERVICE" ? "Rate per Hour/Unit (Le)" : "Market Value (Le)"}
                     </Label>
                     <Input
                       type="number"
                       step="0.01"
                       value={formData.unitPrice}
                       onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                       placeholder="0.00"
                       className="h-12 rounded-xl border-slate-100 bg-slate-50 font-black text-primary text-lg"
                       required
                     />
                   </div>
                   {formData.type === "PRODUCT" && (
                    <div className="space-y-2 animate-in slide-in-from-left-2 duration-300">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In-Stock Volume</Label>
                      <Input
                        type="number"
                        value={formData.stockQuantity}
                        onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                        placeholder="0"
                        className="h-12 rounded-xl border-slate-100 bg-slate-50 font-black"
                        required
                      />
                    </div>
                   )}
                   {isPharmacy && (
                     <>
                       <div className="space-y-2">
                         <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiration Lifecycle</Label>
                         <Input
                           type="date"
                           value={formData.expiryDate}
                           onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                           className="h-12 rounded-xl border-slate-100 bg-slate-50 font-bold"
                         />
                       </div>
                       <div className="space-y-2">
                         <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Batch Identifier</Label>
                         <Input
                           value={formData.batchNumber}
                           onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                           placeholder="B-00000"
                           className="h-12 rounded-xl border-slate-100 bg-slate-50 font-mono text-xs"
                         />
                       </div>
                     </>
                   )}
                 </div>
                 <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                   <Button type="button" variant="ghost" className="h-12 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400" onClick={() => setIsDialogOpen(false)}>
                     Abort
                   </Button>
                   <Button type="submit" className="h-12 px-10 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl">
                     {editingProduct ? "Finalize Update" : "Deploy to Vault"}
                   </Button>
                 </div>
               </form>
             </DialogContent>
           </Dialog>
        </div>
      </div>

      {/* Advanced Filtering */}
      <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm p-4 rounded-3xl">
        <div className="flex flex-col sm:flex-row gap-4">
           <div className="relative flex-1 group">
             <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
             <Input 
                placeholder="Filter by product name, SKU, or batch identifier..." 
                className="pl-10 h-10 rounded-xl border-slate-100 bg-white focus:bg-white font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
             />
           </div>
           <div className="flex gap-2">
              <Button variant="ghost" className="rounded-xl gap-2 font-black text-slate-400 uppercase text-[10px] tracking-widest h-10 px-4 hover:bg-white hover:text-primary">
                 <Filter className="h-4 w-4" /> Filter
              </Button>
              <Button variant="ghost" className="rounded-xl gap-2 font-black text-slate-400 uppercase text-[10px] tracking-widest h-10 px-4 hover:bg-white hover:text-primary">
                 <ArrowUpDown className="h-4 w-4" /> Sort
              </Button>
           </div>
        </div>
      </Card>

      <div className="rounded-[2.5rem] border-none bg-white shadow-2xl shadow-slate-200/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-slate-50 h-16">
              <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-[0.25em] pl-8">Product Intelligence</TableHead>
              <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-[0.25em]">SKU / Signature</TableHead>
              <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-[0.25em]">Classification</TableHead>
              <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-[0.25em] text-center">Stock Node</TableHead>
              <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-[0.25em]">Unit Value</TableHead>
              {isPharmacy && <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-[0.25em]">Lifecycle</TableHead>}
              <TableHead className="w-[80px] pr-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [1,2,3,4,5].map(i => (
                <TableRow key={i} className="border-slate-50 h-24">
                  <TableCell colSpan={isPharmacy ? 7 : 6} className="px-8">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 animate-shimmer relative overflow-hidden" />
                        <div className="space-y-2">
                           <div className="w-48 h-4 bg-slate-50 rounded-lg animate-shimmer relative overflow-hidden" />
                           <div className="w-32 h-2.5 bg-slate-50 rounded-lg animate-shimmer relative overflow-hidden" />
                        </div>
                     </div>
                  </TableCell>
                </TableRow>
              ))
            ) : filteredProducts.length === 0 ? (
              <TableRow className="hover:bg-transparent border-none">
                <TableCell colSpan={isPharmacy ? 7 : 6} className="p-0">
                  <EmptyState 
                    icon={Package}
                    title="No Intelligence Nodes Found"
                    description="Your inventory vault is currently empty. Initialize your first asset to begin tracking."
                    actionLabel="Deploy First Asset"
                    onAction={() => setIsDialogOpen(true)}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id} className="hover:bg-slate-50/50 border-slate-50 h-20 group transition-all duration-300">
                  <TableCell className="pl-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-inner group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-500">
                        <Package className="h-6 w-6 text-slate-400 group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-800 dark:text-white text-sm group-hover:text-primary transition-colors">{product.name}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Created: {new Date(product.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-[11px] font-black text-slate-500 dark:text-slate-400">{product.sku || "VOID"}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-tighter group-hover:bg-primary group-hover:text-white transition-all duration-500">
                      {product.category?.name || "Uncategorized"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                       <span className={cn("font-black text-sm", product.stockQuantity <= product.minStockLevel ? "text-rose-600 animate-pulse" : "text-slate-800 dark:text-white")}>
                         {product.stockQuantity}
                       </span>
                       <div className="w-12 h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden shadow-inner">
                          <div 
                            className={cn("h-full transition-all duration-1000", product.stockQuantity <= product.minStockLevel ? "bg-rose-500" : "bg-emerald-500")} 
                            style={{ width: `${Math.min((product.stockQuantity / (product.minStockLevel * 4)) * 100, 100)}%` }} 
                          />
                       </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-[1000] text-primary text-base">Le {parseFloat(product.unitPrice).toLocaleString()}</TableCell>
                  {isPharmacy && (
                    <TableCell>
                      {product.metadata && (product.metadata as any).expiryDate ? (
                        <span className={cn(
                          "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter shadow-sm",
                          new Date((product.metadata as any).expiryDate) < new Date() 
                            ? "bg-rose-50 text-rose-600 border border-rose-100" 
                            : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        )}>
                          <div className={cn("h-1.5 w-1.5 rounded-full", new Date((product.metadata as any).expiryDate) < new Date() ? "bg-rose-500 animate-pulse" : "bg-emerald-500")} />
                          {new Date((product.metadata as any).expiryDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">N/A</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell className="pr-8">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-110 transition-all">
                          <MoreVertical className="h-5 w-5 text-slate-400" />
                        </Button>
                      } />
                      <DropdownMenuContent align="end" className="w-56 rounded-[1.5rem] p-2 shadow-2xl border-slate-100 dark:border-slate-800">
                        <div className="px-3 py-2 border-b border-slate-50 dark:border-slate-800 mb-2">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Action Hub</p>
                        </div>
                        <DropdownMenuItem onClick={() => handleEdit(product)} className="font-black text-xs uppercase tracking-widest gap-3 rounded-xl">
                          <Pencil className="h-4 w-4 text-slate-400" /> Update Intelligence
                        </DropdownMenuItem>
                        <div className="h-px bg-slate-50 dark:bg-slate-800 my-2" />
                        <DropdownMenuItem 
                          className="text-rose-600 font-black text-xs uppercase tracking-widest gap-3 focus:bg-rose-50 focus:text-rose-700 rounded-xl"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4" /> Purge Asset
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
