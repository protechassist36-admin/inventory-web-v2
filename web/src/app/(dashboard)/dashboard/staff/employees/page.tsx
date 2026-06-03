"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical, 
  ShieldCheck, 
  Mail, 
  Shield, 
  Trash2, 
  Edit2, 
  Lock,
  Sparkles,
  ArrowRight,
  Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getUsers, getRoles, createUser, deleteUser } from "@/lib/actions/user";
import { getPermissions } from "@/lib/actions/role";
import { format } from "date-fns";
import { cn, getIndustryColor } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";

export default function EmployeesPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    roleId: "",
    selectedPermissions: [] as string[]
  });

  const businessType = session?.user?.businessType || "SHOP";
  const colors = getIndustryColor(businessType);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [userData, rolesData, permissionsData] = await Promise.all([
        getUsers(),
        getRoles(),
        getPermissions()
      ]);
      setUsers(userData);
      setRoles(rolesData);
      setPermissions(permissionsData);
      if (rolesData.length > 0 && !formData.roleId) {
        setFormData(prev => ({ ...prev, roleId: rolesData[0].id }));
      }
    } catch (error) {
      toast.error("Failed to sync personnel data.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createUser(formData);
      toast.success("Employee node initialized successfully.");
      setIsAddOpen(false);
      setFormData({ name: "", email: "", password: "", roleId: roles[0]?.id || "", selectedPermissions: [] });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to initialize employee node.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to terminate this employee session?")) return;
    try {
      await deleteUser(id);
      toast.success("Employee node terminated.");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to terminate node.");
    }
  }

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.roleName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 p-6 md:p-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <div className={cn("p-1.5 rounded-lg text-white shadow-lg", colors.primary)}>
                 <Users className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Personnel Intelligence</span>
           </div>
           <h1 className="text-4xl font-[1000] text-slate-900 dark:text-white tracking-tight">Staff Network</h1>
           <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Manage and monitor active human capital nodes within your commerce cluster.</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
           <DialogTrigger render={
              <Button className={cn("h-12 px-8 rounded-xl text-white font-black uppercase text-[10px] tracking-widest shadow-xl", colors.primary)}>
                 <UserPlus className="h-4 w-4 mr-2" /> Add Employee Node
              </Button>
           } />
           <DialogContent className="rounded-3xl border-none shadow-2xl p-0 overflow-hidden bg-white max-w-md">
              <div className="bg-slate-900 p-8 text-white">
                 <h3 className="text-2xl font-[1000] tracking-tighter uppercase italic">Node Initialization</h3>
                 <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Create New Authorized User</p>
              </div>
              <form onSubmit={handleAdd} className="p-8 space-y-5">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</Label>
                    <Input required className="h-12 rounded-xl" value={formData.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, name: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</Label>
                    <Input required type="email" className="h-12 rounded-xl" value={formData.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, email: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Access Key (Password)</Label>
                    <Input required type="password" title="Set employee password"  className="h-12 rounded-xl" value={formData.password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, password: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Intelligence Role</Label>
                    <Select value={formData.roleId} onValueChange={(v: string | null) => setFormData({...formData, roleId: v ?? ""})}>
                       <SelectTrigger className="h-12 rounded-xl">
                          <SelectValue placeholder="Select Privilege Level" />
                       </SelectTrigger>
                       <SelectContent className="rounded-xl">
                          {roles.map((r: any) => (
                            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                          ))}
                       </SelectContent>
                    </Select>
                 </div>
                 
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Granular Permissions</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {permissions.map((p) => (
                        <div key={p.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={p.id} 
                            checked={formData.selectedPermissions.includes(p.id)}
                            onCheckedChange={(checked) => {
                              setFormData(prev => ({
                                ...prev,
                                selectedPermissions: checked 
                                  ? [...prev.selectedPermissions, p.id]
                                  : prev.selectedPermissions.filter(id => id !== p.id)
                              }));
                            }}
                          />
                          <Label htmlFor={p.id} className="text-xs cursor-pointer">{p.key}</Label>
                        </div>
                      ))}
                    </div>
                 </div>

                 <Button type="submit" className={cn("w-full h-14 rounded-2xl text-white font-black uppercase tracking-widest shadow-xl mt-4", colors.primary)}>
                    Finalize Initialization
                 </Button>
              </form>
           </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {[
           { label: "Active Nodes", value: users.length.toString().padStart(2, '0'), icon: Users, color: "text-blue-500" },
           { label: "Privileged Access", value: users.filter((u: any) => u.roleName === 'ADMIN').length.toString().padStart(2, '0'), icon: ShieldCheck, color: "text-emerald-500" },
           { label: "Connectivity", value: "99.8%", icon: Activity, color: "text-indigo-500" },
           { label: "Pending Logs", value: "00", icon: Mail, color: "text-slate-400" }
         ].map((stat, i) => (
           <Card key={i} className="border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm">
              <stat.icon className={cn("h-5 w-5 mb-4", stat.color)} />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{stat.label}</p>
              <h2 className="text-3xl font-[1000] text-slate-900 dark:text-white tracking-tighter">{stat.value}</h2>
           </Card>
         ))}
      </div>

      <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-sm overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-100/50 dark:border-slate-800/50 flex flex-col md:flex-row justify-between gap-4">
           <div className="relative flex-1 max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search personnel or roles..." 
                className="h-12 pl-12 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              />
           </div>
           <Button variant="outline" className="h-12 w-12 rounded-2xl border-slate-200 flex items-center justify-center">
              <Filter className="h-4 w-4 text-slate-400" />
           </Button>
        </CardHeader>
        <CardContent className="p-0">
           <Table>
             <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
               <TableRow className="hover:bg-transparent border-none">
                 <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400 px-8">Personnel Node</TableHead>
                 <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400">Access Level</TableHead>
                 <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400">Registration</TableHead>
                 <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400 text-right pr-8">Actions</TableHead>
               </TableRow>
             </TableHeader>
                 <TableBody>
               {loading ? (
                 Array.from({ length: 3 }).map((_, i) => <TableRow key={i} className="h-24 border-b border-slate-50 animate-pulse"><TableCell colSpan={4} /></TableRow>)
               ) : filteredUsers.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={4} className="h-64 text-center">
                      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest italic">No personnel detected in cluster</p>
                   </TableCell>
                 </TableRow>
               ) : (
               filteredUsers.map((u) => {
                 console.log("DEBUG: Rendering user node:", u);
                 return (
                 <TableRow key={u.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all border-b border-slate-50 dark:border-slate-800/50 h-24">
                   <TableCell className="px-8">
                      <div className="flex items-center gap-4">
                         <Avatar className="h-12 w-12 rounded-2xl border-2 border-white dark:border-slate-800 shadow-md">
                            <AvatarFallback className={cn("rounded-2xl text-white font-black text-sm", colors.primary)}>{String(u.name || "U").charAt(0)}</AvatarFallback>
                         </Avatar>
                         <div>
                            <div className="font-black text-slate-900 dark:text-white tracking-tight">{String(u.name || "")}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                               <Mail size={10} /> {String(u.email || "")}
                            </div>
                         </div>
                      </div>
                   </TableCell>
                   <TableCell>
                      <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm", 
                         String(u.roleName || "") === 'ADMIN' ? "bg-indigo-500/10 text-indigo-600 border border-indigo-200/50" : "bg-slate-100 text-slate-600 border border-slate-200")}>
                         <Shield size={10} /> {String(u.roleName || "Staff")}
                      </div>
                   </TableCell>
                   <TableCell>
                      <div className="text-xs font-bold text-slate-600 dark:text-slate-400">{u.createdAt ? format(new Date(u.createdAt), "MMM dd, yyyy") : ""}</div>
                   </TableCell>
                   <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-2">
                         <Button variant="ghost" size="sm" className="h-9 w-9 rounded-xl text-slate-400 hover:text-primary transition-all">
                            <Edit2 size={14} />
                         </Button>
                         <Button variant="ghost" size="sm" onClick={() => handleDelete(u.id)} className="h-9 w-9 rounded-xl text-slate-400 hover:text-rose-500 transition-all">
                            <Trash2 size={14} />
                        </Button>
                      </div>
                   </TableCell>
                 </TableRow>
                 )
               })
               )}
             </TableBody>
           </Table>
        </CardContent>
      </Card>

      <Card className="border-none bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 space-y-4 text-center md:text-left">
               <Sparkles className="h-10 w-10 text-primary animate-pulse mx-auto md:mx-0" />
               <h3 className="text-3xl font-[1000] tracking-tighter uppercase italic">Neural Performance Hub</h3>
               <p className="text-slate-400 text-xs font-bold leading-relaxed uppercase tracking-widest max-w-md">
                 Unlock AI-driven personnel optimization. Monitor node velocity, shift efficiency, and commerce contribution in real-time.
               </p>
               <Button className="h-14 px-10 bg-primary text-white hover:bg-primary/90 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20 transition-all group">
                  Activate Hub <ArrowRight className="ml-3 h-4 w-4 group-hover:translate-x-1 transition-transform" />
               </Button>
            </div>
            <div className="w-full md:w-64 aspect-video bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-center p-6">
               <Users className="h-24 w-24 text-white/10" />
            </div>
         </div>
      </Card>
    </div>
  );
}
