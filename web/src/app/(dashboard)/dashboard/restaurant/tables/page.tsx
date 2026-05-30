"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, MoreVertical, LayoutGrid, Users, History, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  getTables,
  createTable,
  updateTable,
  deleteTable,
} from "@/lib/actions/restaurant";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function TablesPage() {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    capacity: "4",
  });

  useEffect(() => {
    fetchTables();
  }, []);

  async function fetchTables() {
    try {
      setLoading(true);
      const data = await getTables();
      setTables(data);
    } catch (error) {
      toast.error("Failed to load floor plan.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const data = {
        name: formData.name,
        capacity: parseInt(formData.capacity),
      };

      if (editingTable) {
        await updateTable(editingTable.id, data);
        toast.success("Table configuration updated.");
      } else {
        await createTable(data);
        toast.success("New table added to floor plan.");
      }
      setIsDialogOpen(false);
      setEditingTable(null);
      setFormData({ name: "", capacity: "4" });
      fetchTables();
    } catch (error) {
      toast.error("Operation failed.");
    }
  }

  async function handleDelete(id: string) {
    if (confirm("Remove this table permanently?")) {
      try {
        await deleteTable(id);
        toast.success("Table removed.");
        fetchTables();
      } catch (error) {
        toast.error("Access denied.");
      }
    }
  }

  function handleEdit(table: any) {
    setEditingTable(table);
    setFormData({
      name: table.name,
      capacity: table.capacity.toString(),
    });
    setIsDialogOpen(true);
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Floor Management</h1>
          <p className="text-slate-500 font-medium">Real-time status of your dining area and guest flow.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl border-slate-200 font-bold gap-2">
             <History className="h-4 w-4" /> Timeline
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingTable(null);
              setFormData({ name: "", capacity: "4" });
            }
          }}>
            <DialogTrigger render={
              <Button className="rounded-xl bg-primary hover:bg-primary/90 font-bold gap-2 shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4" /> Add Table
              </Button>
            } />
            <DialogContent className="rounded-[2rem] border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">
                  {editingTable ? "Edit Table" : "Configure New Table"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Table Identity</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Terrace 01, VIP-A"
                    className="h-12 rounded-xl border-slate-100 bg-slate-50 focus:bg-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Guest Capacity</Label>
                  <Input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="4"
                    className="h-12 rounded-xl border-slate-100 bg-slate-50"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
                  <Button type="button" variant="ghost" className="font-bold text-slate-500" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="px-8 bg-slate-900 text-white rounded-xl font-bold">
                    {editingTable ? "Update Plan" : "Confirm Layout"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         {[
           { label: "Available", value: tables.filter(t => t.status === 'available').length, color: "text-emerald-600", bg: "bg-emerald-50" },
           { label: "Occupied", value: tables.filter(t => t.status === 'occupied').length, color: "text-primary", bg: "bg-primary/5" },
           { label: "Reserved", value: 0, color: "text-orange-600", bg: "bg-orange-50" },
           { label: "Guest Total", value: tables.reduce((acc, t) => acc + (t.status === 'occupied' ? t.capacity : 0), 0), color: "text-slate-600", bg: "bg-slate-50" },
         ].map((stat, i) => (
           <div key={i} className="p-4 rounded-3xl bg-white border border-slate-50 shadow-sm flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</span>
              <span className={cn("text-2xl font-black", stat.color)}>{stat.value}</span>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {loading ? (
          [1,2,3,4,5,6].map(i => <div key={i} className="aspect-square bg-slate-50 animate-pulse rounded-[2.5rem]" />)
        ) : tables.length === 0 ? (
          <div className="col-span-full text-center py-24 text-slate-400 font-bold italic">The floor plan is currently empty. Add a table to begin.</div>
        ) : (
          tables.map((table) => (
            <motion.div 
              whileHover={{ scale: 1.05 }}
              key={table.id}
            >
              <Card className={cn(
                "group relative border-none shadow-sm hover:shadow-xl transition-all rounded-[2.5rem] overflow-hidden",
                table.status === 'occupied' ? 'bg-primary text-white ring-4 ring-primary/10' : 'bg-white text-slate-900'
              )}>
                <CardContent className="p-8 flex flex-col items-center text-center h-full">
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="ghost" className={cn("h-8 w-8 p-0 rounded-xl", table.status === 'occupied' ? 'hover:bg-white/10' : 'hover:bg-slate-100')}>
                          <MoreVertical className={cn("h-4 w-4", table.status === 'occupied' ? 'text-white' : 'text-slate-400')} />
                        </Button>
                      } />
                      <DropdownMenuContent align="end" className="rounded-xl border-none shadow-2xl">
                        <DropdownMenuItem onClick={() => handleEdit(table)} className="font-bold gap-2">
                          <Pencil className="h-3.5 w-3.5" /> Reconfigure
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-rose-600 font-bold gap-2" onClick={() => handleDelete(table.id)}>
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className={cn(
                    "w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-6 transition-transform group-hover:scale-110 shadow-inner",
                    table.status === 'occupied' ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-300'
                  )}>
                    <LayoutGrid className="h-8 w-8" />
                  </div>
                  
                  <div className="font-black text-xl mb-1 tracking-tight">{table.name}</div>
                  <div className={cn("text-[10px] font-black uppercase tracking-widest", table.status === 'occupied' ? 'text-white/60' : 'text-slate-400')}>
                     <Users className="h-3 w-3 inline mr-1" /> {table.capacity} Capacity
                  </div>
                  
                  <div className={cn(
                    "mt-6 px-4 py-1.5 rounded-full text-[10px] uppercase font-black tracking-widest shadow-sm",
                    table.status === 'available' ? 'bg-emerald-500 text-white' : 
                    table.status === 'occupied' ? 'bg-white text-primary' : 
                    'bg-orange-400 text-white'
                  )}>
                    {table.status === 'occupied' && <Timer className="h-3 w-3 inline mr-1 animate-pulse" />}
                    {table.status}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

// Minimal Card components
function Card({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <div className={cn("rounded-xl border bg-card text-card-foreground shadow-sm", className)}>{children}</div>;
}
function CardContent({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <div className={cn("p-6 pt-0", className)}>{children}</div>;
}
