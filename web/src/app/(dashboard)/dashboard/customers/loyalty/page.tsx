"use client";

import { motion } from "framer-motion";
import { Sparkles, Trophy, Users, Heart, Gift, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, getIndustryColor } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoyaltyProgramPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const businessType = session?.user?.businessType || "SHOP";
  const colors = getIndustryColor(businessType);

  return (
    <div className="space-y-8 p-6 md:p-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <div className={cn("p-1.5 rounded-lg text-white shadow-lg", colors.primary)}>
                 <Trophy className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Retention Intelligence</span>
           </div>
           <h1 className="text-4xl font-[1000] text-slate-900 dark:text-white tracking-tight">Loyalty Program</h1>
           <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Reward your top commerce nodes and increase customer lifetime value.</p>
        </div>

        <Button onClick={() => router.push("/dashboard/customers")} className={cn("h-12 px-8 rounded-xl text-white font-black uppercase text-[10px] tracking-widest shadow-xl", colors.primary)}>
           Manage Rewards
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: "Active Members", value: "142", icon: Users, color: "text-blue-500" },
           { label: "Points Issued", value: "24.5k", icon: Sparkles, color: "text-amber-500" },
           { label: "Rewards Redeemed", value: "89", icon: Gift, color: "text-emerald-500" },
           { label: "Member Growth", value: "+12%", icon: Heart, color: "text-rose-500" }
         ].map((stat, i) => (
           <Card key={i} className="border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm">
              <stat.icon className={cn("h-5 w-5 mb-4", stat.color)} />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{stat.label}</p>
              <h2 className="text-3xl font-[1000] text-slate-900 dark:text-white tracking-tighter">{stat.value}</h2>
           </Card>
         ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        <Card className="lg:col-span-2 border-none bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
           <h3 className="text-2xl font-[1000] tracking-tight mb-4 uppercase italic">Tiered Rewards Engine</h3>
           <p className="text-slate-400 text-xs font-bold leading-relaxed uppercase tracking-widest mb-8 max-w-md">
             Configure automated point multipliers and tier-based discounts. Our neural retention models suggest a 5% discount for 'Gold' tier nodes.
           </p>
           <div className="space-y-4">
              {['Standard', 'Silver', 'Gold', 'Platinum'].map((tier, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                   <span className="font-bold uppercase tracking-widest text-[10px]">{tier} Tier</span>
                   <span className="text-[10px] font-black text-primary uppercase">Active</span>
                </div>
              ))}
           </div>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-sm flex flex-col justify-center text-center">
           <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner border border-slate-100 dark:border-slate-700/50">
              <Gift className="h-8 w-8 text-slate-300" />
           </div>
           <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Neural Campaigns</h3>
           <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed mb-8">Launch automated SMS/Email campaigns for dormant loyalty nodes.</p>
           <Button variant="outline" className="w-full h-12 rounded-xl border-slate-200 font-black text-[10px] uppercase tracking-widest">Setup Campaign <ArrowRight className="ml-2 h-3.5 w-3.5" /></Button>
        </Card>
      </motion.div>
    </div>
  );
}
