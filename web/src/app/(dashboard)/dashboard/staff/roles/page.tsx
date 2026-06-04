"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, ShieldCheck, Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getRoles, deleteRole, createRole, updateRole } from "@/lib/actions/user"; // assuming getRoles is here
import { getPermissions } from "@/lib/actions/role";
import { cn } from "@/lib/utils";

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", permissions: [] as string[] });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [rolesData, permsData] = await Promise.all([getRoles(), getPermissions()]);
    setRoles(rolesData);
    setPermissions(permsData);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingRole) {
        await updateRole(editingRole.id, formData);
        toast.success("Role updated successfully.");
      } else {
        await createRole(formData);
        toast.success("Role created successfully.");
      }
      setIsDialogOpen(false);
      setEditingRole(null);
      setFormData({ name: "", permissions: [] });
      fetchData();
    } catch {
      toast.error("Operation failed.");
    }
  }

  return (
    <div className="p-6 md:p-10 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black">Roles & Permissions</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl font-black"><Plus className="mr-2 h-4 w-4" /> Add Role</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
             <form onSubmit={handleSubmit} className="space-y-4">
               <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Role Name" required />
               <div className="max-h-60 overflow-y-auto space-y-2">
                 {permissions.map(p => (
                   <div key={p.id} className="flex items-center gap-2">
                     <Checkbox 
                        checked={formData.permissions.includes(p.id)}
                        onCheckedChange={checked => setFormData(prev => ({ ...prev, permissions: checked ? [...prev.permissions, p.id] : prev.permissions.filter(id => id !== p.id)}))}
                     />
                     <Label>{p.key}</Label>
                   </div>
                 ))}
               </div>
               <Button type="submit">Save Role</Button>
             </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {roles.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-bold">{r.name}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => { setEditingRole(r); setFormData({name: r.name, permissions: r.permissions.map((p:any) => p.id)}); setIsDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteRole(r.id).then(fetchData)}><Trash2 className="h-4 w-4" /></Button>
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
