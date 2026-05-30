"use client";

import { useState, useEffect } from "react";
import { Globe, Search, MoreVertical, KeyRound, UserCheck, CheckCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getAllBusinesses, updateBusinessPlan, resetTenantAdminPassword, startImpersonation, approveBusiness, deleteBusiness } from "@/lib/actions/super-admin";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchBusinesses();
  }, []);

  async function fetchBusinesses() {
    try {
      setLoading(true);
      const data = await getAllBusinesses();
      setBusinesses(data);
    } catch (error) {
      toast.error("Failed to load business directory.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePlanChange(businessId: string, plan: string) {
    try {
      await updateBusinessPlan(businessId, plan);
      toast.success(`Plan updated to ${plan}`);
      fetchBusinesses();
    } catch (error) {
      toast.error("Update failed.");
    }
  }

  async function handleApprove(businessId: string) {
    try {
      await approveBusiness(businessId);
      toast.success("Business activated successfully.");
      fetchBusinesses();
    } catch (error) {
      toast.error("Approval failed.");
    }
  }

  async function handleDelete(businessId: string, name: string) {
    if (window.confirm(`CRITICAL ACTION: Are you sure you want to permanently delete "${name}" and ALL its intelligence data (products, sales, users, etc.)? This cannot be undone.`)) {
      try {
        await deleteBusiness(businessId);
        toast.success(`Business "${name}" purged from ecosystem.`);
        fetchBusinesses();
      } catch (error: any) {
        toast.error(error.message || "Deletion failed.");
      }
    }
  }

  async function handleResetPassword(businessId: string) {
    try {
      const { email, newPassword } = await resetTenantAdminPassword(businessId);
      toast.success(`Password reset for ${email}. New password: ${newPassword}`, { duration: 10000 });
    } catch (error) {
      toast.error("Password reset failed.");
    }
  }

  async function handleImpersonate(businessId: string) {
    try {
      const admin = await startImpersonation(businessId);
      toast.success(`Impersonation active for ${admin.email}. Redirecting...`);
      window.location.href = "/dashboard";
    } catch (error) {
      toast.error("Impersonation failed.");
    }
  }

  const filtered = businesses.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 p-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-[1000] tracking-tight text-slate-900">Ecosystem Registry</h1>
           <p className="text-slate-500 font-medium">Monitoring and licensing management for all tenant nodes.</p>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-white p-4 rounded-3xl">
        <div className="relative group">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <Input 
            placeholder="Search by business name or slug..." 
            className="pl-10 h-10 rounded-xl border-slate-100 bg-slate-50 focus:bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </Card>

      <div className="rounded-[2rem] border-none bg-white shadow-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest pl-8">Business Intel</TableHead>
              <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Plan & Status</TableHead>
              <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest text-center">Metrics</TableHead>
              <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Established</TableHead>
              <TableHead className="w-[80px] pr-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [1,2,3].map(i => (
                <TableRow key={i} className="border-slate-50">
                  <TableCell colSpan={5} className="h-20 animate-pulse bg-slate-50/50" />
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-400 font-bold italic">No businesses found.</TableCell>
              </TableRow>
            ) : (
              filtered.map((b) => (
                <TableRow key={b.id} className="hover:bg-slate-50/50 border-slate-50 group transition-colors">
                  <TableCell className="pl-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black">
                        {b.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-800 text-sm">{b.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">slug: {b.slug}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase w-fit",
                        b.plan === 'PREMIUM' ? "bg-indigo-600 text-white" : 
                        b.plan === 'STANDARD' ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600"
                      )}>
                        {b.plan}
                      </span>
                      <span className={cn(
                        "text-[10px] font-bold uppercase",
                        b.status === 'ACTIVE' ? "text-emerald-500" : "text-amber-500"
                      )}>{b.status}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-4">
                       <div className="flex flex-col items-center">
                          <span className="text-xs font-black text-slate-700">{b._count.products}</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase">SKUs</span>
                       </div>
                       <div className="flex flex-col items-center">
                          <span className="text-xs font-black text-slate-700">{b._count.sales}</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase">Sales</span>
                       </div>
                       <div className="flex flex-col items-center">
                          <span className="text-xs font-black text-slate-700">{b._count.users}</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase">Staff</span>
                       </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-bold text-slate-600">
                       {format(new Date(b.createdAt), "MMM dd, yyyy")}
                    </div>
                  </TableCell>
                  <TableCell className="pr-8">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg">
                          <MoreVertical className="h-4 w-4 text-slate-400" />
                        </Button>
                      } />
                      <DropdownMenuContent align="end" className="rounded-xl shadow-xl border-slate-100">
                        {b.status === 'PENDING' && (
                           <DropdownMenuItem onClick={() => handleApprove(b.id)} className="font-bold text-emerald-600 gap-2">
                             <CheckCircle className="h-4 w-4" /> Approve Business
                           </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handlePlanChange(b.id, "FREE")} className="font-bold">Downgrade to FREE</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePlanChange(b.id, "BASIC")} className="font-bold">Switch to BASIC</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePlanChange(b.id, "STANDARD")} className="font-bold">Switch to STANDARD</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePlanChange(b.id, "PREMIUM")} className="font-black text-indigo-600">Upgrade to PREMIUM</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleResetPassword(b.id)} className="font-bold text-rose-600 gap-2">
                          <KeyRound className="h-4 w-4" /> Reset Admin Password
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleImpersonate(b.id)} className="font-bold text-amber-600 gap-2">
                          <UserCheck className="h-4 w-4" /> Impersonate Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(b.id, b.name)} className="font-bold text-rose-600 gap-2">
                          <Trash2 className="h-4 w-4" /> Delete Business Intel
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
