"use client";

import { motion } from "framer-motion";
import { Sparkles, Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, getIndustryColor } from "@/lib/utils";
import { useSession } from "next-auth/react";

export default function PlaceholderPage() {
  const { data: session } = useSession();
  const businessType = session?.user?.businessType || "SHOP";
  const colors = getIndustryColor(businessType);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6 max-w-lg"
      >
        <div className={cn("mx-auto w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-2xl", colors.primary)}>
          <Construction className="h-10 w-10 text-white" />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className={cn("h-4 w-4", colors.text)} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Intelligence Node</span>
            <Sparkles className={cn("h-4 w-4", colors.text)} />
          </div>
          <h1 className="text-4xl font-[1000] text-slate-900 dark:text-white tracking-tight">Profit & Loss Analysis</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
            This module is currently being optimized for your {businessType.toLowerCase()} intelligence operations. 
            Full neural integration is scheduled for the next deployment phase.
          </p>
        </div>

        <Card className="border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-sm">
          <CardContent className="p-0 space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
               <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Status</span>
               <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase tracking-tighter">In Development</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
               <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Priority</span>
               <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 text-[10px] font-black uppercase tracking-tighter">High Tier</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
