"use client";

import { useState, useEffect } from "react";
import { 
  CreditCard, 
  Shield, 
  Settings, 
  User, 
  Building, 
  Check, 
  Lock, 
  UserPlus, 
  Trash2, 
  ShieldAlert,
  Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { getSubscription, createSubscription } from "@/lib/actions/subscription";
import { getUsers, createUser, deleteUser, changePassword, getRoles } from "@/lib/actions/user";
import { useSession } from "next-auth/react";
import { cn, getIndustryColor } from "@/lib/utils";

const PLANS = [
  {
    id: "FREE",
    name: "Essential",
    price: "0",
    features: ["1 Business Profile", "Up to 100 Products", "1 Admin User", "Offline POS Core"],
  },
  {
    id: "BASIC",
    name: "Professional",
    price: "150,000",
    features: ["Unlimited Products", "Up to 5 Staff Users", "Advanced Analytics", "Priority Sync"],
  },
  {
    id: "PREMIUM",
    name: "Hospitality",
    price: "450,000",
    features: ["Unlimited Team Users", "Restaurant Modules", "Pharmacy Guard", "24/7 VIP Support"],
  },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const [subscription, setSubscription] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const businessType = session?.user?.businessType || "SHOP";
  const colors = getIndustryColor(businessType);

  // Form States
  const [passData, setPassData] = useState({ current: "", new: "", confirm: "" });
  const [userData, setUserData] = useState({ name: "", email: "", password: "", roleId: "" });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [sub, team, rolesData] = await Promise.all([
        getSubscription(), 
        getUsers(),
        getRoles()
      ]);
      setSubscription(sub);
      setUsers(team);
      setRoles(rolesData);
      if (rolesData.length > 0 && !userData.roleId) {
        setUserData(prev => ({ ...prev, roleId: rolesData[0].id }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (passData.new !== passData.confirm) return toast.error("New passwords do not match");
    
    try {
      await changePassword({ current: passData.current, new: passData.new });
      toast.success("Security credentials updated");
      setPassData({ current: "", new: "", confirm: "" });
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createUser(userData);
      toast.success(`User ${userData.name} invited to team`);
      setUserData({ name: "", email: "", password: "", roleId: roles[0]?.id || "" });
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleDeleteUser(id: string) {
    if (!confirm("Remove this user from your business?")) return;
    try {
      await deleteUser(id);
      toast.success("User access revoked");
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleUpgrade(planId: string) {
    try {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      await createSubscription({
        plan: planId,
        endDate: endDate,
        amount: planId === "BASIC" ? 150000 : 450000,
      });

      toast.success(`Upgraded to ${planId} Plan!`);
      fetchData();
    } catch (error) {
      toast.error("Subscription failed");
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center gap-4">
         <div className={cn("p-3 rounded-2xl text-white shadow-xl", colors.primary)}>
            <Settings className="h-6 w-6" />
         </div>
         <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">System Control</h1>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Administration & Enterprise Scaling</p>
         </div>
      </div>

      <Tabs defaultValue="security" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-2xl">
          <TabsTrigger value="security" className="rounded-xl font-black text-[10px] uppercase tracking-widest px-6 data-[state=active]:shadow-lg">
            <Lock className="mr-2 h-4 w-4" /> Security
          </TabsTrigger>
          <TabsTrigger value="team" className="rounded-xl font-black text-[10px] uppercase tracking-widest px-6 data-[state=active]:shadow-lg">
            <User className="mr-2 h-4 w-4" /> Team
          </TabsTrigger>
          <TabsTrigger value="subscription" className="rounded-xl font-black text-[10px] uppercase tracking-widest px-6 data-[state=active]:shadow-lg">
            <CreditCard className="mr-2 h-4 w-4" /> Billing
          </TabsTrigger>
        </TabsList>

        {/* Security / Password Change */}
        <TabsContent value="security">
           <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] max-w-2xl">
              <CardHeader className="p-8 pb-4">
                 <CardTitle className="text-2xl font-black">Security Credentials</CardTitle>
                 <CardDescription className="font-bold text-slate-400">Securely update your account password</CardDescription>
              </CardHeader>
              <form onSubmit={handlePasswordChange}>
                 <CardContent className="p-8 pt-4 space-y-6">
                    <div className="space-y-2">
                       <Label className="font-black text-slate-700 text-xs uppercase tracking-widest pl-1">Current Password</Label>
                       <Input 
                         type="password" 
                         value={passData.current}
                         onChange={e => setPassData({...passData, current: e.target.value})}
                         className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white" 
                         required
                       />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <Label className="font-black text-slate-700 text-xs uppercase tracking-widest pl-1">New Password</Label>
                          <Input 
                            type="password" 
                            value={passData.new}
                            onChange={e => setPassData({...passData, new: e.target.value})}
                            className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white font-black" 
                            required
                          />
                       </div>
                       <div className="space-y-2">
                          <Label className="font-black text-slate-700 text-xs uppercase tracking-widest pl-1">Confirm New</Label>
                          <Input 
                            type="password" 
                            value={passData.confirm}
                            onChange={e => setPassData({...passData, confirm: e.target.value})}
                            className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white font-black" 
                            required
                          />
                       </div>
                    </div>
                 </CardContent>
                 <CardFooter className="p-8 pt-0">
                    <Button type="submit" className={cn("px-8 h-12 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl", colors.primary, colors.glow)}>
                       <Save className="mr-2 h-4 w-4" /> Save New Credentials
                    </Button>
                 </CardFooter>
              </form>
           </Card>
        </TabsContent>

        {/* Team Management */}
        <TabsContent value="team" className="space-y-8">
           <div className="grid gap-8 lg:grid-cols-3">
              <Card className="col-span-1 border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem]">
                 <CardHeader className="p-8">
                    <CardTitle className="text-xl font-black">Add Team Member</CardTitle>
                    <CardDescription className="font-bold text-slate-400 italic">User limits based on {subscription?.plan || 'Essential'} plan</CardDescription>
                 </CardHeader>
                 <form onSubmit={handleAddUser}>
                    <CardContent className="px-8 pb-8 space-y-4">
                       <div className="space-y-2">
                          <Label className="font-black text-slate-700 text-[10px] uppercase tracking-widest">Full Name</Label>
                          <Input 
                            value={userData.name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserData({...userData, name: e.target.value})}
                            placeholder="Employee name" 
                            className="h-11 rounded-xl bg-slate-50 border-slate-100" 
                            required 
                          />
                       </div>
                       <div className="space-y-2">
                          <Label className="font-black text-slate-700 text-[10px] uppercase tracking-widest">Email Address</Label>
                          <Input 
                            type="email"
                            value={userData.email}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserData({...userData, email: e.target.value})}
                            placeholder="user@business.com" 
                            className="h-11 rounded-xl bg-slate-50 border-slate-100" 
                            required 
                          />
                       </div>
                       <div className="space-y-2">
                          <Label className="font-black text-slate-700 text-[10px] uppercase tracking-widest">Initial Password</Label>
                          <Input 
                            type="password"
                            value={userData.password}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserData({...userData, password: e.target.value})}
                            className="h-11 rounded-xl bg-slate-50 border-slate-100 font-black" 
                            required 
                          />
                       </div>
                       <div className="space-y-2">
                          <Label className="font-black text-slate-700 text-[10px] uppercase tracking-widest">Role Access</Label>
                          <Select 
                            value={userData.roleId}
                            onValueChange={(val: string | null) => setUserData({...userData, roleId: val ?? ""})}
                          >
                             <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-100">
                                <SelectValue />
                             </SelectTrigger>
                             <SelectContent className="rounded-xl">
                                {roles.map((r: any) => (
                                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                ))}
                             </SelectContent>
                          </Select>
                       </div>
                       <Button type="submit" className="w-full h-12 mt-4 bg-slate-900 rounded-xl font-black text-xs uppercase tracking-widest gap-2 shadow-lg">
                          <UserPlus className="h-4 w-4" /> Grant Access
                       </Button>
                    </CardContent>
                 </form>
              </Card>

              <Card className="lg:col-span-2 border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
                 <CardHeader className="p-8 border-b border-slate-50">
                    <CardTitle className="text-xl font-black">Authorized Personnel</CardTitle>
                 </CardHeader>
                 <CardContent className="p-0">
                    <div className="divide-y divide-slate-50">
                       {users.map((u: any) => (
                         <div key={u.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                            <div className="flex items-center gap-4">
                               <div className="h-12 w-12 rounded-2xl bg-white shadow-lg border border-slate-100 flex items-center justify-center font-black text-slate-400">
                                  {u.name.charAt(0)}
                               </div>
                               <div>
                                  <div className="font-black text-slate-800 flex items-center gap-2">
                                     {u.name}
                                     {u.role === "ADMIN" && <Shield className="h-3 w-3 text-primary" />}
                                  </div>
                                  <div className="text-xs font-bold text-slate-400 tracking-tight">{u.email}</div>
                               </div>
                            </div>
                            <div className="flex items-center gap-3">
                               <span className={cn(
                                 "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter",
                                 u.role === "ADMIN" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
                               )}>
                                 {u.role}
                               </span>
                               {u.id !== session?.user?.id && (
                                 <Button 
                                   variant="ghost" 
                                   size="icon" 
                                   className="h-8 w-8 text-rose-200 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                                   onClick={() => handleDeleteUser(u.id)}
                                 >
                                    <Trash2 className="h-4 w-4" />
                                 </Button>
                               )}
                            </div>
                         </div>
                       ))}
                    </div>
                 </CardContent>
              </Card>
           </div>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription">
           <div className="grid gap-8 lg:grid-cols-3 max-w-7xl mx-auto py-4">
              {PLANS.map((p: any) => {
                const isActive = (subscription?.plan || "FREE") === p.id;
                return (
                  <Card key={p.id} className={cn(
                    "p-12 rounded-[3.5rem] border-4 flex flex-col bg-white transition-all duration-700",
                    isActive ? "border-primary shadow-2xl shadow-primary/20 scale-105 z-10" : "border-slate-50 hover:shadow-xl"
                  )}>
                    <div className="flex justify-between items-start mb-4">
                       <h3 className="text-3xl font-black tracking-tighter text-slate-900">{p.name}</h3>
                       {isActive && (
                         <div className="bg-primary text-white text-[9px] font-black uppercase px-3 py-1 rounded-full tracking-widest shadow-lg">Active</div>
                       )}
                    </div>
                    <div className="text-4xl font-[1000] mb-10 text-slate-900 tracking-tighter">
                      Le {p.price}<span className="text-xs font-black text-slate-300 ml-2">/ month</span>
                    </div>
                    <ul className="space-y-6 mb-12 flex-1">
                      {p.features.map((f: string) => (
                        <li key={f} className="flex items-center gap-4 text-xs font-black text-slate-700">
                          <Check className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-slate-200")} /> {f}
                        </li>
                      ))}
                    </ul>
                    <Button 
                      onClick={() => handleUpgrade(p.id)}
                      disabled={isActive || p.id === "FREE"}
                      className={cn(
                        "h-16 rounded-2xl font-black text-lg transition-all shadow-xl",
                        isActive ? "bg-slate-100 text-slate-400" : "bg-slate-900 text-white hover:bg-primary"
                      )}
                    >
                      {isActive ? "Current Plan" : "Upgrade Business"}
                    </Button>
                  </Card>
                );
              })}
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
