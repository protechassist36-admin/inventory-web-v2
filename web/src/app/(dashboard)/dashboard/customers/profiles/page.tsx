"use client";

import { motion } from "framer-motion";
import { Sparkles, FileText, Search, Filter, ArrowRight, UserCheck, ShieldCheck, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, getIndustryColor } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getRegistryIntelligence } from "@/lib/actions/registry";

export default function PurchaseProfilesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const businessType = session?.user?.businessType || "SHOP";
  const colors = getIndustryColor(businessType);
  
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    getRegistryIntelligence().then(setData);
  }, []);

  return (
    <div className="space-y-8 p-6 md:p-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <div className={cn("p-1.5 rounded-lg text-white shadow-lg", colors.primary)}>
                 <FileText className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Behavioral Intelligence</span>
           </div>
           <h1 className="text-4xl font-[1000] text-slate-900 dark:text-white tracking-tight">Purchase Profiles</h1>
           <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Deep analysis of customer commerce patterns and SKU affinity.</p>
        </div>

        <Button onClick={() => router.push("/dashboard/analytics")} className={cn("h-12 px-8 rounded-xl text-white font-black uppercase text-[10px] tracking-widest shadow-xl", colors.primary)}>
           Neural Analytics
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         <Card className="lg:col-span-1 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm space-y-8">
            <div className="space-y-4">
               <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Profile Filter</h3>
               <div className="space-y-3">
                  <div className="relative group">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                     <Input placeholder="Search Node..." className="h-10 pl-10 rounded-xl border-slate-200 bg-slate-50/50" />
                  </div>
                  <Button variant="outline" className="w-full h-10 rounded-xl border-slate-200 justify-between font-bold text-[10px] uppercase tracking-widest text-slate-500">
                     Spending Tier <Filter className="h-3 w-3" />
                  </Button>
               </div>
            </div>

            <div className="space-y-4">
               <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Cluster Status</h3>
               <div className="space-y-2">
                  {[
                    { label: "High Velocity", color: "bg-emerald-500", key: "High Velocity" },
                    { label: "Dormant", color: "bg-slate-300", key: "Dormant" },
                    { label: "At Risk", color: "bg-rose-500", key: "At Risk" }
                  ].map((status, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                       <div className="flex items-center gap-2">
                          <div className={cn("h-2 w-2 rounded-full", status.color)} />
                          <span className="text-[10px] font-bold uppercase tracking-tight text-slate-600 dark:text-slate-400">{status.label}</span>
                       </div>
                       <span className="text-xs font-black text-slate-900 dark:text-white">{data?.clusterCounts?.[status.key] || 0}</span>
                    </div>
                  ))}
               </div>
            </div>
         </Card>

         <div className="lg:col-span-3 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {data?.nodes.map((profile: any, i: number) => (
                 <Card key={i} className="border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-sm group hover:border-primary/30 transition-all cursor-pointer">
                    <div className="flex justify-between items-start mb-6">
                       <div className="flex items-center gap-4">
                          <div className="h-14 w-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-inner group-hover:bg-primary/5 transition-colors">
                             <UserCheck className="h-6 w-6 text-slate-400 group-hover:text-primary" />
                          </div>
                          <div>
                             <h4 className="font-black text-lg text-slate-900 dark:text-white tracking-tight leading-none">{profile.name}</h4>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 italic">ID: {profile.id.substring(0, 8)}</p>
                          </div>
                       </div>
                       <div className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[8px] font-black uppercase tracking-widest shadow-sm">Verified</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-slate-50 dark:border-slate-800 pt-6">
                       <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Primary Affinity</p>
                          <p className="text-xs font-black text-slate-700 dark:text-slate-300 mt-1 uppercase italic">{profile.primaryAffinity}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Neural Spend</p>
                          <p className="text-base font-[1000] text-slate-900 dark:text-white tracking-tighter mt-1">Le {Math.round(profile.totalVolume).toLocaleString()}</p>
                       </div>
                    </div>

                    <Button variant="ghost" className="w-full mt-6 h-10 rounded-xl font-black text-[9px] uppercase tracking-widest text-slate-500 hover:bg-slate-50">View Interaction History <ArrowRight className="ml-2 h-3 w-3" /></Button>
                 </Card>
               ))}
            </div>

            <Card className="border-none bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px]" />
               <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                  <div className="flex-1 space-y-4">
                     <div className="flex items-center gap-3">
                        <ShieldCheck className="h-6 w-6 text-indigo-400" />
                        <h3 className="text-2xl font-[1000] tracking-tight uppercase italic">Audience Segmentation</h3>
                     </div>
                     <p className="text-slate-400 text-xs font-bold leading-relaxed uppercase tracking-widest max-w-sm">
                       Our neural engines have detected emerging customer clusters based on your latest commerce data.
                     </p>
                     <Button className="h-12 px-8 rounded-xl bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20">Initialize Sync</Button>
                  </div>
                  <div className="w-full md:w-48 aspect-square bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center">
                     <History className="h-20 w-20 text-indigo-500/20 animate-pulse" />
                  </div>
               </div>
            </Card>
         </div>
      </div>
    </div>
  );
}
