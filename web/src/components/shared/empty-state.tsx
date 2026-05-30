"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction 
}: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-12 text-center"
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/10 blur-[40px] rounded-full scale-150 animate-pulse" />
        <div className="relative h-24 w-24 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 flex items-center justify-center">
          <Icon className="h-10 w-10 text-slate-300 dark:text-slate-700" />
        </div>
      </div>
      
      <div className="space-y-2 max-w-sm mx-auto">
        <h3 className="text-xl font-[1000] text-slate-900 dark:text-white uppercase tracking-tight">{title}</h3>
        <p className="text-sm font-medium text-slate-400 dark:text-slate-500 leading-relaxed uppercase tracking-widest text-[10px]">
          {description}
        </p>
      </div>

      {actionLabel && onAction && (
        <Button 
          onClick={onAction}
          className="mt-8 h-12 px-8 rounded-xl bg-slate-900 text-white dark:bg-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all hover:scale-105 active:scale-95"
        >
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
