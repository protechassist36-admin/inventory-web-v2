"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, MoreVertical, Users, Search, Phone, Mail, MapPin } from "lucide-react";
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
import { toast } from "sonner";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "@/lib/actions/customer";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    try {
      setLoading(true);
      const data = await getCustomers();
      setCustomers(data);
    } catch (error) {
      toast.error("Failed to load customer database.");
    } finally {
      setLoading(false);
    }
  }

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.phone && c.phone.includes(searchQuery)) ||
    (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, formData);
        toast.success("Customer profile updated.");
      } else {
        await createCustomer(formData);
        toast.success("New customer registered.");
      }
      setIsDialogOpen(false);
      setEditingCustomer(null);
      resetForm();
      fetchCustomers();
    } catch (error) {
      toast.error("Failed to save customer details.");
    }
  }

  function resetForm() {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
    });
  }

  async function handleDelete(id: string) {
    if (confirm("Delete this customer record permanently?")) {
      try {
        await deleteCustomer(id);
        toast.success("Customer record removed.");
        fetchCustomers();
      } catch (error) {
        toast.error("Operation failed.");
      }
    }
  }

  function handleEdit(customer: any) {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
    });
    setIsDialogOpen(true);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 font-[1000]">Customer Relations</h1>
          <p className="text-slate-500 font-medium">Manage your client database and purchase history.</p>
        </div>
        <div className="flex items-center gap-3">
           <Dialog open={isDialogOpen} onOpenChange={(open) => {
             setIsDialogOpen(open);
             if (!open) {
               setEditingCustomer(null);
               resetForm();
             }
           }}>
             <DialogTrigger render={
               <Button className="rounded-xl bg-primary hover:bg-primary/90 font-bold gap-2 shadow-lg shadow-primary/20">
                 <Plus className="h-4 w-4" /> Register Customer
               </Button>
             } />
             <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl">
               <DialogHeader>
                 <DialogTitle className="text-2xl font-black">
                   {editingCustomer ? "Edit Profile" : "New Customer Registration"}
                 </DialogTitle>
               </DialogHeader>
               <form onSubmit={handleSubmit} className="space-y-6 pt-6">
                 <div className="space-y-4">
                   <div className="space-y-2">
                     <Label className="font-bold text-slate-700">Full Name</Label>
                     <Input
                       value={formData.name}
                       onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                       placeholder="e.g. John Doe"
                       className="h-12 rounded-xl border-slate-100 bg-slate-50 focus:bg-white"
                       required
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
                         placeholder="john@example.com"
                         className="h-12 rounded-xl border-slate-100 bg-slate-50"
                       />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <Label className="font-bold text-slate-700">Physical Address</Label>
                     <Input
                       value={formData.address}
                       onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                       placeholder="Freetown, Sierra Leone"
                       className="h-12 rounded-xl border-slate-100 bg-slate-50"
                     />
                   </div>
                 </div>
                 <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
                   <Button type="button" variant="ghost" className="font-bold text-slate-500" onClick={() => setIsDialogOpen(false)}>
                     Cancel
                   </Button>
                   <Button type="submit" className="px-8 bg-slate-900 text-white rounded-xl font-bold">
                     {editingCustomer ? "Update Profile" : "Confirm Registration"}
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
            placeholder="Search by name, phone, or email..." 
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
              <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest pl-6">Client Identity</TableHead>
              <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Contact Intel</TableHead>
              <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Location</TableHead>
              <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest text-center">Status</TableHead>
              <TableHead className="w-[80px] pr-6"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [1,2,3].map(i => (
                <TableRow key={i} className="border-slate-50">
                  <TableCell colSpan={5} className="h-20 animate-pulse bg-slate-50/50 first:rounded-l-[2rem] last:rounded-r-[2rem]" />
                </TableRow>
              ))
            ) : filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-400 font-bold italic">
                  No clients found in the database.
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-slate-50/50 border-slate-50 group transition-colors">
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black group-hover:scale-110 transition-transform">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-800 text-sm">{customer.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Joined: {new Date(customer.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {customer.phone && <div className="text-xs font-bold text-slate-600 flex items-center gap-1.5"><Phone className="h-3 w-3" /> {customer.phone}</div>}
                      {customer.email && <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5"><Mail className="h-3 w-3" /> {customer.email}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-slate-300" />
                      {customer.address || "Not Provided"}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-tighter">
                      Active
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
                        <DropdownMenuItem onClick={() => handleEdit(customer)} className="font-bold gap-2">
                          <Pencil className="h-3.5 w-3.5" /> Edit Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-rose-600 font-bold gap-2 focus:bg-rose-50 focus:text-rose-700"
                          onClick={() => handleDelete(customer.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove Client
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
