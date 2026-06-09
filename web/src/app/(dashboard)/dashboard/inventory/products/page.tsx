"use client";

import { useState, useEffect } from "react";
import { Plus, Minus, Pencil, Trash2, MoreVertical, Package, Search, Filter, Download, ArrowUpDown } from "lucide-react";
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
import { ImageUploader } from "@/components/ui/image-uploader";
import { uploadProductImage } from "@/lib/actions/upload";
import Image from "next/image";
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
import { TouchWrapper } from "@/components/layout/TouchWrapper";
import { ResponsiveTable } from "@/components/shared/responsive-table";

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
    costPrice: "",
    stockQuantity: "",
    minStockLevel: "10",
    categoryId: "",
    description: "",
    expiryDate: "",
    batchNumber: "",
    type: "PRODUCT" as "PRODUCT" | "SERVICE",
    isNetworkAvailable: false,
    imageUrl: "",
    baseUnit: "Piece",
    units: [] as any[]
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
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : 0,
        stockQuantity: formData.type === "SERVICE" ? 0 : parseInt(formData.stockQuantity),
        minStockLevel: formData.type === "SERVICE" ? 0 : parseInt(formData.minStockLevel),
        categoryId: formData.categoryId === "none" ? null : formData.categoryId,
        metadata: {
          expiryDate: isPharmacy ? formData.expiryDate : undefined,
          batchNumber: isPharmacy ? formData.batchNumber : undefined,
          isAlcoholic: isBar ? true : undefined,
        },
        units: formData.units.map(u => ({
          ...u,
          ratio: parseInt(u.ratio),
          sellingPrice: parseFloat(u.sellingPrice),
          costPrice: u.costPrice ? parseFloat(u.costPrice) : 0
        }))
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
      costPrice: "",
      stockQuantity: "",
      minStockLevel: "10",
      categoryId: "",
      description: "",
      expiryDate: "",
      batchNumber: "",
      type: "PRODUCT",
      isNetworkAvailable: false,
      imageUrl: "",
      baseUnit: "Piece",
      units: []
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
      costPrice: product.costPrice?.toString() || "",
      stockQuantity: product.stockQuantity.toString(),
      minStockLevel: product.minStockLevel.toString(),
      categoryId: product.categoryId || "none",
      description: product.description || "",
      expiryDate: metadata.expiryDate || "",
      batchNumber: metadata.batchNumber || "",
      type: product.type || "PRODUCT",
      isNetworkAvailable: product.isNetworkAvailable || false,
      imageUrl: product.imageUrl || "",
      baseUnit: product.baseUnit || "Piece",
      units: product.units || []
    });
    setIsDialogOpen(true);
  }

  const addUnit = () => {
    setFormData({
      ...formData,
      units: [
        ...formData.units,
        { name: "", ratio: "1", sellingPrice: formData.unitPrice, costPrice: formData.costPrice, barcode: "" }
      ]
    });
  };

  const removeUnit = (index: number) => {
    const newUnits = [...formData.units];
    newUnits.splice(index, 1);
    setFormData({ ...formData, units: newUnits });
  };

  const updateUnit = (index: number, field: string, value: string) => {
    const newUnits = [...formData.units];
    newUnits[index] = { ...newUnits[index], [field]: value };
    setFormData({ ...formData, units: newUnits });
  };

  const columns = [
    {
      header: "Product Intelligence",
      isMain: true,
      accessor: (product: any) => (
        <div className="flex items-center gap-4">
          <div className="relative w-10 sm:w-12 h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-inner group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-500 overflow-hidden">
            {product.imageUrl ? (
              <Image 
                src={product.imageUrl} 
                alt={product.name} 
                fill 
                className="object-cover"
                unoptimized 
              />
            ) : (
              <Package className="h-5 sm:h-6 w-5 sm:w-6 text-slate-400 group-hover:text-primary transition-colors" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-black text-slate-800 dark:text-white text-xs sm:text-sm group-hover:text-primary transition-colors line-clamp-1">{product.name}</span>
            <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">ID: {product.sku || "N/A"}</span>
          </div>
        </div>
      )
    },
    {
      header: "SKU / Signature",
      isMeta: true,
      isHiddenMobile: true,
      accessor: (product: any) => <span className="font-mono text-[11px] font-black text-slate-500 dark:text-slate-400">{product.sku || "VOID"}</span>
    },
    {
      header: "Classification",
      isMeta: true,
      accessor: (product: any) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9px] font-black uppercase tracking-tighter group-hover:bg-primary group-hover:text-white transition-all duration-500">
          {product.category?.name || "Uncategorized"}
        </span>
      )
    },
    {
      header: "Stock Node",
      accessor: (product: any) => (
        <div className="flex flex-col items-center lg:items-start">
           <span className={cn("font-black text-sm", product.stockQuantity <= product.minStockLevel ? "text-rose-600 animate-pulse" : "text-slate-800 dark:text-white")}>
             {product.stockQuantity}
           </span>
           <div className="w-12 h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden shadow-inner hidden lg:block">
              <div 
                className={cn("h-full transition-all duration-1000", product.stockQuantity <= product.minStockLevel ? "bg-rose-500" : "bg-emerald-500")} 
                style={{ width: `${Math.min((product.stockQuantity / (product.minStockLevel * 4)) * 100, 100)}%` }} 
              />
           </div>
        </div>
      )
    },
    {
      header: "Unit Value",
      accessor: (product: any) => <span className="font-[1000] text-primary text-sm sm:text-base">Le {Math.round(parseFloat(product.unitPrice)).toLocaleString()}</span>
    },
    ...(isPharmacy ? [{
      header: "Lifecycle",
      accessor: (product: any) => {
        const metadata = (product.metadata as any) || {};
        return metadata.expiryDate ? (
          <span className={cn(
            "inline-flex items-center gap-2 px-2 py-1 rounded-xl text-[9px] font-black uppercase tracking-tighter shadow-sm",
            new Date(metadata.expiryDate) < new Date() 
              ? "bg-rose-50 text-rose-600 border border-rose-100" 
              : "bg-emerald-50 text-emerald-600 border border-emerald-100"
          )}>
            <div className={cn("h-1.5 w-1.5 rounded-full", new Date(metadata.expiryDate) < new Date() ? "bg-rose-500 animate-pulse" : "bg-emerald-500")} />
            {new Date(metadata.expiryDate).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">N/A</span>
        );
      }
    }] : [])
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700 pb-12">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">
            {isBar ? "Bar Stock" : isPharmacy ? "Pharmacy" : "Inventory"} <span className="text-primary">Catalog</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">
            {isBar ? "Manage your drinks, spirits, and bar supplies." : "Manage your product SKU, pricing, and stock levels."}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
           <Button variant="outline" className="rounded-2xl border-slate-200 dark:border-slate-800 font-black gap-2 h-14 px-8 text-[10px] uppercase tracking-widest hover:bg-white dark:hover:bg-slate-900 transition-all">
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
               <Button className="h-14 px-10 rounded-2xl bg-primary hover:bg-primary/90 font-black text-[10px] uppercase tracking-[0.2em] gap-2 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]">
                 <Plus className="h-4 w-4" /> New Asset
               </Button>
             } />
             <DialogContent className="sm:max-w-[700px] w-[95vw] sm:w-full rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col bg-white">
               <div className="bg-slate-900 p-6 sm:p-8 text-white shrink-0">
                  <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
                    {editingProduct ? "Modify Asset" : "Deploy New Asset"}
                  </h3>
                  <p className="text-slate-400 font-bold text-[9px] sm:text-[10px] uppercase tracking-[0.3em] mt-1">Inventory Intelligence Update</p>
               </div>
               <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden bg-white">
                 <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
                       <div className="space-y-0.5 pr-2">
                          <Label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Network Exchange</Label>
                          <p className="text-[9px] text-indigo-500 font-bold leading-tight">Sourcing availability</p>
                       </div>
                       <input 
                         type="checkbox"
                         checked={formData.isNetworkAvailable}
                         onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, isNetworkAvailable: e.target.checked })}
                         className="h-6 w-6 rounded-lg border-indigo-200 text-indigo-600 focus:ring-indigo-500"
                       />
                     </div>
                     <div className="space-y-2 sm:col-span-2">
                       <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Imagery</Label>
                       <ImageUploader 
                         value={formData.imageUrl} 
                         onChange={(url) => setFormData({...formData, imageUrl: url})} 
                         uploadAction={uploadProductImage}
                       />
                     </div>
                     <div className="space-y-2 sm:col-span-2">
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
                       <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cost (Le)</Label>
                       <Input
                         type="number"
                         step="0.01"
                         value={formData.costPrice}
                         onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                         placeholder="0.00"
                         className="h-12 rounded-xl border-slate-100 bg-slate-50 font-black text-rose-600 text-lg"
                         required
                       />
                     </div>
                     <div className="space-y-2">
                       <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selling (Le)</Label>
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

                     {/* Unit System Section */}
                     <div className="sm:col-span-2 space-y-4 pt-4 border-t border-slate-50">
                        <div className="flex items-center justify-between">
                           <div>
                              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit System</Label>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Define how you sell this item</p>
                           </div>
                           <Button 
                              type="button" 
                              variant="outline" 
                              onClick={addUnit}
                              className="h-9 px-4 rounded-xl border-primary/20 text-primary font-black text-[9px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                           >
                              <Plus className="h-3 w-3 mr-2" /> Add Conversion
                           </Button>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                              <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center border border-slate-100 shadow-sm shrink-0">
                                 <Package className="h-5 w-5 text-slate-400" />
                              </div>
                              <div className="flex-1 space-y-1">
                                 <Label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Base Unit (Reference)</Label>
                                 <Select 
                                    value={formData.baseUnit} 
                                    onValueChange={(val) => setFormData({ ...formData, baseUnit: val })}
                                 >
                                    <SelectTrigger className="h-10 rounded-xl border-none bg-transparent font-black p-0 focus:ring-0">
                                       <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-100">
                                       <SelectItem value="Piece">Piece / Single</SelectItem>
                                       <SelectItem value="Kg">Kilogram (kg)</SelectItem>
                                       <SelectItem value="Litre">Litre (L)</SelectItem>
                                       <SelectItem value="Meter">Meter (m)</SelectItem>
                                       <SelectItem value="Box">Box / Carton</SelectItem>
                                    </SelectContent>
                                 </Select>
                              </div>
                              <div className="text-right pr-2">
                                 <span className="text-[10px] font-black text-slate-300 uppercase italic">Ratio: 1</span>
                              </div>
                           </div>

                           {formData.units.map((unit, index) => (
                              <motion.div 
                                 initial={{ opacity: 0, x: -20 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 key={index}
                                 className="p-5 bg-white rounded-3xl border-2 border-slate-50 shadow-sm space-y-4 relative group"
                              >
                                 <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => removeUnit(index)}
                                    className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                 >
                                    <Trash2 className="h-4 w-4" />
                                 </Button>

                                 <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                       <Label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Unit Name</Label>
                                       <Input 
                                          value={unit.name}
                                          onChange={(e) => updateUnit(index, "name", e.target.value)}
                                          placeholder="e.g. Crate"
                                          className="h-10 rounded-xl border-slate-50 bg-slate-50/50 font-bold text-xs"
                                       />
                                    </div>
                                    <div className="space-y-2">
                                       <Label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Ratio to {formData.baseUnit}</Label>
                                       <Input 
                                          type="number"
                                          value={unit.ratio}
                                          onChange={(e) => updateUnit(index, "ratio", e.target.value)}
                                          placeholder="1"
                                          className="h-10 rounded-xl border-slate-50 bg-slate-50/50 font-black text-xs"
                                       />
                                    </div>
                                    <div className="space-y-2">
                                       <Label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Selling Price (Le)</Label>
                                       <Input 
                                          type="number"
                                          value={unit.sellingPrice}
                                          onChange={(e) => updateUnit(index, "sellingPrice", e.target.value)}
                                          placeholder="0.00"
                                          className="h-10 rounded-xl border-slate-50 bg-slate-50/50 font-black text-xs text-primary"
                                       />
                                    </div>
                                    <div className="space-y-2">
                                       <Label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Barcode / SKU</Label>
                                       <Input 
                                          value={unit.barcode}
                                          onChange={(e) => updateUnit(index, "barcode", e.target.value)}
                                          placeholder="Optional"
                                          className="h-10 rounded-xl border-slate-50 bg-slate-50/50 font-mono text-[10px]"
                                       />
                                    </div>
                                 </div>
                              </motion.div>
                           ))}
                        </div>
                     </div>

                     {formData.type === "PRODUCT" && (
                      <div className="space-y-2 animate-in slide-in-from-left-2 duration-300">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In-Stock Volume</Label>
                        <div className="flex items-center gap-2">
                           <Button 
                              type="button" 
                              variant="outline" 
                              className="h-12 w-12 rounded-xl border-slate-100 bg-slate-100 hover:bg-slate-200"
                              onClick={() => setFormData({ ...formData, stockQuantity: Math.max(0, parseInt(formData.stockQuantity || "0") - 1).toString() })}
                           >
                              <Minus size={20} />
                           </Button>
                           <Input
                             type="number"
                             value={formData.stockQuantity}
                             onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                             placeholder="0"
                             className="h-12 rounded-xl border-slate-100 bg-slate-50 font-black text-center"
                             required
                           />
                           <Button 
                              type="button" 
                              variant="outline" 
                              className="h-12 w-12 rounded-xl border-slate-100 bg-slate-100 hover:bg-slate-200"
                              onClick={() => setFormData({ ...formData, stockQuantity: (parseInt(formData.stockQuantity || "0") + 1).toString() })}
                           >
                              <Plus size={20} />
                           </Button>
                        </div>
                      </div>
                     )}
                     {isPharmacy && (
                       <>
                         <div className="space-y-2">
                           <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiry</Label>
                           <Input
                             type="date"
                             value={formData.expiryDate}
                             onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                             className="h-12 rounded-xl border-slate-100 bg-slate-50 font-bold"
                           />
                         </div>
                         <div className="space-y-2">
                           <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Batch ID</Label>
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
                 </div>
                 <div className="flex flex-col sm:flex-row justify-end gap-3 p-6 sm:p-8 border-t border-slate-100 shrink-0 bg-slate-50/50">
                   <Button type="button" variant="ghost" className="h-12 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400 order-2 sm:order-1" onClick={() => setIsDialogOpen(false)}>
                     Abort
                   </Button>
                   <Button type="submit" className="h-12 px-10 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:shadow-2xl active:scale-95 transition-all order-1 sm:order-2">
                     {editingProduct ? "Finalize Update" : "Deploy to Vault"}
                   </Button>
                 </div>
               </form>
             </DialogContent>
           </Dialog>
        </div>
      </div>

      {/* Advanced Filtering */}
      <Card className="border-none shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-4 sm:p-6 rounded-2xl sm:rounded-[2rem]">
        <div className="flex flex-col md:flex-row gap-4">
           <div className="relative flex-1 group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
             <Input 
                placeholder="Filter by product name, SKU, or batch identifier..." 
                className="pl-12 h-12 rounded-2xl border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 focus:bg-white font-bold text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
             />
           </div>
           <div className="flex gap-2 shrink-0">
              <Button variant="ghost" className="rounded-2xl gap-2 font-black text-slate-400 uppercase text-[10px] tracking-widest h-12 px-6 hover:bg-white dark:hover:bg-slate-800 hover:text-primary">
                 <Filter className="h-4 w-4" /> Filter
              </Button>
              <Button variant="ghost" className="rounded-2xl gap-2 font-black text-slate-400 uppercase text-[10px] tracking-widest h-12 px-6 hover:bg-white dark:hover:bg-slate-800 hover:text-primary">
                 <ArrowUpDown className="h-4 w-4" /> Sort
              </Button>
           </div>
        </div>
      </Card>

      <ResponsiveTable 
        data={filteredProducts}
        columns={columns}
        loading={loading}
        onRowClick={handleEdit}
        emptyState={
          <EmptyState 
            icon={Package}
            title="No Intelligence Nodes Found"
            description="Your inventory vault is currently empty. Initialize your first asset to begin tracking."
            actionLabel="Deploy First Asset"
            onAction={() => setIsDialogOpen(true)}
          />
        }
        actions={(product) => (
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                <MoreVertical className="h-5 w-5 text-slate-400" />
              </Button>
            } />
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-slate-100 dark:border-slate-800">
              <div className="px-3 py-2 border-b border-slate-50 dark:border-slate-800 mb-2">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Action Hub</p>
              </div>
              <DropdownMenuItem onClick={() => handleEdit(product)} className="font-black text-[10px] uppercase tracking-widest gap-3 rounded-xl">
                <Pencil className="h-4 w-4 text-slate-400" /> Update Intelligence
              </DropdownMenuItem>
              <div className="h-px bg-slate-50 dark:bg-slate-800 my-2" />
              <DropdownMenuItem 
                className="text-rose-600 font-black text-[10px] uppercase tracking-widest gap-3 focus:bg-rose-50 focus:text-rose-700 rounded-xl"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(product.id);
                }}
              >
                <Trash2 className="h-4 w-4" /> Purge Asset
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />
    </div>
  );
}
