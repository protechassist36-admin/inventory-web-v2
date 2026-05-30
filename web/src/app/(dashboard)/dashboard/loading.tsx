"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import Image from "next/image";

export default function DashboardLoading() {
  return (
    <div className="fixed inset-0 z-[300] bg-white dark:bg-slate-950 flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative mb-8"
      >
        <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full animate-pulse" />
        <div className="relative h-20 w-20 rounded-3xl overflow-hidden border-4 border-slate-900 dark:border-slate-800 shadow-2xl">
          <Image 
            src="/images/logo.jpeg" 
            alt="Protech Logo" 
            fill 
            className="object-cover"
          />
        </div>
      </motion.div>

      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Initializing Intelligence</span>
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
        </div>
        
        <div className="w-48 h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden relative">
          <motion.div
            initial={{ left: "-100%" }}
            animate={{ left: "100%" }}
            transition={{ 
              repeat: Infinity, 
              duration: 1.5, 
              ease: "easeInOut" 
            }}
            className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-primary to-transparent"
          />
        </div>
        
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest animate-pulse">Syncing African Trade Nodes...</p>
      </div>

      {/* Decorative Background Elements */}
      <div className="absolute top-[10%] left-[10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
    </div>
  );
}
