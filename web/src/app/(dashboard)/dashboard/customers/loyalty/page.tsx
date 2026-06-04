"use client";

import { motion } from "framer-motion";
import { Sparkles, Trophy, Users, Heart, Gift, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, getIndustryColor } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getLoyaltyStats, launchCampaign } from "@/lib/actions/loyalty";
import { toast } from "sonner";

export default function LoyaltyProgramPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const businessType = session?.user?.businessType || "SHOP";
  const colors = getIndustryColor(businessType);
  const [stats, setStats] = useState({ activeMembers: 0, pointsIssued: 0, rewardsRedeemed: 0, memberGrowth: "0%" });
  
  useEffect(() => {
    getLoyaltyStats().then(data => setStats({
        activeMembers: data.activeMembers,
        pointsIssued: data.pointsIssued, // Removed parseInt
        rewardsRedeemed: data.rewardsRedeemed,
        memberGrowth: data.memberGrowth
    }));
  }, []);

  async function handleLaunchCampaign(cluster: string) {
    try {
      await launchCampaign({ name: `Automated Campaign - ${cluster}`, targetCluster: cluster });
      toast.success(`Neural campaign launched for ${cluster} cluster!`);
    } catch {
      toast.error("Failed to launch campaign.");
    }
  }

  return (
    <div className="space-y-8 p-6 md:p-10">
      {/* ... header ... */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: "Active Members", value: stats.activeMembers.toString(), icon: Users, color: "text-blue-500" },
           { label: "Points Issued", value: stats.pointsIssued, icon: Sparkles, color: "text-amber-500" },
           { label: "Rewards Redeemed", value: stats.rewardsRedeemed.toString(), icon: Gift, color: "text-emerald-500" },
           { label: "Member Growth", value: stats.memberGrowth, icon: Heart, color: "text-rose-500" }
         ].map((stat, i) => (
           <Card key={i} className="border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm">
              <stat.icon className={cn("h-5 w-5 mb-4", stat.color)} />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{stat.label}</p>
              <h2 className="text-3xl font-[1000] text-slate-900 dark:text-white tracking-tighter">{stat.value}</h2>
           </Card>
         ))}
      </div>

      {/* ... Tiered Engine (UI unchanged) ... */}

        <Card className="border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-sm flex flex-col justify-center text-center">
           <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner border border-slate-100 dark:border-slate-700/50">
              <Gift className="h-8 w-8 text-slate-300" />
           </div>
           <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Neural Campaigns</h3>
           <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed mb-8">Launch automated SMS/Email campaigns for dormant loyalty nodes.</p>
           <Button onClick={() => handleLaunchCampaign("Dormant")} variant="outline" className="w-full h-12 rounded-xl border-slate-200 font-black text-[10px] uppercase tracking-widest">Setup Campaign <ArrowRight className="ml-2 h-3.5 w-3.5" /></Button>
        </Card>
    </div>
  );
}
