"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, MoreVertical, Search, Phone, Mail, MapPin, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "sonner";
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "@/lib/actions/supplier";
import { cn } from "@/lib/utils";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    contact: "",
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  async function fetchSuppliers() {
    try {
      setLoading(true);
      const data = await getSuppliers();
      setSuppliers(data);
    } catch (error) {
      toast.error("Failed to load supplier database.");
    } finally {
      setLoading(false);
    }
  }

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.phone && s.phone.includes(searchQuery)) ||
    (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, formData);
        toast.success("Supplier profile updated.");
      } else {
        await createSupplier(formData);
        toast.success("New supplier registered.");
      }
      setIsDialogOpen(false);
      setEditingSupplier(null);
      resetForm();
      fetchSuppliers();
    } catch (error) {
      toast.error("Failed to save supplier details.");
    }
  }

  function resetForm() {
    setFormData({
      name: "",
      email: "",
      phone: "",
      contact: "",
    });
  }

  async function handleDelete(id: string) {
    if (confirm("Delete this supplier record permanently?")) {
      try {
        await deleteSupplier(id);
        toast.success("Supplier record removed.");
        fetchSuppliers();
      } catch (error) {
        toast.error("Operation failed.");
      }
    }
  }

  function handleEdit(supplier: any) {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      email: supplier.email || "",
      phone: supplier.phone || "",
      contact: supplier.contact || "",
    });
    setIsDialogOpen(true);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 font-[1000]">Supplier Network</h1>
          <p className="text-slate-500 font-medium">Manage your vendors and supply chain partners.</p>
        </div>
        <div className="flex items-center gap-3">
           <Dialog open={isDialogOpen} onOpenChange={(open) => {
             setIsDialogOpen(open);
             if (!open) {
               setEditingSupplier(null);
               resetForm();
             }
           }}>
             <DialogTrigger render={
               <Button className="rounded-xl bg-primary hover:bg-primary/90 font-bold gap-2 shadow-lg shadow-primary/20">
                 <Plus className="h-4 w-4" /> Register Supplier
               </Button>
             } />
             <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl">
               <DialogHeader>
                 <DialogTitle className="text-2xl font-black">
                   {editingSupplier ? "Edit Vendor" : "New Supplier Registration"}
                 </DialogTitle>
               </DialogHeader>
               <form onSubmit={handleSubmit} className="space-y-6 pt-6">
                 <div className="space-y-4">
                   <div className="space-y-2">
                     <Label className="font-bold text-slate-700">Business Name</Label>
                     <Input
                       value={formData.name}
                       onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                       placeholder="e.g. Acme Wholesale"
                       className="h-12 rounded-xl border-slate-100 bg-slate-50 focus:bg-white"
                       required
                     />
                   </div>
                   <div className="space-y-2">
                     <Label className="font-bold text-slate-700">Contact Person</Label>
                     <Input
                       value={formData.contact}
                       onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                       placeholder="e.g. John Doe"
                       className="h-12 rounded-xl border-slate-100 bg-slate-50 focus:bg-white"
                     />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label className="font-bold text-slate-700">Phone Number</Label>
                       <Input
                         value={formData.phone}
                         onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                         placeholder="+232..."
                         className="h-12 rounded-xl border-slate-100 bg-slate-50"
                       />
                     </div>
                     <div className="space-y-2">
                       <Label className="font-bold text-slate-700">Email Address</Label>
                       <Input
                         type="email"
                         value={formData.email}
                         onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                         placeholder="sales@vendor.com"
                         className="h-12 rounded-xl border-slate-100 bg-slate-50"
                       />
                     </div>
                   </div>
                 </div>
                 <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
                   <Button type="button" variant="ghost" className="font-bold text-slate-500" onClick={() => setIsDialogOpen(false)}>
                     Cancel
                   </Button>
                   <Button type="submit" className="px-8 bg-slate-900 text-white rounded-xl font-bold">
                     {editingSupplier ? "Update Vendor" : "Confirm Registration"}
                   </Button>
                 </div>
               </form>
             </DialogContent>
           </Dialog>
        </div>
      </div>

      {/* Advanced Filtering */}
      <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm p-4 rounded-3xl">
        <div className="relative group">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search by vendor name, phone, or email..." 
            className="pl-10 h-10 rounded-xl border-slate-100 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </Card>

      <div className="rounded-[2rem] border-none bg-white shadow-xl shadow-slate-100/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-slate-50">
              <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest pl-6">Vendor Identity</TableHead>
              <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Contact Details</TableHead>
              <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest text-center">Engagement</TableHead>
              <TableHead className="w-[80px] pr-6"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [1,2,3].map(i => (
                <TableRow key={i} className="border-slate-50">
                  <TableCell colSpan={4} className="h-20 animate-pulse bg-slate-50/50 first:rounded-l-[2rem] last:rounded-r-[2rem]" />
                </TableRow>
              ))
            ) : filteredSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-slate-400 font-bold italic">
                  No suppliers found in the network.
                </TableCell>
              </TableRow>
            ) : (
              filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id} className="hover:bg-slate-50/50 border-slate-50 group transition-colors">
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black group-hover:scale-110 transition-transform">
                        <Truck className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-800 text-sm">{supplier.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Registered: {new Date(supplier.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="text-xs font-bold text-slate-800">{supplier.contact || "No primary contact"}</div>
                      <div className="flex items-center gap-3">
                        {supplier.phone && <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><Phone className="h-3 w-3" /> {supplier.phone}</div>}
                        {supplier.email && <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><Mail className="h-3 w-3" /> {supplier.email}</div>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-tighter">
                      Trusted Vendor
                    </span>
                  </TableCell>
                  <TableCell className="pr-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100">
                          <MoreVertical className="h-4 w-4 text-slate-400" />
                        </Button>
                      } />
                      <DropdownMenuContent align="end" className="rounded-xl border-slate-100 shadow-xl">
                        <DropdownMenuItem onClick={() => handleEdit(supplier)} className="font-bold gap-2">
                          <Pencil className="h-3.5 w-3.5" /> Edit Vendor
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-rose-600 font-bold gap-2 focus:bg-rose-50 focus:text-rose-700"
                          onClick={() => handleDelete(supplier.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove Partner
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
